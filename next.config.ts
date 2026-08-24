import { envServer } from "@/data/env/server";
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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: `${envServer.TIGRIS_STORAGE_BUCKET}.t3.tigrisfiles.io`,
      },
    ],
  },
};

export default nextConfig;
