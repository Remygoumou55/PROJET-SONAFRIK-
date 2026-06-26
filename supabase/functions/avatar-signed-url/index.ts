import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { CORS_HEADERS as corsHeaders, handleCorsPreflightIfNeeded } from "../_shared/cors.ts";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const SIGNED_URL_TTL = 3600;

interface SignedUrlRequest {
  action: "upload" | "read";
  contentType?: string;
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

    if (body.action === "upload") {
      if (!body.contentType || !ALLOWED_TYPES.includes(body.contentType)) {
        return json({ error: "Type de fichier non autorisé. JPEG, PNG ou WebP uniquement." }, 400);
      }

      const ext = body.contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { data, error } = await adminClient.storage
        .from("avatars")
        .createSignedUploadUrl(path, { upsert: true });

      if (error) {
        return json({ error: error.message }, 500);
      }

      await adminClient
        .from("profiles")
        .update({ avatar_path: path, updated_by: user.id })
        .eq("id", user.id);

      return json({
        signedUrl: data.signedUrl,
        path,
        token: data.token,
        expiresIn: SIGNED_URL_TTL,
      });
    }

    if (body.action === "read") {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("avatar_path")
        .eq("id", user.id)
        .single();

      if (!profile?.avatar_path) {
        return json({ signedUrl: null, path: null });
      }

      const { data, error } = await adminClient.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_path, SIGNED_URL_TTL);

      if (error) {
        return json({ error: error.message }, 500);
      }

      return json({
        signedUrl: data.signedUrl,
        path: profile.avatar_path,
        expiresIn: SIGNED_URL_TTL,
      });
    }

    return json({ error: "Action invalide." }, 400);
  } catch {
    return json({ error: "Erreur interne du serveur." }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
