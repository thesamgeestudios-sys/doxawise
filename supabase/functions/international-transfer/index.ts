import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const body = await req.json();
    const { action } = body;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get supported countries/currencies for international transfers
    if (action === "get_rates") {
      const { source_currency, destination_currency, amount } = body;
      
      const rateRes = await fetch(
        `https://api.flutterwave.com/v3/transfers/rates?amount=${amount}&destination_currency=${destination_currency}&source_currency=${source_currency || "NGN"}`,
        {
          headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
        }
      );
      const rateData = await rateRes.json();
      
      return new Response(
        JSON.stringify({ success: rateData.status === "success", data: rateData.data, message: rateData.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // List supported banks for a country
    if (action === "get_country_banks") {
      const { country } = body;
      const bankRes = await fetch(
        `https://api.flutterwave.com/v3/banks/${country}`,
        { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
      );
      const bankData = await bankRes.json();
      
      return new Response(
        JSON.stringify({ success: bankData.status === "success", banks: bankData.data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initiate international transfer
    if (action === "transfer") {
      const {
        account_bank,
        account_number,
        amount,
        currency,
        destination_currency,
        beneficiary_name,
        narration,
        meta,
      } = body;

      if (!account_bank || !account_number || !amount || !currency) {
        throw new Error("Missing required transfer parameters");
      }

      const { data: profile } = await adminClient
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // For international, we first get the rate to know how much NGN to debit
      const rateRes = await fetch(
        `https://api.flutterwave.com/v3/transfers/rates?amount=${amount}&destination_currency=${destination_currency || currency}&source_currency=NGN`,
        { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
      );
      const rateData = await rateRes.json();

      const ngnAmount = rateData.data?.source?.amount || amount;
      const fee = Math.min((0.3 / 100) * ngnAmount, 1000);
      const totalDebit = ngnAmount + fee;

      if ((profile.wallet_balance || 0) < totalDebit) {
        throw new Error(`Insufficient balance. Need ₦${totalDebit.toLocaleString()}, have ₦${(profile.wallet_balance || 0).toLocaleString()}`);
      }

      const reference = `DXW-INTL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
          narration: narration || `International transfer from ${profile.business_name}`,
          currency: destination_currency || currency,
          reference,
          debit_currency: "NGN",
          beneficiary_name: beneficiary_name || "",
          meta: meta || [],
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
          description: `International transfer: ${amount} ${destination_currency || currency} to ${beneficiary_name || account_number} (Fee: ₦${fee.toFixed(2)})`,
          reference,
          balance_after: newBalance,
        });

        return new Response(
          JSON.stringify({ success: true, message: "International transfer initiated", data: flwData.data, new_balance: newBalance }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, message: flwData.message || "Transfer failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    throw new Error("Invalid action");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
