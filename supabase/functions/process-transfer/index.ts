import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetch as undiciFetch, ProxyAgent } from "npm:undici@6.19.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FEE_PERCENT = 0.3;
const FEE_CAP = 1000;

function calculateFee(amount: number) {
  return Math.min((FEE_PERCENT / 100) * amount, FEE_CAP);
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  try {
    const FLW_SECRET_KEY = Deno.env.get("FLW_SECRET_KEY");
    const FIXIE_URL = Deno.env.get("FIXIE_URL");
    if (!FLW_SECRET_KEY) throw new Error("FLW_SECRET_KEY not configured");
    if (!FIXIE_URL) throw new Error("FIXIE_URL not configured");

    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const account_bank = String(body.account_bank || "");
    const account_number = String(body.account_number || "");
    const amount = Number(body.amount || 0);
    const currency = String(body.currency || "NGN");
    const narration = String(body.narration || "Doxawise transfer");
    const reference = String(body.reference || `DXW-TRF-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`);
    const recipient_name = String(body.recipient_name || "");
    const payment_id = body.payment_id ? String(body.payment_id) : "";

    if (!account_bank || !account_number || !amount || amount < 100 || !currency || !reference) {
      return json({ success: false, error: "account_bank, account_number, amount, currency, narration, and reference are required" }, 400);
    }

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await adminClient.from("profiles").select("*").eq("user_id", user.id).single();
    if (!profile) throw new Error("Profile not found");

    const fee = calculateFee(amount);
    const totalDebit = amount + fee;
    if ((Number(profile.wallet_balance) || 0) < totalDebit) {
      throw new Error(`Insufficient wallet balance. Need ₦${totalDebit.toLocaleString()}, have ₦${(Number(profile.wallet_balance) || 0).toLocaleString()}`);
    }

    const proxyAgent = new ProxyAgent(FIXIE_URL);
    const flwRes = await undiciFetch("https://api.flutterwave.com/v3/transfers", {
      method: "POST",
      dispatcher: proxyAgent,
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_bank,
        account_number,
        amount,
        currency,
        debit_currency: currency,
        narration,
        reference,
        beneficiary_name: recipient_name,
      }),
    } as any);

    const flwData = await flwRes.json();

    if (flwRes.ok && flwData.status === "success") {
      const newBalance = (Number(profile.wallet_balance) || 0) - totalDebit;
      const transferId = flwData.data?.id?.toString() || "";
      await adminClient.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", user.id);
      const { data: transaction } = await adminClient.from("transactions").insert({
        user_id: user.id,
        type: "debit",
        amount: totalDebit,
        description: `Transfer to ${recipient_name || account_number} (Fee: ₦${fee.toFixed(2)})`,
        reference,
        balance_after: newBalance,
        sender_name: profile.business_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
        sender_account: profile.virtual_account_number || "",
        sender_bank: profile.virtual_account_bank || "",
        receiver_name: recipient_name,
        receiver_account: account_number,
        receiver_bank: account_bank,
        status: "processing",
        receipt_status: "generated",
        receipt_generated_at: new Date().toISOString(),
        payment_method: "Bank Transfer",
        business_name: profile.business_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
        contact_info: profile.phone || user.email || "",
      }).select("*").single();
      if (payment_id) {
        await adminClient.from("scheduled_payments").update({ status: "processing", reference, transfer_id: transferId, flutterwave_ref: transferId, processed_at: new Date().toISOString() }).eq("id", payment_id);
      }
      return json({ success: true, data: flwData, reference, transfer_id: transferId, new_balance: newBalance, transaction });
    }

    if (payment_id) {
      await adminClient.from("scheduled_payments").update({ status: "failed", failure_reason: flwData.message || "Transfer failed", reference }).eq("id", payment_id);
    }
    return json({ success: false, data: flwData, message: flwData.message || "Transfer failed" }, flwRes.status || 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ success: false, error: message }, message === "Unauthorized" ? 401 : 400);
  }
});
