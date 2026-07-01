import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, handleCorsPreflightIfNeeded } from "../_shared/cors.ts";

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

    const { data: canStream, error: permissionError } = await supabase.rpc(
      "has_streaming_permission",
      { p_user_id: user.id },
    );

    if (permissionError || !canStream) {
      return new Response(JSON.stringify({ error: "no_streaming_permission" }), {
        status: 403,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
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
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
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
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      });
    }

    // Formats lisibles par tous les navigateurs (CDC : pas de FLAC/OGG côté web)
    const WEB_AUDIO_FORMATS = ["mp3", "m4a", "aac"];

    let fileQuery = supabase
      .from("track_files")
      .select("id, file_path, bitrate_kbps, format, integrity_status")
      .eq("track_id", trackId)
      .eq("is_primary", true)
      .in("format", WEB_AUDIO_FORMATS)
      .not("integrity_status", "eq", "invalid")
      .limit(1);

    if (qualityKbps) {
      fileQuery = supabase
        .from("track_files")
        .select("id, file_path, bitrate_kbps, format, integrity_status")
        .eq("track_id", trackId)
        .in("format", WEB_AUDIO_FORMATS)
        .not("integrity_status", "eq", "invalid")
        .lte("bitrate_kbps", qualityKbps)
        .order("bitrate_kbps", { ascending: false })
        .limit(1);
    }

    let { data: trackFile } = await fileQuery.maybeSingle();

    // Repli : fichier primaire web-safe, puis tout primaire
    if (!trackFile?.file_path && qualityKbps) {
      const { data: primaryFile } = await supabase
        .from("track_files")
        .select("id, file_path, bitrate_kbps, format, integrity_status")
        .eq("track_id", trackId)
        .eq("is_primary", true)
        .in("format", WEB_AUDIO_FORMATS)
        .not("integrity_status", "eq", "invalid")
        .limit(1)
        .maybeSingle();
      trackFile = primaryFile;
    }

    if (!trackFile?.file_path) {
      return new Response(JSON.stringify({ error: "stream_start_failed" }), {
        status: 404,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      });
    }

    if (trackFile.integrity_status === "invalid" || trackFile.integrity_status === "needs_review") {
      return new Response(JSON.stringify({ error: "stream_start_failed", reason: "asset_invalid" }), {
        status: 422,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: blobList } = await supabaseAdmin.storage
      .from("catalog-audio")
      .list(trackFile.file_path.split("/").slice(0, -1).join("/") || "", {
        search: trackFile.file_path.split("/").pop(),
        limit: 1,
      });
    const metaSize = blobList?.[0]?.metadata?.size as number | undefined;
    if (metaSize !== undefined && metaSize < 64) {
      return new Response(JSON.stringify({ error: "stream_start_failed" }), {
        status: 422,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      });
    }

    // Générer URL pré-signée (Règle #10 CDC — URLs audio côté serveur uniquement)

    const SIGNED_URL_EXPIRY = 900; // 15 minutes — limite exposition URL signée

    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from("catalog-audio")
      .createSignedUrl(trackFile.file_path, SIGNED_URL_EXPIRY);

    if (signedError || !signedData?.signedUrl) {
      return new Response(JSON.stringify({ error: "stream_start_failed" }), {
        status: 500,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
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
      const reason = sessionError.message ?? "";
      if (reason.includes("no_streaming_permission")) {
        return new Response(JSON.stringify({ error: "no_streaming_permission" }), {
          status: 403,
          headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
        });
      }
      return new Response(JSON.stringify({ error: "stream_start_failed" }), {
        status: 500,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
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
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      },
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "stream_start_failed" }),
      {
        status: 500,
        headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
      },
    );
  }
});
