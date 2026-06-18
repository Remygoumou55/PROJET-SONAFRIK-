import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: [
    "@sonafrik/ui",
    "@sonafrik/shared",
    "@sonafrik/types",
    "@sonafrik/api",
    "@sonafrik/database",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 604800,
    deviceSizes: [390, 640, 768, 1080, 1280],
    imageSizes: [32, 40, 64, 96, 128],
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],
  experimental: {
    // Next.js 15 : cache client-side router
    staleTimes: {
      static: 300,
      dynamic: 30,
    },
    // Tree-shaking des gros packages — réduit le bundle JS client
    optimizePackageImports: [
      "@sonafrik/ui",
      "@sonafrik/types",
      "@sonafrik/api",
      "@sonafrik/shared",
      "@sentry/nextjs",
    ],
  },
  async redirects() {
    return [
      // Redirect depuis l'URL accentuée (URL-encodée par les navigateurs) vers la version ASCII
      {
        source: "/auth/mot-de-passe-oubli%C3%A9",
        destination: "/auth/mot-de-passe-oublie",
        permanent: true,
      },
    ];
  },
  async headers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co";
    const supabaseOrigin = supabaseUrl.startsWith("http") ? new URL(supabaseUrl).origin : supabaseUrl;
    const supabaseWss    = supabaseOrigin.replace("https://", "wss://");
    const csp = [
      "default-src 'self'",
      // Next.js requires 'unsafe-eval' in dev; 'unsafe-inline' for HMR + styled-jsx
      `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${supabaseOrigin} https://vitals.vercel-insights.com`,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: ${supabaseOrigin} https://lh3.googleusercontent.com`,
      `media-src 'self' blob: ${supabaseOrigin}`,
      `connect-src 'self' ${supabaseOrigin} ${supabaseWss} https://accounts.google.com https://vitals.vercel-insights.com`,
      "frame-src https://accounts.google.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
      {
        // Pages auth et onboarding — non indexables par les moteurs de recherche
        source: "/(auth|onboarding)/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        // Assets statiques Next.js — cache 1 an (immutable car hash dans le nom)
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Images optimisées Next.js — cache 24h avec revalidation
        source: "/_next/image/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" },
        ],
      },
      {
        // Covers et visuels catalogue — contenu stable, cache 7 jours
        source: "/storage/v1/object/public/catalog-visuals/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
      {
        // Autres fichiers storage (avatars, pièces jointes) — cache 1h
        source: "/storage/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=600" },
        ],
      },
    ];
  },
};

export default nextConfig;
