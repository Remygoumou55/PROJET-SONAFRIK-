/**
 * Politique CORS SONAFRIK — logique pure (testable Node/Vitest + Deno Edge).
 * Source unique de vérité pour la liste blanche d'origines.
 */

export const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://sonafrik.vercel.app",
] as const;

export const CORS_ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-api-version";

export const CORS_ALLOW_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";

export type CorsPolicyEnv = {
  /** @deprecated Préférer ALLOWED_ORIGINS — conservé pour rétrocompat Supabase secrets */
  allowedOrigin?: string | null;
  /** Origines supplémentaires séparées par des virgules */
  allowedOrigins?: string | null;
  /** Autoriser les previews Vercel (*.vercel.app). Défaut: true */
  allowVercelPreview?: boolean | null;
};

function parseExtraOrigins(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildOriginWhitelist(env: CorsPolicyEnv = {}): string[] {
  const origins = new Set<string>([...DEFAULT_ALLOWED_ORIGINS]);
  if (env.allowedOrigin) origins.add(env.allowedOrigin.trim());
  for (const o of parseExtraOrigins(env.allowedOrigins)) origins.add(o);
  return [...origins];
}

export function isVercelPreviewOrigin(origin: string): boolean {
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === "https:" && hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

/**
 * Résout l'origine à refléter dans Access-Control-Allow-Origin.
 * Retourne null si l'origine n'est pas autorisée (Zero Trust).
 */
export function resolveAllowedOrigin(
  requestOrigin: string | null,
  env: CorsPolicyEnv = {},
): string | null {
  if (!requestOrigin) return null;

  const whitelist = buildOriginWhitelist(env);
  if (whitelist.includes(requestOrigin)) return requestOrigin;

  const allowPreview = env.allowVercelPreview !== false;
  if (allowPreview && isVercelPreviewOrigin(requestOrigin)) return requestOrigin;

  return null;
}

export function buildCorsHeaderRecord(
  requestOrigin: string | null,
  env: CorsPolicyEnv = {},
  extra: Record<string, string> = {},
): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": CORS_ALLOW_HEADERS,
    "Access-Control-Allow-Methods": CORS_ALLOW_METHODS,
    ...extra,
  };

  const allowed = resolveAllowedOrigin(requestOrigin, env);
  if (allowed) {
    headers["Access-Control-Allow-Origin"] = allowed;
    headers["Access-Control-Allow-Credentials"] = "true";
    headers["Vary"] = "Origin";
  }

  return headers;
}
