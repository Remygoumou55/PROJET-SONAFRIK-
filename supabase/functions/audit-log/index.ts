import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { buildCorsHeaders, handleCorsPreflightIfNeeded } from "../_shared/cors.ts";

interface AuditLogRequest {
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Configuration serveur manquante." }), {
        status: 500,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé." }), {
        status: 401,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Session invalide." }), {
        status: 401,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      });
    }

    const body = (await req.json()) as AuditLogRequest;

    if (!body.action) {
      return new Response(JSON.stringify({ error: "Action requise." }), {
        status: 400,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      });
    }

    const { data, error } = await supabase.rpc("log_audit_event", {
      p_actor_id: user.id,
      p_action: body.action,
      p_entity_type: body.entity_type ?? null,
      p_entity_id: body.entity_id ?? null,
      p_metadata: body.metadata ?? {},
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      });
    }

    return new Response(JSON.stringify({ id: data }), {
      status: 201,
      headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
    });
  } catch {
    return new Response(JSON.stringify({ error: "Erreur interne du serveur." }), {
      status: 500,
      headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
    });
  }
});
