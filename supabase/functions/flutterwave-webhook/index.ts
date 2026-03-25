import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FLW_SECRET_KEY = Deno.env.get("FLW_SECRET_KEY");
    if (!FLW_SECRET_KEY) throw new Error("FLW_SECRET_KEY not configured");

    // Verify webhook hash
    const secretHash = req.headers.get("verif-hash");
    const expectedHash = Deno.env.get("FLW_WEBHOOK_HASH") || FLW_SECRET_KEY;
    
    if (secretHash !== expectedHash) {
      console.log("Invalid webhook hash");
      return new Response(JSON.stringify({ status: "invalid hash" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    console.log("Webhook payload:", JSON.stringify(payload));

    if (payload.event === "charge.completed" && payload.data?.status === "successful") {
      const { tx_ref, amount, currency, id: txId } = payload.data;

      // Verify transaction with Flutterwave
      const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${txId}/verify`, {
        headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
      });
      const verifyData = await verifyRes.json();

      if (verifyData.status !== "success" || verifyData.data?.status !== "successful") {
        console.log("Transaction verification failed:", verifyData);
        return new Response(JSON.stringify({ status: "verification failed" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const verifiedAmount = verifyData.data.amount;
      const verifiedCurrency = verifyData.data.currency;

      if (verifiedCurrency !== "NGN") {
        return new Response(JSON.stringify({ status: "unsupported currency" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Find user by virtual account ref
      const { data: profile } = await adminClient
        .from("profiles")
        .select("*")
        .or(`virtual_account_ref.eq.${tx_ref},virtual_account_number.eq.${payload.data?.account_number || ''}`)
        .limit(1)
        .single();

      if (!profile) {
        // Try matching by virtual_account_number from meta
        const acctNumber = payload.data?.virtual_account_number || payload.data?.account_number;
        if (acctNumber) {
          const { data: profileByAcct } = await adminClient
            .from("profiles")
            .select("*")
            .eq("virtual_account_number", acctNumber)
            .single();
          
          if (profileByAcct) {
            const newBalance = (profileByAcct.wallet_balance || 0) + verifiedAmount;
            await adminClient.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", profileByAcct.user_id);
            await adminClient.from("transactions").insert({
              user_id: profileByAcct.user_id,
              type: "credit",
              amount: verifiedAmount,
              description: `Virtual account deposit via ${payload.data?.payment_type || 'transfer'}`,
              reference: `FLW-${txId}`,
              balance_after: newBalance,
            });
            
            return new Response(JSON.stringify({ status: "success" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        
        console.log("No matching profile found for tx_ref:", tx_ref);
        return new Response(JSON.stringify({ status: "no matching user" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Credit wallet
      const newBalance = (profile.wallet_balance || 0) + verifiedAmount;
      await adminClient.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", profile.user_id);

      // Log transaction
      await adminClient.from("transactions").insert({
        user_id: profile.user_id,
        type: "credit",
        amount: verifiedAmount,
        description: `Virtual account deposit via ${payload.data?.payment_type || 'transfer'}`,
        reference: `FLW-${txId}`,
        balance_after: newBalance,
      });

      return new Response(JSON.stringify({ status: "success" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: "event ignored" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
