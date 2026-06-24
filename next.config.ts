import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self' blob: data:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
              "worker-src 'self' blob:",
              "connect-src 'self' https: wss: blob:",
              "media-src 'self' blob: https:",
              "style-src 'self' 'unsafe-inline'",
            ].join("; ")
          }
        ]
      }
    ];
  }
};

export default nextConfig;