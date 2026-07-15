import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  cacheComponents: true,
  reactCompiler: true,
  logging: {
    browserToTerminal: true,
  },
};

export default nextConfig;
