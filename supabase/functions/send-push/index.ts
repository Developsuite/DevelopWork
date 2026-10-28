import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("PUSH_WEBHOOK_SECRET")!;
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID")!;
const FIREBASE_CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL")!;
const FIREBASE_PRIVATE_KEY = (Deno.env.get("FIREBASE_PRIVATE_KEY") || "").replace(/\\n/g, "\n");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" },
});

const base64Url = (value: string | Uint8Array) => {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const getGoogleAccessToken = async () => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    iss: FIREBASE_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const pem = FIREBASE_PRIVATE_KEY.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const keyBytes = Uint8Array.from(atob(pem), (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const assertion = `${unsigned}.${base64Url(new Uint8Array(signature))}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) throw new Error(result.error_description || "Google OAuth failed");
  return result.access_token as string;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!WEBHOOK_SECRET || request.headers.get("Authorization") !== `Bearer ${WEBHOOK_SECRET}`) {
    return json({ error: "Unauthorized" }, 401);
  }
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    return json({ error: "Firebase secrets are not configured" }, 503);
  }

  try {
    const payload = await request.json();
    let notification = payload.record;
    if (!notification && payload.notification_id) {
      const result = await admin.from("notifications").select("*").eq("id", payload.notification_id).single();
      if (result.error) throw result.error;
      notification = result.data;
    }
    if (!notification?.recipient_id) return json({ error: "Missing notification record" }, 400);

    const { data: devices, error: deviceError } = await admin
      .from("push_devices")
      .select("id, token")
      .eq("user_id", notification.recipient_id)
      .eq("provider", "fcm")
      .eq("enabled", true);
    if (deviceError) throw deviceError;
    if (!devices?.length) return json({ delivered: 0, message: "No active Android devices" });

    const accessToken = await getGoogleAccessToken();
    const endpoint = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;
    const actionUrl = notification.action_url || notification.data?.action_url || "";

    const results = await Promise.all(devices.map(async (device) => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: device.token,
            notification: { title: notification.title, body: notification.message },
            data: {
              notification_id: String(notification.id),
              type: String(notification.type || "notification"),
              action_url: String(actionUrl),
              task_id: String(notification.task_id || ""),
            },
            android: {
              priority: "high",
              notification: { channel_id: "developwork_updates", sound: "default" },
            },
          },
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const status = body?.error?.details?.[0]?.errorCode;
        if (status === "UNREGISTERED" || status === "INVALID_ARGUMENT") {
          await admin.from("push_devices").update({ enabled: false }).eq("id", device.id);
        }
      }
      return { ok: response.ok, status: response.status };
    }));

    return json({ delivered: results.filter((result) => result.ok).length, attempted: results.length });
  } catch (error) {
    console.error("send-push failed", error);
    return json({ error: error instanceof Error ? error.message : "Push delivery failed" }, 500);
  }
});
