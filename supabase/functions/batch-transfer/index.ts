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

    const { transfers } = await req.json();
    // transfers: Array<{ staff_id, account_bank, account_number, amount, recipient_name }>

    if (!Array.isArray(transfers) || transfers.length === 0) {
      throw new Error("No transfers provided");
    }

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

    // Calculate total needed
    let totalNeeded = 0;
    for (const t of transfers) {
      const fee = calculateFee(t.amount);
      totalNeeded += t.amount + fee;
    }

    if ((profile.wallet_balance || 0) < totalNeeded) {
      throw new Error(
        `Insufficient balance. Need ₦${totalNeeded.toLocaleString()}, have ₦${(profile.wallet_balance || 0).toLocaleString()}`
      );
    }

    const results: any[] = [];
    let runningBalance = profile.wallet_balance || 0;

    for (const t of transfers) {
      const fee = calculateFee(t.amount);
      const reference = `PSW-BATCH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      try {
        const flwRes = await fetch("https://api.flutterwave.com/v3/transfers", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FLW_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account_bank: t.account_bank,
            account_number: t.account_number,
            amount: t.amount,
            narration: `Payment from ${profile.business_name}`,
            currency: "NGN",
            reference,
            debit_currency: "NGN",
            beneficiary_name: t.recipient_name || "",
          }),
        });

        const flwData = await flwRes.json();

        if (flwData.status === "success") {
          runningBalance -= (t.amount + fee);

          await adminClient.from("profiles").update({ wallet_balance: runningBalance }).eq("user_id", user.id);
          await adminClient.from("transactions").insert({
            user_id: user.id,
            type: "debit",
            amount: t.amount + fee,
            description: `Batch transfer to ${t.recipient_name || t.account_number} (Fee: ₦${fee.toFixed(2)})`,
            reference,
            balance_after: runningBalance,
            sender_name: profile.business_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
            sender_account: profile.virtual_account_number || "",
            sender_bank: profile.virtual_account_bank || "",
            receiver_name: t.recipient_name || "",
            receiver_account: t.account_number,
            receiver_bank: t.account_bank,
            status: "completed",
            receipt_status: "generated",
            receipt_generated_at: new Date().toISOString(),
            payment_method: "Bank Transfer",
            business_name: profile.business_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
            contact_info: profile.phone || user.email || "",
          });

          // Update scheduled_payment if staff_id provided
          if (t.payment_id) {
            await adminClient.from("scheduled_payments")
              .update({ status: "completed", flutterwave_ref: flwData.data?.id?.toString() || reference })
              .eq("id", t.payment_id);
          }

          results.push({ recipient: t.recipient_name, status: "success", amount: t.amount });
        } else {
          if (t.payment_id) {
            await adminClient.from("scheduled_payments")
              .update({ status: "failed", failure_reason: flwData.message || "Transfer failed" })
              .eq("id", t.payment_id);
          }
          results.push({ recipient: t.recipient_name, status: "failed", error: flwData.message });
        }
      } catch (err) {
        results.push({ recipient: t.recipient_name, status: "failed", error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    const successCount = results.filter(r => r.status === "success").length;
    const failCount = results.filter(r => r.status === "failed").length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Batch complete: ${successCount} succeeded, ${failCount} failed`,
        results,
        new_balance: runningBalance,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
