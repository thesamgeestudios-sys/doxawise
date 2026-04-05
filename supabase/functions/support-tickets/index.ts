import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const body = await req.json();
    const { action } = body;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "create_ticket") {
      const { subject, message } = body;
      if (!subject || !message) throw new Error("Subject and message required");

      const { data, error } = await adminClient.from("support_tickets").insert({
        user_id: user.id, subject, message,
      }).select().single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reply_ticket") {
      // Admin only
      const { data: roles } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      if (!roles || roles.length === 0) throw new Error("Admin access required");

      const { ticket_id, reply, status } = body;
      const updates: any = {};
      if (reply) updates.admin_reply = reply;
      if (status) updates.status = status;

      const { error } = await adminClient.from("support_tickets").update(updates).eq("id", ticket_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send_message") {
      // Admin only
      const { data: roles } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      if (!roles || roles.length === 0) throw new Error("Admin access required");

      const { recipient_user_id, subject, message, is_broadcast } = body;
      
      if (is_broadcast) {
        // Get all users
        const { data: profiles } = await adminClient.from("profiles").select("user_id");
        if (profiles) {
          const messages = profiles.map(p => ({
            recipient_user_id: p.user_id,
            subject, message, is_broadcast: true,
          }));
          await adminClient.from("admin_messages").insert(messages);
        }
      } else {
        await adminClient.from("admin_messages").insert({
          recipient_user_id, subject, message, is_broadcast: false,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
