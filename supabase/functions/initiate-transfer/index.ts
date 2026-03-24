import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FEE_PERCENT = 0.3;
const FEE_CAP = 1000;

function calculateFee(amount: number): number {
  return Math.min((FEE_PERCENT / 100) * amount, FEE_CAP);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FLW_SECRET_KEY = Deno.env.get("FLW_SECRET_KEY");
    if (!FLW_SECRET_KEY) throw new Error("FLW_SECRET_KEY not configured");

    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { account_bank, account_number, amount, narration, recipient_name, payment_id } = await req.json();

    if (!account_bank || !account_number || !amount || amount < 100) {
      throw new Error("Invalid transfer parameters");
    }

    const fee = calculateFee(amount);
    const reference = `PSW-TRF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!profile) throw new Error("Profile not found");

    const totalDebit = amount + fee;

    if ((profile.wallet_balance || 0) < totalDebit) {
      throw new Error(`Insufficient wallet balance. Need ₦${totalDebit.toLocaleString()}, have ₦${(profile.wallet_balance || 0).toLocaleString()}`);
    }

    const flwRes = await fetch("https://api.flutterwave.com/v3/transfers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_bank,
        account_number,
        amount,
        narration: narration || `Payment from ${profile.business_name}`,
        currency: "NGN",
        reference,
        debit_currency: "NGN",
        beneficiary_name: recipient_name || "",
      }),
    });

    const flwData = await flwRes.json();

    if (flwData.status === "success") {
      const newBalance = (profile.wallet_balance || 0) - totalDebit;

      await adminClient
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("user_id", user.id);

      await adminClient.from("transactions").insert({
        user_id: user.id,
        type: "debit",
        amount: totalDebit,
        description: `Transfer to ${recipient_name || account_number} (Fee: ₦${fee.toFixed(2)})`,
        reference,
        balance_after: newBalance,
      });

      if (payment_id) {
        await adminClient
          .from("scheduled_payments")
          .update({ status: "completed", flutterwave_ref: flwData.data?.id?.toString() || reference })
          .eq("id", payment_id);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Transfer initiated", data: flwData.data, new_balance: newBalance }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      if (payment_id) {
        await adminClient
          .from("scheduled_payments")
          .update({ status: "failed", failure_reason: flwData.message || "Transfer failed" })
          .eq("id", payment_id);
      }

      return new Response(
        JSON.stringify({ success: false, message: flwData.message || "Transfer failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
