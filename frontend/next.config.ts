import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Enable static HTML export
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint during build process
  },
  distDir: "dist", // Optional: specify custom build output directory
  images: { unoptimized: true },
};

export default nextConfig;
