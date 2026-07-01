import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const supabaseStorageRemotePatterns = (
  ["/storage/v1/object/public/**", "/storage/v1/object/sign/**"] as const
).map((pathname) => ({
  protocol: "https" as const,
  hostname: supabaseHostname,
  pathname,
}));

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Repositionne l'indicateur dev Next.js (évite chevauchement sidebar)
  devIndicators: {
    position: "bottom-right",
  },
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
    qualities: [55, 75, 80],
    remotePatterns: supabaseStorageRemotePatterns,
  },
  serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],
  experimental: {
    // Next.js 15 : cache client-side router
    staleTimes: {
      static: 300,
      dynamic: 120,
    },
    // Tree-shaking — @sonafrik/ui/types/api/shared exclus : barrel optimizer casse les exports runtime en dev
    optimizePackageImports: [
      "@sentry/nextjs",
      "@sonafrik/shared",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
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
      // Libellé UI « Explorer » → route réelle /search
      {
        source: "/explorer",
        destination: "/search",
        permanent: false,
      },
    ];
  },
  async headers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co";
    const supabaseOrigin = supabaseUrl.startsWith("http") ? new URL(supabaseUrl).origin : supabaseUrl;
    const supabaseWss    = supabaseOrigin.replace("https://", "wss://");
    const isProd = process.env.NODE_ENV === "production";
    // CSP prod : unsafe-inline requis par Next.js 15 (scripts inline) + Tailwind + Vercel Analytics.
    // Roadmap post-beta : nonces script-src (middleware) + style-src sans unsafe-inline.
    const scriptSrc = isProd
      ? `'self' 'unsafe-inline' ${supabaseOrigin} https://vitals.vercel-insights.com`
      : `'self' 'unsafe-eval' 'unsafe-inline' ${supabaseOrigin} https://vitals.vercel-insights.com`;
    const csp = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "style-src-attr 'self'",
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

export default withBundleAnalyzer(nextConfig);
