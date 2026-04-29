import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    if (!FLW_SECRET_KEY) throw new Error("FLW_SECRET_KEY not configured");
    const FIXIE_URL = Deno.env.get("FIXIE_URL");
    if (!FIXIE_URL) throw new Error("FIXIE_URL not configured");

    const res = await undiciFetch("https://api.flutterwave.com/v3/banks/NG", {
      headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
      dispatcher: new ProxyAgent(FIXIE_URL),
    } as any);

    const data = await res.json();

    return new Response(
      JSON.stringify({ success: true, banks: data.data || [] }),
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
