import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { corsJsonResponse, handleCorsPreflightIfNeeded } from "../_shared/cors.ts";
import { MAX_UPLOAD_BYTES, MIN_BLOB_BYTES, validateAudioAsset } from "../_shared/audio-integrity.ts";

const AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "aac",
  "audio/m4a": "aac",
  "audio/x-m4a": "aac",
};

const MIME_BY_FORMAT: Record<string, string> = {
  mp3: "audio/mpeg",
  aac: "audio/mp4",
  m4a: "audio/mp4",
};

const VISUAL_TYPES = ["image/jpeg", "image/png", "image/webp"];
const SIGNED_URL_TTL = 3600;

interface CatalogAssetRequest {
  action: "upload" | "read" | "confirm";
  assetType: "audio" | "cover";
  creatorId: string;
  trackId?: string;
  albumId?: string;
  contentType?: string;
  path?: string;
  format?: "mp3" | "aac";
  bitrateKbps?: number;
  fileSizeBytes?: number;
  durationSeconds?: number;
  contentHash?: string;
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  const json = (body: Record<string, unknown>, status = 200) =>
    corsJsonResponse(req, body, status);

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

    if (body.action === "upload" || body.action === "confirm") {
      const { data: canEdit } = await adminClient.rpc("can_edit_creator", {
        p_creator_id: body.creatorId,
        p_user_id: user.id,
      });
      if (!canEdit) return json({ error: "Accès non autorisé." }, 403);
    }

    if (body.action === "confirm") {
      return await handleConfirm(adminClient, body, user.id, json);
    }

    const builtPath =
      body.action === "read" && body.path ? body.path : buildPath(body);
    if (!builtPath) return json({ error: "Paramètres invalides." }, 400);

    const bucket = body.assetType === "audio" ? "catalog-audio" : "catalog-visuals";

    if (body.action === "upload") {
      if (!body.contentType) return json({ error: "Content-Type requis." }, 400);
      if (body.assetType === "audio") {
        if (!AUDIO_TYPES[body.contentType]) {
          return json({ error: "Format audio non autorisé. Formats acceptés : MP3, M4A." }, 400);
        }
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne du serveur.";
    return json({ error: message }, 500);
  }
});

async function handleConfirm(
  client: ReturnType<typeof createClient>,
  body: CatalogAssetRequest,
  userId: string,
  json: (body: Record<string, unknown>, status?: number) => Response,
): Promise<Response> {
  if (body.assetType !== "audio" || !body.trackId || !body.path) {
    return json({ error: "Paramètres confirm invalides." }, 400);
  }

  const format = body.format ?? "mp3";
  const mime = body.contentType ?? MIME_BY_FORMAT[format] ?? "audio/mpeg";

  const { data: blob, error: dlErr } = await client.storage
    .from("catalog-audio")
    .download(body.path);

  if (dlErr || !blob) {
    await markIntegrity(client, body.trackId, body.path, {
      integrity_status: "invalid",
      integrity_message: "Objet Storage introuvable après upload.",
      validated_at: new Date().toISOString(),
      updated_by: userId,
    });
    return json({ error: "Fichier introuvable en Storage.", integrityStatus: "invalid" }, 422);
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const fileSizeBytes = body.fileSizeBytes ?? bytes.length;

  const validation = validateAudioAsset({
    header: bytes.slice(0, 512),
    mime,
    fileSizeBytes,
    dbFormat: format,
  });

  const updatePayload: Record<string, unknown> = {
    integrity_status: validation.status,
    integrity_message: validation.message,
    file_size_bytes: fileSizeBytes,
    validated_at: new Date().toISOString(),
    updated_by: userId,
  };
  if (body.durationSeconds != null && body.durationSeconds > 0) {
    updatePayload.duration_seconds = Math.round(body.durationSeconds);
  }
  if (body.contentHash) updatePayload.content_hash = body.contentHash;

  await markIntegrity(client, body.trackId, body.path, updatePayload);

  if (validation.status === "valid" && body.durationSeconds) {
    await client
      .from("tracks")
      .update({
        duration_seconds: Math.round(body.durationSeconds),
        updated_by: userId,
      })
      .eq("id", body.trackId);
  }

  if (validation.status === "invalid") {
    return json({
      error: validation.message,
      integrityStatus: validation.status,
      container: validation.container,
    }, 422);
  }

  return json({
    integrityStatus: validation.status,
    message: validation.message,
    webCompatible: validation.webCompatible,
    fileSizeBytes,
  });
}

async function markIntegrity(
  client: ReturnType<typeof createClient>,
  trackId: string,
  path: string,
  fields: Record<string, unknown>,
) {
  const { error } = await client
    .from("track_files")
    .update(fields)
    .eq("track_id", trackId)
    .eq("file_path", path)
    .eq("is_primary", true);
  if (error) throw new Error(error.message);
}

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
    const { error } = await client
      .from("albums")
      .update({ cover_path: path, updated_by: userId })
      .eq("id", body.albumId);
    if (error) throw new Error(error.message);
    return;
  }

  if (body.assetType === "audio" && body.trackId) {
    const format = body.format ?? (body.contentType ? AUDIO_TYPES[body.contentType] : "mp3");
    await client.from("track_files").update({ is_primary: false }).eq("track_id", body.trackId);
    const { error } = await client.from("track_files").insert({
      track_id: body.trackId,
      format,
      file_path: path,
      bitrate_kbps: body.bitrateKbps ?? null,
      is_primary: true,
      integrity_status: "pending",
      integrity_message: "En attente de confirmation post-upload.",
      created_by: userId,
      updated_by: userId,
    });
    if (error) throw new Error(error.message);
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
      .select("file_path, integrity_status")
      .eq("track_id", body.trackId)
      .eq("is_primary", true)
      .maybeSingle();
    return file?.file_path === path && file.integrity_status !== "invalid";
  }
  return false;
}
