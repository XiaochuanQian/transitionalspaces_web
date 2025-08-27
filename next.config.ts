import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['three'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
