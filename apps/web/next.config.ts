import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@sonafrik/ui",
    "@sonafrik/shared",
    "@sonafrik/types",
    "@sonafrik/api",
    "@sonafrik/database",
  ],
  experimental: {
    optimizePackageImports: ["@sonafrik/ui", "@sonafrik/types"],
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
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
