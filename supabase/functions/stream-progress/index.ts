import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, handleCorsPreflightIfNeeded } from "../_shared/cors.ts";

/** Real Listen V7.2 — Anti-fraude : vitesse de progression max tolérable */
const MAX_PROGRESS_SPEED_RATIO = 1.5; // pos avance max 1.5× vitesse réelle

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      });
    }

    const body = await req.json();
    const { sessionId, positionSeconds } = body as {
      sessionId: string;
      positionSeconds: number;
    };

    if (!sessionId || positionSeconds === undefined) {
      return new Response(JSON.stringify({ error: "session_not_found" }), {
        status: 400,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      });
    }

    // Récupérer la session pour valider l'anti-fraude
    const { data: session } = await supabase
      .from("stream_sessions")
      .select("id, user_id, track_id, last_heartbeat_at, total_listened_seconds, total_duration_seconds")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .is("completed_at", null)
      .maybeSingle();

    if (!session) {
      return new Response(JSON.stringify({ error: "session_not_found" }), {
        status: 404,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      });
    }

    // Anti-fraude : vérifier que la progression n'est pas trop rapide
    const lastHeartbeat = new Date(session.last_heartbeat_at as string);
    const elapsed = (Date.now() - lastHeartbeat.getTime()) / 1000;
    const previousPosition = session.total_listened_seconds as number;
    const delta = positionSeconds - previousPosition;

    const fraudFlags: string[] = [];
    if (delta > 0 && elapsed > 0 && delta / elapsed > MAX_PROGRESS_SPEED_RATIO) {
      fraudFlags.push("fast_forward_detected");
    }
    if (positionSeconds < 0) {
      fraudFlags.push("negative_position");
    }

    // Mettre à jour le heartbeat
    const { error: heartbeatError } = await supabase.rpc("update_stream_heartbeat", {
      p_session_id: sessionId,
      p_position_seconds: Math.max(0, positionSeconds),
    });

    if (heartbeatError) {
      return new Response(JSON.stringify({ error: "session_not_found" }), {
        status: 404,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      });
    }

    // Persister les fraud_flags sur la session (analytics fraude)
    if (fraudFlags.length > 0) {
      const { error: fraudError } = await supabase.rpc("append_stream_session_fraud_flags", {
        p_session_id: sessionId,
        p_flags: fraudFlags,
      });
      if (fraudError) {
        console.warn("[stream-progress] fraud_flags skipped:", fraudError.message);
      }
    }

    // Enregistrer l'événement heartbeat (track_id rempli par trigger fill_stream_event_track_id)
    await supabase.from("stream_events").insert({
      session_id: sessionId,
      user_id: user.id,
      track_id: session.track_id ?? null,
      event_type: "heartbeat",
      position_seconds: Math.max(0, positionSeconds),
      metadata: { fraud_flags: fraudFlags, elapsed_real: elapsed },
    });

    return new Response(
      JSON.stringify({
        valid: fraudFlags.length === 0,
        fraudFlags,
        positionSeconds: Math.max(0, positionSeconds),
      }),
      {
        status: 200,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      },
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "stream_progress_failed" }),
      {
        status: 500,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      },
    );
  }
});
