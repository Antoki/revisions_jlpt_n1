import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@google/genai"],
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
