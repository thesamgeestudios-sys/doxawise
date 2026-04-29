import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetch as undiciFetch, ProxyAgent } from "npm:undici@6.19.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXPECTED_WEBHOOK_ENDPOINT = "https://xljgrelxrqtqfoijwuiv.supabase.co/functions/v1/flutterwave-webhook";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isCreator } = await adminClient.rpc("is_platform_creator", { _user_id: user.id });
    const { data: roles } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    if (!isCreator && (!roles || roles.length === 0)) throw new Error("Admin access required");

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const providedHash = typeof body.expected_hash === "string" ? body.expected_hash : "";
    const configuredHash = Deno.env.get("FLW_WEBHOOK_HASH") || "";
    const fixieUrl = Deno.env.get("FIXIE_URL") || "";
    const flwSecretKey = Deno.env.get("FLW_SECRET_KEY") || "";
    const endpoint = `${Deno.env.get("SUPABASE_URL")}/functions/v1/flutterwave-webhook`;

    let proxyCheck: "ok" | "failed" | "skipped" = "skipped";
    let proxyMessage = "Proxy check skipped because Fixie or Flutterwave secret is not configured.";

    if (fixieUrl && flwSecretKey) {
      try {
        const proxyAgent = new ProxyAgent(fixieUrl);
        const response = await undiciFetch("https://api.flutterwave.com/v3/banks/NG", {
          headers: { Authorization: `Bearer ${flwSecretKey}` },
          dispatcher: proxyAgent,
        } as any);
        proxyCheck = response.ok ? "ok" : "failed";
        proxyMessage = response.ok ? "Flutterwave responded through the configured Fixie proxy." : `Flutterwave proxy check returned HTTP ${response.status}.`;
      } catch (error) {
        proxyCheck = "failed";
        proxyMessage = error instanceof Error ? error.message : "Proxy connectivity check failed.";
      }
    }

    return new Response(JSON.stringify({
      success: true,
      endpoint,
      endpoint_matches_expected: endpoint === EXPECTED_WEBHOOK_ENDPOINT,
      webhook_hash_configured: configuredHash.length > 0,
      provided_hash_matches: providedHash ? providedHash === configuredHash : null,
      fixie_configured: fixieUrl.length > 0,
      flutterwave_proxy_check: proxyCheck,
      flutterwave_proxy_message: proxyMessage,
      checked_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
