import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetch as undiciFetch, ProxyAgent } from "npm:undici@6.19.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function flutterwaveRequest(url: string, init: RequestInit, proxyAgent: ProxyAgent) {
  try {
    return await undiciFetch(url, { ...init, dispatcher: proxyAgent } as any);
  } catch (error) {
    console.error("Flutterwave virtual card request failed", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FLW_SECRET_KEY = Deno.env.get("FLW_SECRET_KEY");
    const FIXIE_URL = Deno.env.get("FIXIE_URL");
    if (!FLW_SECRET_KEY) throw new Error("FLW_SECRET_KEY not configured");
    if (!FIXIE_URL) throw new Error("FIXIE_URL not configured");

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

    if (action === "create") {
      const { amount, currency } = body;

      const { data: profile } = await adminClient
        .from("profiles")
        .select("first_name, last_name, bvn, bvn_verified, wallet_balance")
        .eq("user_id", user.id)
        .single();

      const fundingAmount = amount || 0;

      // Create virtual card via Flutterwave
      const proxyAgent = new ProxyAgent(FIXIE_URL);
      const flwRes = await flutterwaveRequest("https://api.flutterwave.com/v3/virtual-cards", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currency: currency || "NGN",
          amount: fundingAmount,
          billing_name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || user.email,
          billing_address: "Lagos, Nigeria",
          billing_city: "Lagos",
          billing_state: "LA",
          billing_postal_code: "100001",
          billing_country: "NG",
          first_name: profile?.first_name || "",
          last_name: profile?.last_name || "",
          date_of_birth: "1990/01/01",
          email: user.email,
          phone: "08000000000",
          title: "Mr",
          gender: "M",
          callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/create-virtual-card`,
        }),
      }, proxyAgent);

      if (!flwRes) {
        return new Response(
          JSON.stringify({ success: false, message: "Virtual card service is temporarily unreachable through the configured static IP. Please try again shortly." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const flwData = await flwRes.json();
      console.log("Flutterwave virtual card response:", JSON.stringify(flwData));

      if (flwData.status === "success" && flwData.data) {
        const card = flwData.data;

        // Save virtual card to database
        await adminClient.from("virtual_cards").insert({
          user_id: user.id,
          card_id: card.id,
          card_pan: card.card_pan || card.masked_pan || "",
          masked_pan: card.masked_pan || `****${(card.card_pan || "").slice(-4)}`,
          cvv: card.cvv || "",
          expiration: card.expiration || "",
          card_type: card.card_type || "virtual",
          name_on_card: card.name_on_card || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
          currency: card.currency || "NGN",
          amount: fundingAmount,
          status: card.status || "active",
          flutterwave_ref: card.id?.toString() || "",
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: "Virtual card created successfully",
            data: {
              id: card.id,
              masked_pan: card.masked_pan || `****${(card.card_pan || "").slice(-4)}`,
              expiration: card.expiration,
              cvv: card.cvv,
              card_type: card.card_type,
              currency: card.currency || "NGN",
              amount: fundingAmount,
              status: card.status || "active",
              name_on_card: card.name_on_card,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        const errorMsg = flwData.message?.includes("contact your account administrator")
          ? "Virtual card creation is not enabled for this payment account yet. Please ask Flutterwave to enable Virtual Cards and whitelist outbound IP 34.62.105.141."
          : flwData.message || "Failed to create virtual card";
        return new Response(
          JSON.stringify({ success: false, message: errorMsg, raw: flwData }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "fund") {
      const { card_id, amount } = body;

      const proxyAgent = new ProxyAgent(FIXIE_URL);
      const flwRes = await flutterwaveRequest(`https://api.flutterwave.com/v3/virtual-cards/${card_id}/fund`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          debit_currency: "NGN",
          amount,
        }),
      }, proxyAgent);

      if (!flwRes) return new Response(JSON.stringify({ success: false, message: "Virtual card service is temporarily unreachable. Please try again shortly." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const flwData = await flwRes.json();

      if (flwData.status === "success") {
        // Update card amount in DB
        const { data: existing } = await adminClient
          .from("virtual_cards")
          .select("amount")
          .eq("card_id", card_id.toString())
          .eq("user_id", user.id)
          .single();

        if (existing) {
          await adminClient
            .from("virtual_cards")
            .update({ amount: (existing.amount || 0) + amount })
            .eq("card_id", card_id.toString())
            .eq("user_id", user.id);
        }

        return new Response(
          JSON.stringify({ success: true, message: "Card funded successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, message: flwData.message || "Failed to fund card" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "block" || action === "unblock") {
      const { card_id } = body;
      const status = action === "block" ? "block" : "unblock";

      const proxyAgent = new ProxyAgent(FIXIE_URL);
      const flwRes = await flutterwaveRequest(`https://api.flutterwave.com/v3/virtual-cards/${card_id}/status/${status}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }, proxyAgent);

      if (!flwRes) return new Response(JSON.stringify({ success: false, message: "Virtual card service is temporarily unreachable. Please try again shortly." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const flwData = await flwRes.json();

      if (flwData.status === "success") {
        await adminClient
          .from("virtual_cards")
          .update({ status: action === "block" ? "blocked" : "active" })
          .eq("card_id", card_id.toString())
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({ success: true, message: `Card ${action}ed successfully` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, message: flwData.message || `Failed to ${action} card` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "terminate") {
      const { card_id } = body;

      const proxyAgent = new ProxyAgent(FIXIE_URL);
      const flwRes = await flutterwaveRequest(`https://api.flutterwave.com/v3/virtual-cards/${card_id}/terminate`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }, proxyAgent);

      if (!flwRes) return new Response(JSON.stringify({ success: false, message: "Virtual card service is temporarily unreachable. Please try again shortly." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const flwData = await flwRes.json();

      if (flwData.status === "success") {
        await adminClient
          .from("virtual_cards")
          .update({ status: "terminated" })
          .eq("card_id", card_id.toString())
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({ success: true, message: "Card terminated successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, message: flwData.message || "Failed to terminate card" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "list") {
      const { data: cards } = await adminClient
        .from("virtual_cards")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "terminated")
        .order("created_at", { ascending: false });

      return new Response(
        JSON.stringify({ success: true, data: cards || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action. Use 'create', 'fund', 'block', 'unblock', 'terminate', or 'list'");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
