import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const GOOGLE_REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI")!;
const GOOGLE_TOKEN_ENCRYPTION_KEY = Deno.env.get("GOOGLE_TOKEN_ENCRYPTION_KEY")!;
const APP_URL = (Deno.env.get("APP_URL") || "http://localhost:5173").replace(/\/$/, "");

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
];

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  tenant_id: string | null;
  assigned_module?: string | null;
  permissions?: string[] | null;
};

type CalendarEventInput = {
  meeting_id?: string;
  event_id?: string;
  calendar_id?: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration?: number;
  timezone?: string;
  location?: string;
  attendees?: Array<{ name?: string; email?: string }>;
  create_meet?: boolean;
};

type GoogleCalendarEvent = {
  id?: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
  extendedProperties?: {
    private?: Record<string, string>;
  };
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function toBase64Url(bytes: Uint8Array) {
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(digest));
}

async function encryptionKey() {
  const raw = fromBase64(GOOGLE_TOKEN_ENCRYPTION_KEY);
  if (raw.byteLength !== 32) {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptToken(token: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await encryptionKey(),
    new TextEncoder().encode(token),
  );
  return { encrypted: toBase64(new Uint8Array(encrypted)), iv: toBase64(iv) };
}

async function decryptToken(encrypted: string, iv: string) {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    await encryptionKey(),
    fromBase64(encrypted),
  );
  return new TextDecoder().decode(decrypted);
}

async function authenticatedProfile(req: Request): Promise<Profile> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Response(JSON.stringify({ error: "Missing authorization header" }), { status: 401, headers: jsonHeaders });

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) throw new Response(JSON.stringify({ error: "Invalid or expired session" }), { status: 401, headers: jsonHeaders });

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, name, email, role, tenant_id, assigned_module, permissions")
    .eq("id", user.id)
    .single();
  if (profileError || !profile) throw new Response(JSON.stringify({ error: "User profile not found" }), { status: 403, headers: jsonHeaders });
  return profile as Profile;
}

function tenantIdFor(profile: Profile) {
  return profile.tenant_id || profile.id;
}

function canManageMeetings(profile: Profile) {
  if (profile.role === "admin") return true;
  if (profile.role !== "manager") return false;
  const permissions = Array.isArray(profile.permissions) ? profile.permissions : [];
  return profile.assigned_module === "meetings" || permissions.some((permission) => permission === "meetings" || permission.startsWith("meetings."));
}

function safeReturnPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/meetings";
  return value;
}

async function getConnection(tenantId: string) {
  const { data, error } = await adminClient
    .from("google_calendar_connections")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getAccessToken(tenantId: string) {
  const connection = await getConnection(tenantId);
  if (!connection) throw new Error("Google Calendar is not connected for this workspace");

  const refreshToken = await decryptToken(connection.encrypted_refresh_token, connection.token_iv);
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    const message = tokenData.error_description || tokenData.error || "Unable to refresh Google access";
    await adminClient.from("google_calendar_connections").update({ last_error: message, updated_at: new Date().toISOString() }).eq("tenant_id", tenantId);
    throw new Error(message);
  }
  return { accessToken: tokenData.access_token as string, connection };
}

function addMinutes(date: string, time: string, duration: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const start = new Date(`${date}T00:00:00Z`);
  start.setUTCHours(hours, minutes + duration, 0, 0);
  const endDate = start.toISOString().slice(0, 10);
  const endTime = start.toISOString().slice(11, 19);
  return `${endDate}T${endTime}`;
}

function eventBody(input: CalendarEventInput, tenantId: string, includeConference: boolean) {
  const timezone = input.timezone || "Asia/Karachi";
  const duration = Math.max(1, Math.min(Number(input.duration) || 30, 1440));
  const attendees = Array.from(new Set((input.attendees || []).map((attendee) => attendee.email?.trim().toLowerCase()).filter(Boolean)))
    .map((email) => ({ email }));
  const body: Record<string, unknown> = {
    summary: input.title,
    description: input.description || "Scheduled from DevelopWork",
    location: input.location || undefined,
    start: { dateTime: `${input.date}T${input.time}:00`, timeZone: timezone },
    end: { dateTime: addMinutes(input.date, input.time, duration), timeZone: timezone },
    attendees,
    reminders: { useDefault: true },
    extendedProperties: {
      private: {
        developwork_tenant_id: tenantId,
        developwork_meeting_id: input.meeting_id || "pending",
      },
    },
  };
  if (includeConference) {
    body.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }
  return body;
}

function conferenceLink(event: GoogleCalendarEvent) {
  if (event.hangoutLink) return event.hangoutLink;
  const videoEntry = event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video");
  return videoEntry?.uri || "";
}

