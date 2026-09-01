import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/guide", destination: "/map", permanent: true },
      { source: "/mypage/reservations", destination: "/visit", permanent: true },
    ];
  },
  images: {
    // Windows DNS64/NAT64 maps public hosts (e.g. *.supabase.co via Cloudflare)
    // to 64:ff9b::/96, which Next.js 16 treats as a private IP and blocks.
    // Keep this off in production so SSRF protection stays intact.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
