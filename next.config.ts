import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "@base-ui/react"],
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
