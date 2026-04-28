import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["dexie", "dexie-react-hooks"],
};

export default nextConfig;
