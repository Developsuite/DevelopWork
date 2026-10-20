import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "DevelopWork <onboarding@resend.dev>";
const APP_URL = Deno.env.get("APP_URL") || "https://develop-work.vercel.app";

interface EmailPayload {
  to: string;
  subject: string;
  type: "task_assigned" | "meeting_scheduled" | "notification" | "custom";
  data: Record<string, unknown>;
}

function buildTaskAssignedHTML(data: Record<string, unknown>): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr><td style="background:#0055FE;padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">DevelopWork</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#5A6270;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">New Task Assigned</p>
          <h2 style="margin:0 0 24px;font-size:22px;color:#1A1F2E;font-weight:700;">${data.task_title || "Untitled Task"}</h2>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            ${data.description ? `<tr><td style="padding:8px 0;font-size:14px;color:#5A6270;line-height:1.6;">${data.description}</td></tr>` : ""}
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fc;border-radius:8px;padding:4px;">
            <tr>
              <td style="padding:12px 16px;font-size:12px;color:#5A6270;font-weight:600;border-bottom:1px solid #e4e7ec;">Priority</td>
              <td style="padding:12px 16px;font-size:14px;color:#1A1F2E;font-weight:600;border-bottom:1px solid #e4e7ec;">${data.priority || "Medium"}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:12px;color:#5A6270;font-weight:600;border-bottom:1px solid #e4e7ec;">Deadline</td>
              <td style="padding:12px 16px;font-size:14px;color:#1A1F2E;font-weight:600;border-bottom:1px solid #e4e7ec;">${data.deadline || "No deadline"}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:12px;color:#5A6270;font-weight:600;border-bottom:1px solid #e4e7ec;">Project</td>
              <td style="padding:12px 16px;font-size:14px;color:#1A1F2E;font-weight:600;border-bottom:1px solid #e4e7ec;">${data.project || "General"}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:12px;color:#5A6270;font-weight:600;">Assigned by</td>
              <td style="padding:12px 16px;font-size:14px;color:#1A1F2E;font-weight:600;">${data.assigned_by || "Admin"}</td>
            </tr>
          </table>

          <div style="margin-top:28px;text-align:center;">
            <a href="${APP_URL}" style="display:inline-block;background:#0055FE;color:#ffffff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">Open DevelopWork</a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;background:#f8f9fc;border-top:1px solid #e4e7ec;">
          <p style="margin:0;font-size:11px;color:#9BA3B0;text-align:center;">This email was sent by DevelopWork AI Command Center. You received it because a task was assigned to you.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildMeetingHTML(data: Record<string, unknown>): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:#0055FE;padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">DevelopWork</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#5A6270;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Meeting Scheduled</p>
          <h2 style="margin:0 0 24px;font-size:22px;color:#1A1F2E;font-weight:700;">${data.title || "Meeting"}</h2>
          <table width="100%" style="background:#f8f9fc;border-radius:8px;">
            <tr><td style="padding:12px 16px;font-size:12px;color:#5A6270;font-weight:600;border-bottom:1px solid #e4e7ec;">Date</td><td style="padding:12px 16px;font-size:14px;color:#1A1F2E;font-weight:600;border-bottom:1px solid #e4e7ec;">${data.date || ""}</td></tr>
            <tr><td style="padding:12px 16px;font-size:12px;color:#5A6270;font-weight:600;border-bottom:1px solid #e4e7ec;">Time</td><td style="padding:12px 16px;font-size:14px;color:#1A1F2E;font-weight:600;border-bottom:1px solid #e4e7ec;">${data.time || ""}</td></tr>
            <tr><td style="padding:12px 16px;font-size:12px;color:#5A6270;font-weight:600;">Platform</td><td style="padding:12px 16px;font-size:14px;color:#1A1F2E;font-weight:600;">${data.platform || "Google Meet"}</td></tr>
          </table>
          <div style="margin-top:28px;text-align:center;">
            <a href="${APP_URL}" style="display:inline-block;background:#0055FE;color:#ffffff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">Open DevelopWork</a>
          </div>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f8f9fc;border-top:1px solid #e4e7ec;"><p style="margin:0;font-size:11px;color:#9BA3B0;text-align:center;">Sent by DevelopWork AI Command Center.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildGenericHTML(data: Record<string, unknown>): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:#0055FE;padding:28px 32px;"><h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">DevelopWork</h1></td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;font-size:20px;color:#1A1F2E;font-weight:700;">${data.title || "Notification"}</h2>
          <p style="margin:0 0 24px;font-size:14px;color:#5A6270;line-height:1.6;">${data.message || ""}</p>
          <div style="text-align:center;"><a href="${APP_URL}" style="display:inline-block;background:#0055FE;color:#ffffff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">Open DevelopWork</a></div>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f8f9fc;border-top:1px solid #e4e7ec;"><p style="margin:0;font-size:11px;color:#9BA3B0;text-align:center;">Sent by DevelopWork AI Command Center.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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

    // Build HTML based on type
    let html: string;
    switch (payload.type) {
      case "task_assigned":
        html = buildTaskAssignedHTML(payload.data);
        break;
      case "meeting_scheduled":
        html = buildMeetingHTML(payload.data);
        break;
      default:
        html = buildGenericHTML(payload.data);
    }

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [payload.to],
        subject: payload.subject,
        html,
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
