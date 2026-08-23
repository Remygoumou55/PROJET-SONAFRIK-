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
    "@sonafrik/realtime",
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
      {
        source: "/auth/aide",
        destination: "/auth/mot-de-passe-oublie",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        // Pages auth et onboarding — non indexables par les moteurs de recherche
        source: "/(auth|onboarding)/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        // Favicon + manifest PWA — SVG unique, cache long (Sprint 5 Asset Engine)
        source: "/favicon.svg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" },
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
