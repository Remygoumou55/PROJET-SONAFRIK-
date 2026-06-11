import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "aac",
  "audio/wav": "wav",
  "audio/x-flac": "flac",
  "audio/flac": "flac",
};

const VISUAL_TYPES = ["image/jpeg", "image/png", "image/webp"];
const SIGNED_URL_TTL = 3600;

interface CatalogAssetRequest {
  action: "upload" | "read";
  assetType: "audio" | "cover";
  creatorId: string;
  trackId?: string;
  albumId?: string;
  contentType?: string;
  path?: string;
  format?: "mp3" | "aac" | "flac" | "wav";
  bitrateKbps?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return json({ error: "Configuration serveur manquante." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Non autorisé." }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) return json({ error: "Session invalide." }, 401);

    const body = (await req.json()) as CatalogAssetRequest;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (body.action === "upload") {
      const { data: canEdit } = await adminClient.rpc("can_edit_creator", {
        p_creator_id: body.creatorId,
        p_user_id: user.id,
      });
      if (!canEdit) return json({ error: "Accès non autorisé." }, 403);
    }

    const builtPath =
      body.action === "read" && body.path ? body.path : buildPath(body);
    if (!builtPath) return json({ error: "Paramètres invalides." }, 400);

    const bucket = body.assetType === "audio" ? "catalog-audio" : "catalog-visuals";

    if (body.action === "upload") {
      if (!body.contentType) return json({ error: "Content-Type requis." }, 400);
      if (body.assetType === "audio" && !AUDIO_TYPES[body.contentType]) {
        return json({ error: "Format audio non autorisé." }, 400);
      }
      if (body.assetType === "cover" && !VISUAL_TYPES.includes(body.contentType)) {
        return json({ error: "Format visuel non autorisé." }, 400);
      }

      const { data, error } = await adminClient.storage
        .from(bucket)
        .createSignedUploadUrl(builtPath, { upsert: true });

      if (error) return json({ error: error.message }, 500);

      await persistAsset(adminClient, body, builtPath, user.id);

      return json({
        signedUrl: data.signedUrl,
        path: builtPath,
        token: data.token,
        expiresIn: SIGNED_URL_TTL,
      });
    }

    if (body.action === "read") {
      const { data: isMember } = await adminClient.rpc("is_creator_member", {
        p_creator_id: body.creatorId,
        p_user_id: user.id,
      });

      if (!isMember) {
        const isPublic = await isPublicAsset(adminClient, body, builtPath);
        if (!isPublic) return json({ error: "Accès non autorisé." }, 403);
      }

      const { data, error } = await adminClient.storage
        .from(bucket)
        .createSignedUrl(builtPath, SIGNED_URL_TTL);

      if (error) return json({ error: error.message }, 500);

      return json({ signedUrl: data.signedUrl, path: builtPath, expiresIn: SIGNED_URL_TTL });
    }

    return json({ error: "Action invalide." }, 400);
  } catch {
    return json({ error: "Erreur interne du serveur." }, 500);
  }
});

function buildPath(body: CatalogAssetRequest): string | null {
  if (body.assetType === "audio") {
    if (!body.trackId) return null;
    const ext = body.contentType ? AUDIO_TYPES[body.contentType] ?? "mp3" : body.format ?? "mp3";
    return `${body.creatorId}/tracks/${body.trackId}/master.${ext}`;
  }
  if (!body.albumId) return null;
  const ext = body.contentType?.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  return `${body.creatorId}/releases/${body.albumId}/cover.${ext}`;
}

async function persistAsset(
  client: ReturnType<typeof createClient>,
  body: CatalogAssetRequest,
  path: string,
  userId: string,
) {
  if (body.assetType === "cover" && body.albumId) {
    await client
      .from("albums")
      .update({ cover_path: path, updated_by: userId })
      .eq("id", body.albumId);
    return;
  }

  if (body.assetType === "audio" && body.trackId) {
    const format = body.format ?? (body.contentType ? AUDIO_TYPES[body.contentType] : "mp3");
    await client.from("track_files").update({ is_primary: false }).eq("track_id", body.trackId);
    await client.from("track_files").insert({
      track_id: body.trackId,
      format,
      file_path: path,
      bitrate_kbps: body.bitrateKbps ?? null,
      is_primary: true,
      created_by: userId,
      updated_by: userId,
    });
  }
}

async function isPublicAsset(
  client: ReturnType<typeof createClient>,
  body: CatalogAssetRequest,
  path: string,
): Promise<boolean> {
  if (body.assetType === "cover" && body.albumId) {
    const { data } = await client
      .from("albums")
      .select("cover_path, publication_status")
      .eq("id", body.albumId)
      .maybeSingle();
    return data?.publication_status === "published" && data.cover_path === path;
  }
  if (body.assetType === "audio" && body.trackId) {
    const { data: track } = await client
      .from("tracks")
      .select("publication_status")
      .eq("id", body.trackId)
      .maybeSingle();
    if (track?.publication_status !== "published") return false;
    const { data: file } = await client
      .from("track_files")
      .select("file_path")
      .eq("track_id", body.trackId)
      .eq("is_primary", true)
      .maybeSingle();
    return file?.file_path === path;
  }
  return false;
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
