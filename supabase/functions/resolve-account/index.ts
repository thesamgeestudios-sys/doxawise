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

    const { account_number, account_bank } = await req.json();
    if (!account_number || !account_bank) throw new Error("Account number and bank code are required");

    let res: Response;
    try {
      const proxyAgent = new ProxyAgent(FIXIE_URL);
      res = await undiciFetch(
        `https://api.flutterwave.com/v3/accounts/resolve`,
        {
          method: "POST",
          dispatcher: proxyAgent,
          headers: {
            Authorization: `Bearer ${FLW_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ account_number, account_bank }),
        } as any
      );
    } catch (fetchError) {
      console.error("Flutterwave account resolve fetch failed", fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          fallback: true,
          error: "ACCOUNT_RESOLUTION_TEMPORARILY_UNAVAILABLE",
          message: "Account name lookup is temporarily unavailable. Please confirm the account details and try again shortly.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responseText = await res.text();
    let data: any = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      console.error("Flutterwave account resolve returned non-JSON response", res.status, responseText.slice(0, 500));
      return new Response(
        JSON.stringify({
          success: false,
          fallback: true,
          error: "ACCOUNT_RESOLUTION_BAD_RESPONSE",
          message: "Account name lookup is temporarily unavailable. Please try again shortly.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!res.ok) {
      console.error("Flutterwave account resolve HTTP error", res.status, data);
      const fallbackable = res.status >= 500 || res.status === 408 || res.status === 429;
      return new Response(
        JSON.stringify({
          success: false,
          fallback: fallbackable,
          message: data.message || "Could not resolve account",
          raw: data,
        }),
        { status: fallbackable ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.status === "success") {
      return new Response(
        JSON.stringify({ success: true, data: data.data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: data.message || "Could not resolve account", raw: data }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
