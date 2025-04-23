import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  async rewrites() {
    return [
      // API cơ bản
      {
        source: '/api/:path*',
        destination: 'https://ptud-web-1.onrender.com/api/:path*',
      },
      // API auth với "auth" viết thường
      {
        source: '/auth/:path*',
        destination: 'https://ptud-web-1.onrender.com/api/auth/:path*',
      },
      // API auth với "Auth" viết hoa
      {
        source: '/Auth/:path*',
        destination: 'https://ptud-web-1.onrender.com/api/Auth/:path*',
      },
      // API login trực tiếp
      {
        source: '/login',
        destination: 'https://ptud-web-1.onrender.com/api/auth/login',
      },
      // API register trực tiếp
      {
        source: '/register',
        destination: 'https://ptud-web-1.onrender.com/api/auth/register',
      },
    ];
  },
};

export default nextConfig;
