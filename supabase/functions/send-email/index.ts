import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";
import { buildMeeting, buildMessage, buildTaskAssigned, type BuiltEmail } from "./templates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "DevelopWork <onboarding@resend.dev>";
const APP_URL = (Deno.env.get("APP_URL") || "https://develop-work.vercel.app").replace(/\/+$/, "");

interface EmailPayload {
  to: string;
  subject: string;
  type: "task_assigned" | "meeting_scheduled" | "notification" | "custom";
  data: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin check
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile } = await adminClient.from("profiles").select("role, tenant_id").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: EmailPayload = await req.json();

    // Tenant check: the recipient email must belong to someone in the admin's workspace.
    const { data: recipient } = await adminClient
      .from("profiles")
      .select("tenant_id")
      .ilike("email", payload.to)
      .maybeSingle();
    if (!recipient || recipient.tenant_id !== profile.tenant_id) {
      return new Response(JSON.stringify({ error: "Recipient is not in your workspace" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = payload.data || {};
    // Sender defaults to DevelopWork; an admin may set a custom display name, which is
    // always shown "via DevelopWork" so recipients can see where it came from.
    const customName = String(data.sender_name || "").replace(/[\r\n\t"<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
    const isCustom = customName !== "" && customName.toLowerCase() !== "developwork";
    const ctx = {
      appUrl: APP_URL,
      senderName: isCustom ? customName : "DevelopWork",
      senderTitle: isCustom ? "Sent via DevelopWork" : "Workspace notifications",
    };
    const fromAddress = FROM_EMAIL.match(/<([^>]+)>/)?.[1] || FROM_EMAIL.trim();
    const fromName = isCustom ? `${customName} via DevelopWork` : "DevelopWork";
    let email: BuiltEmail;
    switch (payload.type) {
      case "task_assigned":
        email = buildTaskAssigned(ctx, data);
        break;
      case "meeting_scheduled":
        email = buildMeeting(ctx, data);
        break;
      default:
        email = buildMessage(ctx, data, payload.subject);
    }

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromAddress}>`,
        to: [payload.to],
        subject: payload.subject,
        html: email.html,
        text: email.text,
        ...(user.email ? { reply_to: user.email } : {}),
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("[send-email] Resend error:", resendData);
      return new Response(JSON.stringify({ error: "Email delivery failed", details: resendData }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log to notification_outbox (best effort)
    try {
      await adminClient.from("notification_outbox").insert({
        recipient_email: payload.to,
        channel: "email",
        event_type: payload.type,
        payload: payload.data,
        status: "delivered",
        provider_message_id: resendData.id,
        sent_at: new Date().toISOString(),
      });
    } catch (_) { /* don't fail */ }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-email] Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
