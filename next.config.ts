import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly define workspace root to prevent Turbopack from climbing up to parent lockfiles
    root: __dirname,
  },
};

export default nextConfig;

