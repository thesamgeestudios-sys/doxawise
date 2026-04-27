import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, verif-hash",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FLW_SECRET_KEY = Deno.env.get("FLW_SECRET_KEY");
    if (!FLW_SECRET_KEY) throw new Error("FLW_SECRET_KEY not configured");

    // Verify webhook hash - use dedicated FLW_WEBHOOK_HASH or fallback to secret key
    const secretHash = req.headers.get("verif-hash");
    const expectedHash = Deno.env.get("FLW_WEBHOOK_HASH") || FLW_SECRET_KEY;
    
    if (!secretHash || secretHash !== expectedHash) {
      console.log("Invalid webhook hash. Received:", secretHash, "Expected:", expectedHash?.slice(0, 10) + "...");
      return new Response(JSON.stringify({ status: "invalid hash" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    console.log("Webhook event:", payload.event, "Data ID:", payload.data?.id);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if ((payload.event === "transfer.completed" || payload.event === "transfer.failed") && payload.data?.reference) {
      const reference = payload.data.reference;
      const status = payload.data.status === "SUCCESSFUL" || payload.data.status === "successful" ? "completed" : "failed";
      await adminClient.from("scheduled_payments").update({
        status,
        failure_reason: status === "failed" ? (payload.data.complete_message || payload.data.status || "Transfer failed") : null,
        flutterwave_ref: payload.data.id?.toString() || reference,
        transfer_id: payload.data.id?.toString() || "",
      }).eq("reference", reference);

      await adminClient.from("transactions").update({ status }).eq("reference", reference);

      return new Response(JSON.stringify({ status: "transfer updated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.event === "charge.completed" && payload.data?.status === "successful") {
      const { tx_ref, amount, id: txId } = payload.data;

      // Verify transaction with Flutterwave
      const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${txId}/verify`, {
        headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
      });
      const verifyData = await verifyRes.json();

      if (verifyData.status !== "success" || verifyData.data?.status !== "successful") {
        console.log("Transaction verification failed:", JSON.stringify(verifyData));
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

      // Try multiple matching strategies
      let profile = null;

      // 1. Match by tx_ref (virtual account ref)
      if (tx_ref) {
        const { data } = await adminClient
          .from("profiles")
          .select("*")
          .eq("virtual_account_ref", tx_ref)
          .single();
        if (data) profile = data;
      }

      // 2. Match by virtual account number
      if (!profile) {
        const acctNumber = payload.data?.virtual_account_number || payload.data?.account_number;
        if (acctNumber) {
          const { data } = await adminClient
            .from("profiles")
            .select("*")
            .eq("virtual_account_number", acctNumber)
            .single();
          if (data) profile = data;
        }
      }

      // 3. Match by customer email
      if (!profile && verifyData.data?.customer?.email) {
        const { data: authUsers } = await adminClient.auth.admin.listUsers();
        const matchedUser = authUsers?.users?.find(u => u.email === verifyData.data.customer.email);
        if (matchedUser) {
          const { data } = await adminClient
            .from("profiles")
            .select("*")
            .eq("user_id", matchedUser.id)
            .single();
          if (data) profile = data;
        }
      }

      if (!profile) {
        console.log("No matching profile found for tx_ref:", tx_ref);
        return new Response(JSON.stringify({ status: "no matching user" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check for duplicate transaction
      const { data: existingTx } = await adminClient
        .from("transactions")
        .select("id")
        .eq("reference", `FLW-${txId}`)
        .single();

      if (existingTx) {
        console.log("Duplicate transaction:", txId);
        return new Response(JSON.stringify({ status: "duplicate" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        description: `Deposit via ${payload.data?.payment_type || 'bank transfer'}`,
        reference: `FLW-${txId}`,
        balance_after: newBalance,
        sender_name: payload.data?.customer?.name || payload.data?.customer?.email || "External payer",
        receiver_name: profile.business_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
        receiver_account: profile.virtual_account_number || "",
        receiver_bank: profile.virtual_account_bank || "",
        status: "completed",
      });

      console.log(`Credited ${verifiedAmount} to user ${profile.user_id}. New balance: ${newBalance}`);

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
