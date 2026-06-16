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
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
        // Fichiers media publics (covers, avatars depuis storage Supabase)
        source: "/storage/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=600" },
        ],
      },
    ];
  },
};

export default nextConfig;
