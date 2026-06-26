/**
 * Infrastructure CORS Enterprise — toutes les Edge Functions SONAFRIK.
 * @see docs/infrastructure/CORS_ARCHITECTURE.md
 */
import {
  buildCorsHeaderRecord,
  type CorsPolicyEnv,
  resolveAllowedOrigin,
} from "./cors-policy.ts";

function readCorsEnv(): CorsPolicyEnv {
  return {
    allowedOrigin: Deno.env.get("ALLOWED_ORIGIN"),
    allowedOrigins: Deno.env.get("ALLOWED_ORIGINS"),
    allowVercelPreview: Deno.env.get("ALLOW_VERCEL_PREVIEW") !== "false",
  };
}

/** @deprecated Utiliser buildCorsHeaders(req) — conservé temporairement pour compat probes */
export function getLegacyStaticOrigin(): string {
  const env = readCorsEnv();
  const resolved = resolveAllowedOrigin("http://localhost:3000", env);
  return resolved ?? "https://sonafrik.vercel.app";
}

/** En-têtes CORS dynamiques selon l'origine de la requête (whitelist Zero Trust). */
export function buildCorsHeaders(
  req: Request,
  extra: Record<string, string> = {},
): Record<string, string> {
  return buildCorsHeaderRecord(req.headers.get("Origin"), readCorsEnv(), extra);
}

export function mergeCorsHeaders(
  req: Request,
  extra: Record<string, string> = {},
): Record<string, string> {
  return buildCorsHeaders(req, extra);
}

/** Réponse JSON avec CORS dynamique. */
export function corsJsonResponse(
  req: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: buildCorsHeaders(req, { "Content-Type": "application/json" }),
  });
}

/** Preflight OPTIONS pour fonctions appelées depuis le navigateur. */
export function handleCorsPreflightIfNeeded(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: buildCorsHeaders(req) });
}

/**
 * Preflight minimal pour webhooks opérateurs (pas de CORS navigateur).
 * Centralise la gestion OPTIONS — pas d'Access-Control-Allow-Origin.
 */
export function handleWebhookPreflightIfNeeded(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response(null, { status: 204 });
}
