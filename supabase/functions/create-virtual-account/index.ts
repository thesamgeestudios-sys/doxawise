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
    if (!FLW_SECRET_KEY) throw new Error("FLW_SECRET_KEY not configured");
    const FIXIE_URL = Deno.env.get("FIXIE_URL");
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

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.virtual_account_number) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Virtual account already exists",
          data: {
            account_number: profile.virtual_account_number,
            bank_name: profile.virtual_account_bank,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const txRef = `DXW-${user.id.slice(0, 8)}-${Date.now()}`;
    
    // Use user's actual first and last name for the static VA
    const firstName = profile?.first_name || user.user_metadata?.first_name || "Doxawise";
    const lastName = profile?.last_name || user.user_metadata?.last_name || "User";
    const narration = profile?.business_name || user.user_metadata?.business_name || "Doxawise Account";
    const bvn = (profile?.bvn || user.user_metadata?.bvn || "").trim();
    const nin = (profile?.nin || user.user_metadata?.nin || "").trim();

    if (!bvn && !nin) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Please add your BVN or NIN in account settings before generating a virtual account.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create static virtual account with user's own name
    const flwRes = await undiciFetch("https://api.flutterwave.com/v3/virtual-account-numbers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        is_permanent: true,
        ...(bvn ? { bvn } : { nin }),
        tx_ref: txRef,
        phonenumber: profile?.phone || user.user_metadata?.phone || "",
        firstname: firstName,
        lastname: lastName,
        narration: narration,
      }),
      dispatcher: new ProxyAgent(FIXIE_URL),
    } as any);

    const flwData = await flwRes.json();
    console.log("Flutterwave VA response:", JSON.stringify(flwData));

    if (flwData.status === "success" && flwData.data) {
      await adminClient
        .from("profiles")
        .update({
          virtual_account_number: flwData.data.account_number,
          virtual_account_bank: flwData.data.bank_name,
          virtual_account_ref: txRef,
          flutterwave_customer_id: flwData.data.flw_ref || flwData.data.order_ref || null,
          business_name_locked: true,
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Virtual account created with your name",
          data: {
            account_number: flwData.data.account_number,
            bank_name: flwData.data.bank_name,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: flwData.message || "Failed to create virtual account", raw: flwData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
