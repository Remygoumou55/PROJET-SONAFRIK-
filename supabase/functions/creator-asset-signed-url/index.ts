import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { CORS_HEADERS as corsHeaders, handleCorsPreflightIfNeeded } from "../_shared/cors.ts";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOC_TYPES = ["application/pdf"];
const SIGNED_URL_TTL = 3600;

type AssetKind = "banner" | "cover" | "verification" | "label_logo";

interface SignedUrlRequest {
  action: "upload" | "read";
  creatorId: string;
  assetKind: AssetKind;
  contentType?: string;
  verificationId?: string;
  labelId?: string;
  path?: string;
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return json({ error: "Configuration serveur manquante." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Non autorisé." }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({ error: "Session invalide." }, 401);
    }

    const body = (await req.json()) as SignedUrlRequest;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: canEdit } = await adminClient.rpc("can_edit_creator", {
      p_creator_id: body.creatorId,
      p_user_id: user.id,
    });

    if (!canEdit && body.action === "upload") {
      return json({ error: "Accès non autorisé." }, 403);
    }

    const path = body.action === "read" && body.path ? body.path : buildPath(body);
    if (!path) {
      return json({ error: "Paramètres invalides." }, 400);
    }

    if (body.action === "upload") {
      if (!body.contentType || !isAllowedType(body.contentType, body.assetKind)) {
        return json({ error: "Type de fichier non autorisé." }, 400);
      }

      const { data, error } = await adminClient.storage
        .from("creator-assets")
        .createSignedUploadUrl(path, { upsert: true });

      if (error) {
        return json({ error: error.message }, 500);
      }

      await persistPath(adminClient, body, path, user.id);

      return json({
        signedUrl: data.signedUrl,
        path,
        token: data.token,
        expiresIn: SIGNED_URL_TTL,
      });
    }

    if (body.action === "read") {
      const { data: canMember } = await adminClient.rpc("is_creator_member", {
        p_creator_id: body.creatorId,
        p_user_id: user.id,
      });

      if (!canMember) {
        const { data: artistProfile } = await adminClient
          .from("artist_profiles")
          .select("is_public, banner_path, cover_path")
          .eq("creator_id", body.creatorId)
          .maybeSingle();

        const isPublicAsset =
          artistProfile?.is_public &&
          (path === artistProfile.banner_path || path === artistProfile.cover_path);

        if (!isPublicAsset) {
          return json({ error: "Accès non autorisé." }, 403);
        }
      }

      const { data, error } = await adminClient.storage
        .from("creator-assets")
        .createSignedUrl(path, SIGNED_URL_TTL);

      if (error) {
        return json({ error: error.message }, 500);
      }

      return json({ signedUrl: data.signedUrl, path, expiresIn: SIGNED_URL_TTL });
    }

    return json({ error: "Action invalide." }, 400);
  } catch {
    return json({ error: "Erreur interne du serveur." }, 500);
  }
});

function buildPath(body: SignedUrlRequest): string | null {
  const ext = body.contentType?.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";

  switch (body.assetKind) {
    case "banner":
      return `${body.creatorId}/banner.${ext}`;
    case "cover":
      return `${body.creatorId}/cover.${ext}`;
    case "verification":
      if (!body.verificationId) return null;
      return `${body.creatorId}/verification/${body.verificationId}.${ext === "pdf" ? "pdf" : ext}`;
    case "label_logo":
      if (!body.labelId) return null;
      return `${body.creatorId}/labels/${body.labelId}.${ext}`;
    default:
      return null;
  }
}

function isAllowedType(contentType: string, kind: AssetKind): boolean {
  if (kind === "verification") {
    return ALLOWED_IMAGE_TYPES.includes(contentType) || ALLOWED_DOC_TYPES.includes(contentType);
  }
  return ALLOWED_IMAGE_TYPES.includes(contentType);
}

async function persistPath(
  client: ReturnType<typeof createClient>,
  body: SignedUrlRequest,
  path: string,
  userId: string,
) {
  if (body.assetKind === "banner") {
    await client
      .from("artist_profiles")
      .update({ banner_path: path, updated_by: userId })
      .eq("creator_id", body.creatorId);
  } else if (body.assetKind === "cover") {
    await client
      .from("artist_profiles")
      .update({ cover_path: path, updated_by: userId })
      .eq("creator_id", body.creatorId);
  } else if (body.assetKind === "verification" && body.verificationId) {
    await client
      .from("creator_verifications")
      .update({ document_path: path, updated_by: userId })
      .eq("id", body.verificationId);
  } else if (body.assetKind === "label_logo" && body.labelId) {
    await client
      .from("labels")
      .update({ logo_path: path, updated_by: userId })
      .eq("id", body.labelId);
  }
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
