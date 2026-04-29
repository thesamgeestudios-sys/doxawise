import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetch as undiciFetch, ProxyAgent } from "npm:undici@6.19.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FLW_SECRET_KEY = Deno.env.get("FLW_SECRET_KEY");
    const FLW_ENCRYPTION_KEY = Deno.env.get("FLW_ENCRYPTION_KEY");
    if (!FLW_SECRET_KEY) throw new Error("FLW_SECRET_KEY not configured");
    if (!FLW_ENCRYPTION_KEY) throw new Error("FLW_ENCRYPTION_KEY not configured");
    const FIXIE_URL = Deno.env.get("FIXIE_URL");
    if (!FIXIE_URL) throw new Error("FIXIE_URL not configured");
    const proxyAgent = new ProxyAgent(FIXIE_URL);

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

    if (action === "initialize") {
      const { card_number, cvv, expiry_month, expiry_year, amount } = body;
      const txRef = `PSW-TOKEN-${Date.now()}`;

      const payload = {
        card_number,
        cvv,
        expiry_month,
        expiry_year,
        currency: "NGN",
        amount: amount || 50,
        email: user.email,
        tx_ref: txRef,
        redirect_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/tokenize-card`,
      };

      const chargeRes = await undiciFetch("https://api.flutterwave.com/v3/charges?type=card", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        dispatcher: proxyAgent,
      } as any);

      const chargeData = await chargeRes.json();

      return new Response(
        JSON.stringify({ success: true, data: chargeData.data, meta: chargeData.meta }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "validate") {
      const { flw_ref, otp } = body;

      const validateRes = await undiciFetch("https://api.flutterwave.com/v3/validate-charge", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp, flw_ref, type: "card" }),
        dispatcher: proxyAgent,
      } as any);

      const validateData = await validateRes.json();

      if (validateData.status === "success" && validateData.data?.card?.token) {
        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const card = validateData.data.card;
        const existingCards = await adminClient
          .from("tokenized_cards")
          .select("id")
          .eq("user_id", user.id);

        await adminClient.from("tokenized_cards").insert({
          user_id: user.id,
          last4: card.last_4digits || card.last4 || "****",
          brand: card.type || card.brand || "Card",
          expiry: `${card.expiry || ""}`,
          flutterwave_token: card.token,
          is_default: (existingCards.data?.length || 0) === 0,
        });

        return new Response(
          JSON.stringify({ success: true, message: "Card tokenized successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, message: validateData.message || "Validation failed", data: validateData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action. Use 'initialize' or 'validate'");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
