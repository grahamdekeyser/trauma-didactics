import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, which is too small for journal-article PDF uploads.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