async function googleRequest(url: string, accessToken: string, init: RequestInit) {
  const result = await fetch(url, {
    ...init,
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (result.status === 204) return {};
  const data = await result.json().catch(() => ({}));
  if (!result.ok) throw new Error(data.error?.message || `Google Calendar request failed (${result.status})`);
  return data;
}

async function assertWorkspaceEvent(
  calendarId: string,
  eventId: string,
  accessToken: string,
  tenantId: string,
  meetingId?: string,
) {
  const event = await googleRequest(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(eventId)}`,
    accessToken,
    { method: "GET" },
  ) as GoogleCalendarEvent;
  const privateProperties = event.extendedProperties?.private || {};
  if (privateProperties.developwork_tenant_id !== tenantId) {
    throw response({ error: "This Google event does not belong to the current workspace" }, 403);
  }
  if (meetingId && privateProperties.developwork_meeting_id !== meetingId) {
    throw response({ error: "This Google event is linked to a different DevelopWork meeting" }, 403);
  }
  return event;
}

async function waitForConference(
  event: GoogleCalendarEvent,
  calendarId: string,
  accessToken: string,
) {
  if (conferenceLink(event) || !event.id) return event;
  let refreshedEvent = event;
  // Conference creation can briefly be asynchronous. Poll the new event so the
  // client receives Google's actual Meet URL instead of a fabricated fallback.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    refreshedEvent = await googleRequest(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(event.id)}`,
      accessToken,
      { method: "GET" },
    ) as GoogleCalendarEvent;
    if (conferenceLink(refreshedEvent)) break;
  }
  return refreshedEvent;
}

