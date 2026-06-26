import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS_HEADERS as corsHeaders, handleCorsPreflightIfNeeded } from "../_shared/cors.ts";

/** Real Listen V7.2 — seuil de validité : 90% */
const VALID_LISTEN_THRESHOLD = 0.9;

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { sessionId, positionSeconds, totalDurationSeconds } = body as {
      sessionId: string;
      positionSeconds: number;
      totalDurationSeconds: number;
    };

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "session_not_found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotent : session déjà complétée → 200 (évite double-complete / invoke error)
    const { data: existingSession } = await supabase
      .from("stream_sessions")
      .select("is_valid_listen, listen_percentage, completed_at")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingSession?.completed_at) {
      return new Response(
        JSON.stringify({
          isValidListen: existingSession.is_valid_listen,
          listenPercentage: Math.round(Number(existingSession.listen_percentage ?? 0)),
          threshold: Math.round(VALID_LISTEN_THRESHOLD * 100),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Calculer si l'écoute est valide (Real Listen V7.2 — côté serveur)
    const effectiveDuration = Math.max(totalDurationSeconds, 1);
    const listenPercentage = Math.min(positionSeconds / effectiveDuration, 1.0);
    const isValidListen = listenPercentage >= VALID_LISTEN_THRESHOLD;

    // Persister via RPC
    const { data: serverValidation, error: completeError } = await supabase.rpc(
      "complete_stream_session",
      {
        p_session_id: sessionId,
        p_position_seconds: positionSeconds,
        p_total_duration_seconds: totalDurationSeconds,
      },
    );

    if (completeError) {
      const { data: closedSession } = await supabase
        .from("stream_sessions")
        .select("is_valid_listen, listen_percentage, completed_at")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (closedSession?.completed_at) {
        return new Response(
          JSON.stringify({
            isValidListen: closedSession.is_valid_listen,
            listenPercentage: Math.round(Number(closedSession.listen_percentage ?? 0)),
            threshold: Math.round(VALID_LISTEN_THRESHOLD * 100),
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify({ error: "session_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalIsValid = (serverValidation as boolean) ?? isValidListen;

    // Enregistrer l'événement de complétion
    const { data: session } = await supabase
      .from("stream_sessions")
      .select("track_id")
      .eq("id", sessionId)
      .maybeSingle();

    if (session?.track_id) {
      await supabase.from("stream_events").insert({
        session_id: sessionId,
        user_id: user.id,
        track_id: session.track_id,
        event_type: finalIsValid ? "complete" : "skip",
        position_seconds: positionSeconds,
        metadata: {
          listen_percentage: listenPercentage,
          is_valid_listen: finalIsValid,
          total_duration_seconds: totalDurationSeconds,
        },
      });
    }

    // Audit si écoute valide — non bloquant (PostgrestBuilder n'expose pas .catch())
    if (finalIsValid && session?.track_id) {
      const { error: auditError } = await supabase.rpc("log_audit_event_authenticated", {
        p_action: "streaming.listen.validated",
        p_entity_type: "tracks",
        p_entity_id: session.track_id,
        p_metadata: { session_id: sessionId, listen_percentage: listenPercentage },
      });
      if (auditError) {
        console.warn("[stream-complete] audit skipped:", auditError.message);
      }
    }

    return new Response(
      JSON.stringify({
        isValidListen: finalIsValid,
        listenPercentage: Math.round(listenPercentage * 100),
        threshold: Math.round(VALID_LISTEN_THRESHOLD * 100),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "stream_complete_failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
