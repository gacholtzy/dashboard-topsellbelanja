import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  rewrites: async () => {
    return [
      {
        source: "/backend/:path*",
        destination:
          process.env.API_URL || "http://localhost:8080/api/v1/:path*",
      },
    ];
  },
  output: "standalone",
};

export default nextConfig;
