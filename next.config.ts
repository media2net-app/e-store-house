import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { qualities: [60, 75], imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512], formats: ["image/avif", "image/webp"], remotePatterns: [
    { protocol: "https", hostname: "cdn.dsmcdn.com", port: "", pathname: "/**", search: "" },
    { protocol: "https", hostname: "raw.githubusercontent.com", pathname: "/media2net-app/**" },
    { protocol: "https", hostname: "www.estorehouse.ro", pathname: "/**" },
    { protocol: "https", hostname: "emag-api.estorehouse.ro", pathname: "/**" },
  ] },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
    ] }];
  },
  reactCompiler: true,
};

export default nextConfig;
