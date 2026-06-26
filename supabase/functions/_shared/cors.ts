// Helper CORS centralisé pour toutes les edge functions SONAFRIK

/**
 * Origines autorisées à appeler les edge functions SONAFRIK.
 * Priorité : variable d'environnement ALLOWED_ORIGIN
 * Fallback strict : uniquement le domaine de production SONAFRIK
 * JAMAIS de fallback "*" — trop permissif pour des fonctions financières
 */
function getAllowedOrigin(): string {
  const envOrigin = Deno.env.get("ALLOWED_ORIGIN");
  if (envOrigin) return envOrigin;

  return "https://sonafrik.vercel.app";
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": getAllowedOrigin(),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/** Répondre aux preflight OPTIONS automatiquement */
export function handleCorsPreflightIfNeeded(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  return null;
}
