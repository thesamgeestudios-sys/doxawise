import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { transaction_id, receipt_pdf_url, receipt_image_url } = await req.json();
    if (!transaction_id || typeof transaction_id !== "string") throw new Error("transaction_id is required");
    if (!receipt_pdf_url || !String(receipt_pdf_url).startsWith("data:application/pdf")) throw new Error("Valid PDF receipt data is required");
    if (!receipt_image_url || !String(receipt_image_url).startsWith("data:image/jpeg")) throw new Error("Valid JPG receipt data is required");

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: transaction } = await adminClient
      .from("transactions")
      .select("id,user_id,status")
      .eq("id", transaction_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!transaction) throw new Error("Transaction not found");
    if (transaction.status && !["completed", "processing"].includes(transaction.status)) {
      throw new Error("Receipt can only be stored for successful transactions");
    }

    const { error: updateError } = await adminClient
      .from("transactions")
      .update({
        receipt_pdf_url,
        receipt_image_url,
        receipt_status: "generated",
        receipt_generated_at: new Date().toISOString(),
      })
      .eq("id", transaction_id)
      .eq("user_id", user.id);

    if (updateError) throw updateError;
    return json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ success: false, error: message }, message === "Unauthorized" ? 401 : 400);
  }
});