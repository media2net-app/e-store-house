import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [
    { protocol: "https", hostname: "cdn.dsmcdn.com", port: "", pathname: "/**", search: "" },
    { protocol: "https", hostname: "raw.githubusercontent.com", pathname: "/media2net-app/**" },
    { protocol: "https", hostname: "www.estorehouse.ro", pathname: "/**" },
    { protocol: "https", hostname: "emag-api.estorehouse.ro", pathname: "/**" },
  ] },
  reactCompiler: true,
};

export default nextConfig;
