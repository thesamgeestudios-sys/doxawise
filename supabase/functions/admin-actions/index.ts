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

    // Verify admin role
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) throw new Error("Admin access required");

    const body = await req.json();
    const { action } = body;

    if (action === "delete_user") {
      const { target_user_id } = body;
      if (!target_user_id) throw new Error("target_user_id required");

      // Get profile to check for virtual account
      const { data: profile } = await adminClient
        .from("profiles")
        .select("virtual_account_ref, virtual_account_number")
        .eq("user_id", target_user_id)
        .single();

      // Close virtual account on Flutterwave if exists
      if (profile?.virtual_account_ref) {
        const FLW_SECRET_KEY = Deno.env.get("FLW_SECRET_KEY");
        const FIXIE_URL = Deno.env.get("FIXIE_URL");
        if (FLW_SECRET_KEY) {
          try {
            // Attempt to close the VA on Flutterwave
            await undiciFetch(`https://api.flutterwave.com/v3/virtual-account-numbers/${profile.virtual_account_ref}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${FLW_SECRET_KEY}`,
                "Content-Type": "application/json",
              },
              ...(FIXIE_URL ? { dispatcher: new ProxyAgent(FIXIE_URL) } : {}),
            } as any);
          } catch (e) {
            console.log("VA deletion from Flutterwave failed (non-critical):", e);
          }
        }
      }

      // Delete virtual cards
      await adminClient.from("virtual_cards").delete().eq("user_id", target_user_id);
      // Delete tokenized cards
      await adminClient.from("tokenized_cards").delete().eq("user_id", target_user_id);
      // Delete scheduled payments
      await adminClient.from("scheduled_payments").delete().eq("user_id", target_user_id);
      // Delete transactions
      await adminClient.from("transactions").delete().eq("user_id", target_user_id);
      // Delete staff
      await adminClient.from("staff").delete().eq("user_id", target_user_id);
      // Delete user roles
      await adminClient.from("user_roles").delete().eq("user_id", target_user_id);
      // Delete profile
      await adminClient.from("profiles").delete().eq("user_id", target_user_id);
      // Delete auth user
      await adminClient.auth.admin.deleteUser(target_user_id);

      return new Response(
        JSON.stringify({ success: true, message: "User account fully deleted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update_user") {
      const { target_user_id, updates } = body;
      if (!target_user_id || !updates) throw new Error("target_user_id and updates required");

      const { error } = await adminClient
        .from("profiles")
        .update(updates)
        .eq("user_id", target_user_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: "User updated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
