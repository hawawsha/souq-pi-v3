/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },

  env: {
  NEXT_PUBLIC_PI_NETWORK: process.env.PI_NETWORK || "testnet",
  NEXT_PUBLIC_PI_APP_ID: process.env.PI_APP_ID,
  PI_API_BASE_URL: process.env.PI_API_BASE_URL,
},

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.minepi.com",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },

  compress: true,
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
