import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // ── ONE-TIME BOOTSTRAP: create the first super admin ──
    // Works only if no super admin exists yet AND the correct bootstrap secret is provided.
    if (action === "bootstrap") {
      const { count } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "super_admin");
      if (count && count > 0) return json({ error: "A super admin already exists" }, 403);

      const secret = req.headers.get("x-bootstrap-secret");
      const expected = Deno.env.get("BOOTSTRAP_SECRET");
      if (!expected || secret !== expected) return json({ error: "Invalid bootstrap secret" }, 403);

      const body = await req.json().catch(() => ({}));
      const { name, email, password } = body;
      if (!name || !email || !password) return json({ error: "name, email, password required" }, 400);

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: "super_admin" },
      });
      if (createErr) return json({ error: createErr.message }, 400);

      const newId = created.user?.id;
      if (newId) {
        await admin.from("profiles").upsert({
          id: newId, name, email, role: "super_admin", tenant_id: newId,
        }, { onConflict: "id" });
      }
      return json({ success: true, id: newId });
    }

    // 1. Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    // 2. Verify caller is a super admin
    const { data: me } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (me?.role !== "super_admin") return json({ error: "Super admin only" }, 403);

    // ── LIST all admin workspaces ──
    if (action === "list_workspaces") {
      const { data: admins } = await admin
        .from("profiles")
        .select("id, name, email, role, created_at, disabled_at")
        .eq("role", "admin")
        .order("created_at", { ascending: false });

      // Count members per tenant
      const result = [];
      for (const a of admins || []) {
        const { count } = await admin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", a.id);
        result.push({
          id: a.id,
          name: a.name,
          email: a.email,
          created_at: a.created_at,
          disabled: !!a.disabled_at,
          member_count: count || 0,
        });
      }
      return json({ workspaces: result });
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    // ── CREATE a new admin workspace ──
    if (action === "create_workspace") {
      const { name, email, password } = body;
      if (!name || !email || !password) {
        return json({ error: "name, email, and password are required" }, 400);
      }
      if (String(password).length < 6) {
        return json({ error: "Password must be at least 6 characters" }, 400);
      }

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: "admin" },
      });
      if (createErr) return json({ error: createErr.message }, 400);

      const newId = created.user?.id;
      // Ensure the profile is set as an admin with its own tenant (tenant_id = own id).
      if (newId) {
        await admin.from("profiles").upsert({
          id: newId,
          name,
          email,
          role: "admin",
          tenant_id: newId,
        }, { onConflict: "id" });
      }

      return json({ success: true, workspace: { id: newId, name, email } });
    }

    // ── RESET an admin's password ──
    if (action === "reset_password") {
      const { admin_id, password } = body;
      if (!admin_id || !password) return json({ error: "admin_id and password are required" }, 400);
      if (String(password).length < 6) return json({ error: "Password must be at least 6 characters" }, 400);

      // Confirm the target is an admin
      const { data: target } = await admin.from("profiles").select("role").eq("id", admin_id).single();
      if (target?.role !== "admin") return json({ error: "Target is not a workspace admin" }, 400);

      const { error } = await admin.auth.admin.updateUserById(admin_id, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    // ── ENABLE / DISABLE an admin workspace ──
    if (action === "toggle_workspace") {
      const { admin_id, disabled } = body;
      if (!admin_id || typeof disabled !== "boolean") return json({ error: "admin_id and disabled are required" }, 400);

      const { data: target } = await admin.from("profiles").select("role").eq("id", admin_id).single();
      if (target?.role !== "admin") return json({ error: "Target is not a workspace admin" }, 400);

      // Ban/unban the auth user so a disabled workspace can't log in.
      await admin.auth.admin.updateUserById(admin_id, { ban_duration: disabled ? "876000h" : "none" });
      await admin.from("profiles").update({ disabled_at: disabled ? new Date().toISOString() : null }).eq("id", admin_id);

      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("[super-admin] Error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
