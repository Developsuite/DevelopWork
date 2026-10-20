import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Send a message via Telegram Bot API
async function sendTelegramMessage(chatId: string | number, text: string, parseMode = "HTML") {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });
  return res.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Check if this is a Telegram webhook update or an internal send request
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // ── INTERNAL: Send a notification to an employee via Telegram ──
    if (action === "send") {
      // Authenticate caller (must be admin)
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await adminClient.from("profiles").select("role, tenant_id").eq("id", user.id).single();
      if (profile?.role !== "admin") {
        return new Response(JSON.stringify({ error: "Admin only" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { user_id, message } = await req.json();

      // Tenant check: the recipient must belong to the same workspace as the admin.
      const { data: recipient } = await adminClient.from("profiles").select("tenant_id").eq("id", user_id).single();
      if (!recipient || recipient.tenant_id !== profile.tenant_id) {
        return new Response(JSON.stringify({ error: "Recipient is not in your workspace" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Look up the employee's Telegram chat ID
      const { data: integration } = await adminClient
        .from("user_integrations")
        .select("external_chat_id")
        .eq("user_id", user_id)
        .eq("provider", "telegram")
        .is("disabled_at", null)
        .single();

      if (!integration?.external_chat_id) {
        return new Response(JSON.stringify({ error: "Employee has not connected Telegram" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await sendTelegramMessage(integration.external_chat_id, message);

      return new Response(JSON.stringify({ success: true, result }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── INTERNAL: Generate a one-time connection link for the logged-in user ──
    if (action === "connect" || action === "status") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Current connection state
      const { data: existing } = await adminClient
        .from("user_integrations")
        .select("external_chat_id, connected_at")
        .eq("user_id", user.id)
        .eq("provider", "telegram")
        .is("disabled_at", null)
        .maybeSingle();

      const connected = !!existing?.external_chat_id;

      if (action === "status") {
        return new Response(JSON.stringify({ connected, connected_at: existing?.connected_at || null }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // action === "connect": generate a fresh one-time token
      const { data: profile } = await adminClient.from("profiles").select("tenant_id").eq("id", user.id).single();
      const token = crypto.randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

      await adminClient.from("integration_connection_tokens").insert({
        user_id: user.id,
        tenant_id: profile?.tenant_id || null,
        provider: "telegram",
        token_hash: token,
        expires_at: expiresAt,
      });

      // Fetch the bot username so the deep link is always correct
      let botUsername = "";
      try {
        const me = await fetch(`${TELEGRAM_API}/getMe`).then((r) => r.json());
        botUsername = me?.result?.username || "";
      } catch (_) { /* ignore */ }

      const deepLink = botUsername
        ? `https://t.me/${botUsername}?start=${token}`
        : null;

      return new Response(JSON.stringify({ deep_link: deepLink, bot_username: botUsername, token, expires_at: expiresAt, connected }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── TELEGRAM WEBHOOK: Handle incoming bot messages ──
    const update = await req.json();
    const msg = update.message;

    if (!msg?.text || !msg?.chat?.id) {
      return new Response("ok");
    }

    const chatId = msg.chat.id;
    const text = msg.text.trim();

    // Handle /start with connection token
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const token = parts[1];

      if (!token) {
        await sendTelegramMessage(chatId,
          "👋 <b>Welcome to DevelopWork Notifications!</b>\n\n" +
          "To connect your account, use the <b>Connect Telegram</b> button in your DevelopWork Settings.\n\n" +
          "You'll receive task assignments, meeting reminders, and other notifications here."
        );
        return new Response("ok");
      }

      // Validate the connection token
      const { data: tokenRecord } = await adminClient
        .from("integration_connection_tokens")
        .select("*")
        .eq("token_hash", token)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!tokenRecord) {
        await sendTelegramMessage(chatId, "❌ This connection link has expired or already been used. Please generate a new one from DevelopWork Settings.");
        return new Response("ok");
      }

      // Save the integration
      await adminClient.from("user_integrations").upsert({
        user_id: tokenRecord.user_id,
        tenant_id: tokenRecord.tenant_id,
        provider: "telegram",
        external_chat_id: String(chatId),
        connected_at: new Date().toISOString(),
        disabled_at: null,
      }, { onConflict: "user_id,provider" });

      // Mark token as used
      await adminClient.from("integration_connection_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokenRecord.id);

      await sendTelegramMessage(chatId,
        "✅ <b>Connected successfully!</b>\n\n" +
        "You'll now receive DevelopWork notifications here.\n" +
        "To disconnect, use your DevelopWork Settings page."
      );
      return new Response("ok");
    }

    // Handle /disconnect
    if (text === "/disconnect") {
      const { data: integration } = await adminClient
        .from("user_integrations")
        .select("*")
        .eq("external_chat_id", String(chatId))
        .eq("provider", "telegram")
        .is("disabled_at", null)
        .single();

      if (integration) {
        await adminClient.from("user_integrations")
          .update({ disabled_at: new Date().toISOString() })
          .eq("id", integration.id);
        await sendTelegramMessage(chatId, "✅ Disconnected. You'll no longer receive DevelopWork notifications.");
      } else {
        await sendTelegramMessage(chatId, "You don't have an active DevelopWork connection.");
      }
      return new Response("ok");
    }

    // Default response
    await sendTelegramMessage(chatId,
      "I'm the DevelopWork notification bot. I'll send you task assignments and updates.\n\n" +
      "Commands:\n/start — Connect your account\n/disconnect — Stop notifications"
    );
    return new Response("ok");

  } catch (err) {
    console.error("[telegram-webhook] Error:", err);
    return new Response("ok");
  }
});
