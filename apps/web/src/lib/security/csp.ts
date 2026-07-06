const SUPABASE_FALLBACK = "https://*.supabase.co";

function resolveSupabaseOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? SUPABASE_FALLBACK;
  if (raw.startsWith("http")) {
    try {
      return new URL(raw).origin;
    } catch {
      return SUPABASE_FALLBACK;
    }
  }
  return raw;
}

export function buildContentSecurityPolicy(nonce: string, isProd: boolean): string {
  const supabaseOrigin = resolveSupabaseOrigin();
  const supabaseWss = supabaseOrigin.replace("https://", "wss://");

  const devScriptExtras = isProd ? "" : " 'unsafe-eval'";
  const scriptSrc = isProd
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' ${supabaseOrigin} https://vitals.vercel-insights.com`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'${devScriptExtras} 'unsafe-inline' ${supabaseOrigin} https://vitals.vercel-insights.com`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "style-src-attr 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabaseOrigin} https://lh3.googleusercontent.com`,
    `media-src 'self' blob: ${supabaseOrigin}`,
    `connect-src 'self' ${supabaseOrigin} ${supabaseWss} https://accounts.google.com https://vitals.vercel-insights.com`,
    "frame-src https://accounts.google.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export const STATIC_SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
];

export function applySecurityHeaders(response: Response, nonce: string): void {
  const isProd = process.env.NODE_ENV === "production";
  for (const header of STATIC_SECURITY_HEADERS) {
    response.headers.set(header.key, header.value);
  }
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(nonce, isProd));
}