async function handleCallback(url: URL) {
  const rawState = url.searchParams.get("state");
  if (!rawState) return new Response("Missing OAuth state", { status: 400 });

  const stateHash = await sha256(rawState);
  const { data: state } = await adminClient
    .from("google_oauth_states")
    .select("*")
    .eq("state_hash", stateHash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!state) return new Response("OAuth state is invalid or expired", { status: 400 });

  await adminClient.from("google_oauth_states").update({ used_at: new Date().toISOString() }).eq("state_hash", stateHash);
  const returnUrl = `${APP_URL}${safeReturnPath(state.return_path)}`;
  const code = url.searchParams.get("code");
  if (url.searchParams.get("error") || !code) {
    return Response.redirect(`${returnUrl}${returnUrl.includes("?") ? "&" : "?"}google_calendar=error`, 302);
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) throw new Error(tokens.error_description || tokens.error || "Google token exchange failed");

    const existing = await getConnection(state.tenant_id);
    let encryptedRefreshToken = existing?.encrypted_refresh_token;
    let tokenIv = existing?.token_iv;
    if (tokens.refresh_token) {
      const encrypted = await encryptToken(tokens.refresh_token);
      encryptedRefreshToken = encrypted.encrypted;
      tokenIv = encrypted.iv;
    }
    if (!encryptedRefreshToken || !tokenIv) throw new Error("Google did not provide offline access. Revoke the app in Google Account settings and connect again.");

    const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoResponse.json();
    if (!userInfoResponse.ok || !userInfo.email) throw new Error("Could not read the connected Google account email");

    const { error } = await adminClient.from("google_calendar_connections").upsert({
      tenant_id: state.tenant_id,
      connected_by: state.user_id,
      google_email: userInfo.email,
      calendar_id: existing?.calendar_id || "primary",
      encrypted_refresh_token: encryptedRefreshToken,
      token_iv: tokenIv,
      scopes: (tokens.scope || GOOGLE_SCOPES.join(" ")).split(" "),
      connected_at: existing?.connected_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_error: null,
    }, { onConflict: "tenant_id" });
    if (error) throw error;
    return Response.redirect(`${returnUrl}${returnUrl.includes("?") ? "&" : "?"}google_calendar=connected`, 302);
  } catch (error) {
    console.error("[google-calendar] callback failed", error);
    return Response.redirect(`${returnUrl}${returnUrl.includes("?") ? "&" : "?"}google_calendar=error`, 302);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  if (req.method === "GET" && url.pathname.endsWith("/callback")) return handleCallback(url);

  try {
    const profile = await authenticatedProfile(req);
    const tenantId = tenantIdFor(profile);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body.action;

    if (action === "status") {
      const connection = await getConnection(tenantId);
      return response({
        connected: Boolean(connection),
        google_email: connection?.google_email || null,
        calendar_id: connection?.calendar_id || null,
        connected_at: connection?.connected_at || null,
        last_error: connection?.last_error || null,
        can_connect: profile.role === "admin",
      });
    }

    if (action === "connect") {
      if (profile.role !== "admin") return response({ error: "Only the workspace administrator can connect Google Calendar" }, 403);
      const rawState = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
      const stateHash = await sha256(rawState);
      const returnPath = safeReturnPath(body.return_path);
      await adminClient.from("google_oauth_states").delete().eq("tenant_id", tenantId).lt("expires_at", new Date().toISOString());
      const { error } = await adminClient.from("google_oauth_states").insert({
        state_hash: stateHash,
        tenant_id: tenantId,
        user_id: profile.id,
        return_path: returnPath,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });
      if (error) throw error;

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: "code",
        scope: GOOGLE_SCOPES.join(" "),
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
        state: rawState,
      });
      if (profile.email) params.set("login_hint", profile.email);
      return response({ auth_url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
    }

    if (action === "disconnect") {
      if (profile.role !== "admin") return response({ error: "Only the workspace administrator can disconnect Google Calendar" }, 403);
      const connection = await getConnection(tenantId);
      if (connection) {
        try {
          const refreshToken = await decryptToken(connection.encrypted_refresh_token, connection.token_iv);
          await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });
        } catch (error) {
          console.warn("[google-calendar] token revoke failed", error);
        }
        await adminClient.from("google_calendar_connections").delete().eq("tenant_id", tenantId);
      }
      return response({ success: true });
    }

    if (!canManageMeetings(profile)) return response({ error: "You do not have permission to manage workspace meetings" }, 403);
    const { accessToken, connection } = await getAccessToken(tenantId);
    // The connected workspace calendar is authoritative; clients cannot target
    // another calendar that happens to be accessible by the Google account.
    const calendarId = encodeURIComponent(connection.calendar_id || "primary");

    if (action === "create_event") {
      const input = body.event as CalendarEventInput;
      if (!input?.meeting_id || !input?.title || !input?.date || !input?.time) return response({ error: "meeting_id, title, date, and time are required" }, 400);
      let event = await googleRequest(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1&sendUpdates=all`,
        accessToken,
        { method: "POST", body: JSON.stringify(eventBody(input, tenantId, input.create_meet !== false)) },
      ) as GoogleCalendarEvent;
      if (input.create_meet !== false) event = await waitForConference(event, calendarId, accessToken);
      await adminClient.from("google_calendar_connections").update({ last_used_at: new Date().toISOString(), last_error: null }).eq("tenant_id", tenantId);
      return response({
        success: true,
        event_id: event.id,
        calendar_id: connection.calendar_id || "primary",
        event_url: event.htmlLink,
        meeting_link: conferenceLink(event),
        conference_status: conferenceLink(event) ? "ready" : "pending",
        event,
      });
    }

    if (action === "get_event") {
      const eventId = body.event?.event_id;
      const meetingId = body.event?.meeting_id;
      if (!eventId || !meetingId) return response({ error: "event_id and meeting_id are required" }, 400);
      const event = await assertWorkspaceEvent(calendarId, eventId, accessToken, tenantId, meetingId);
      return response({
        success: true,
        event_id: event.id,
        calendar_id: connection.calendar_id || "primary",
        event_url: event.htmlLink,
        meeting_link: conferenceLink(event),
        conference_status: conferenceLink(event) ? "ready" : "pending",
      });
    }

    if (action === "update_event") {
      const input = body.event as CalendarEventInput;
      if (!input?.event_id || !input?.meeting_id) return response({ error: "event_id and meeting_id are required" }, 400);
      await assertWorkspaceEvent(calendarId, input.event_id, accessToken, tenantId, input.meeting_id);
      const event = await googleRequest(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(input.event_id)}?conferenceDataVersion=1&sendUpdates=all`,
        accessToken,
        { method: "PATCH", body: JSON.stringify(eventBody(input, tenantId, false)) },
      );
      return response({ success: true, event_id: event.id, event_url: event.htmlLink, meeting_link: conferenceLink(event), event });
    }

    if (action === "delete_event") {
      const eventId = body.event?.event_id;
      const meetingId = body.event?.meeting_id;
      if (!eventId || !meetingId) return response({ error: "event_id and meeting_id are required" }, 400);
      await assertWorkspaceEvent(calendarId, eventId, accessToken, tenantId, meetingId);
      await googleRequest(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
        accessToken,
        { method: "DELETE" },
      );
      return response({ success: true });
    }

    return response({ error: "Unknown action" }, 400);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[google-calendar] error", error);
    return response({ error: error instanceof Error ? error.message : "Google Calendar request failed" }, 500);
  }
});
