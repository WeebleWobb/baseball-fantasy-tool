import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['s.yimg.com'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://s.yimg.com https://s1.yimg.com",
              "img-src 'self' data: https: https://s.yimg.com",
              "font-src 'self' data: https://s.yimg.com https://s1.yimg.com",
              "connect-src 'self' https://api.login.yahoo.com https://*.yahoo.com https://*.yimg.com https://geo.yahoo.com https://server-dev.comet.yahoo.com https://server.comet.yahoo.com",
              "frame-src 'self' https://api.login.yahoo.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;