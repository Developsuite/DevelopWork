import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") || "openai/gpt-4o-mini";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check admin role via service-role client (bypasses RLS)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile, error: profileError } = await adminClient
      .from("users")
      .select("id, name, email, role, tenant_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "AI Command Center is restricted to administrators" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Parse request
    const { messages, tools } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Call OpenRouter (API key stays server-side)
    const body: Record<string, unknown> = {
      model: OPENROUTER_MODEL,
      messages,
      max_tokens: 2000,
    };
    if (tools?.length) {
      body.tools = tools;
      body.tool_choice = "auto";
    }

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": SUPABASE_URL,
        "X-Title": "DevelopWork AI Command Center",
      },
      body: JSON.stringify(body),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[ai-agent] OpenRouter error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: `AI provider error (${aiRes.status})` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();

    // 5. Audit log (best effort)
    try {
      await adminClient.from("ai_action_runs").insert({
        tenant_id: profile.tenant_id,
        requested_by: profile.id,
        tool_name: "chat",
        arguments: { message_count: messages.length },
        risk_level: "read",
        status: "completed",
      });
    } catch (_) { /* don't fail the request */ }

    return new Response(JSON.stringify(aiData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ai-agent] Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
