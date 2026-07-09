import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint 9 flat-config migration is a follow-up; type-checking still runs.
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kflzqkuioiiyfrvlvcvl.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Photo uploads via server-action FormData exceed the 1MB default.
      bodySizeLimit: "8mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Only our own admin EditCanvas may frame the site (edit-mode safety).
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
  async redirects() {
    // Legacy clothing-site routes -> new directory home (301, preserve equity).
    return [
      { source: "/shop", destination: "/", permanent: true },
      { source: "/shop/:slug", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
