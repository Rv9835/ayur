import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  headers: async () => {
    const isDev = process.env.NODE_ENV !== "production";
    return isDev
      ? [
          {
            source: "/(.*)",
            headers: [
              {
                key: "Cross-Origin-Opener-Policy",
                value: "same-origin-allow-popups",
              },
            ],
          },
        ]
      : [];
  },
};

export default nextConfig;
