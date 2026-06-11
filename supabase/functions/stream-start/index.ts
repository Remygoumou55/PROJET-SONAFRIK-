import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
    const { trackId, platform = "web", qualityKbps, deviceId } = body as {
      trackId: string;
      platform?: string;
      qualityKbps?: number;
      deviceId?: string;
    };

    if (!trackId) {
      return new Response(JSON.stringify({ error: "track_not_found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Récupérer le track et le fichier audio principal
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .select("id, duration_seconds, publication_status")
      .eq("id", trackId)
      .eq("publication_status", "published")
      .is("deleted_at", null)
      .maybeSingle();

    if (trackError || !track) {
      return new Response(JSON.stringify({ error: "track_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sélectionner le fichier audio selon la qualité demandée
    let fileQuery = supabase
      .from("track_files")
      .select("id, file_path, bitrate_kbps, format")
      .eq("track_id", trackId)
      .eq("is_primary", true)
      .limit(1);

    if (qualityKbps) {
      fileQuery = supabase
        .from("track_files")
        .select("id, file_path, bitrate_kbps, format")
        .eq("track_id", trackId)
        .lte("bitrate_kbps", qualityKbps)
        .order("bitrate_kbps", { ascending: false })
        .limit(1);
    }

    const { data: trackFile } = await fileQuery.maybeSingle();

    if (!trackFile?.file_path) {
      return new Response(JSON.stringify({ error: "stream_start_failed" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Générer URL pré-signée (Règle #10 CDC — URLs audio côté serveur uniquement)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const SIGNED_URL_EXPIRY = 7200; // 2 heures

    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from("audio")
      .createSignedUrl(trackFile.file_path, SIGNED_URL_EXPIRY);

    if (signedError || !signedData?.signedUrl) {
      return new Response(JSON.stringify({ error: "stream_start_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Créer la session de streaming
    const { data: sessionId, error: sessionError } = await supabase.rpc("start_stream_session", {
      p_track_id: trackId,
      p_platform: platform,
      p_quality_kbps: qualityKbps ?? null,
      p_device_id: deviceId ?? null,
      p_total_duration_seconds: (track.duration_seconds as number) ?? 0,
    });

    if (sessionError) {
      return new Response(JSON.stringify({ error: "stream_start_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY * 1000).toISOString();

    return new Response(
      JSON.stringify({
        sessionId,
        signedUrl: signedData.signedUrl,
        expiresAt,
        durationSeconds: (track.duration_seconds as number) ?? 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "stream_start_failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
