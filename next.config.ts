import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'ptud-web-1.onrender.com'],
  },
  // Tăng timeout cho API requests
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '4mb',
    externalResolver: true,
  },
  transpilePackages: [
    'rc-util',
    'rc-picker',
    'rc-pagination',
    '@ant-design/icons-svg'
  ],
  async rewrites() {
    return [
      // API cơ bản
      {
        source: '/api/:path*',
        destination: 'https://ptud-web-1.onrender.com/api/:path*',
      },
      // API đăng ký user
      {
        source: '/api/register',
        destination: 'https://ptud-web-1.onrender.com/api/User/RegisterUser',
      },
      // API login không cần rewrite vì đã có handler riêng ở /api/login-handler.ts
      // API auth đặc biệt cho đăng ký
      {
        source: '/api/auth',
        destination: 'https://ptud-web-1.onrender.com/api/Auth/Register',
      },
      // API auth với "auth" viết thường
      {
        source: '/auth/:path*',
        destination: 'https://ptud-web-1.onrender.com/api/Auth/:path*',
      },
      // API auth với "Auth" viết hoa
      {
        source: '/Auth/:path*',
        destination: 'https://ptud-web-1.onrender.com/api/Auth/:path*',
      },
      // API người dùng
      {
        source: '/api/users',
        destination: 'https://ptud-web-1.onrender.com/api/User/GetAll',
      },
      {
        source: '/api/users/:id',
        destination: 'https://ptud-web-1.onrender.com/api/User/GetById?id=:id',
      },
      // API phòng
      {
        source: '/api/rooms',
        destination: 'https://ptud-web-1.onrender.com/api/Phong/GetAll',
      },
      {
        source: '/api/rooms/:id',
        destination: 'https://ptud-web-1.onrender.com/api/Phong/GetById?id=:id',
      },
      // API đặt phòng
      {
        source: '/api/booking',
        destination: 'https://ptud-web-1.onrender.com/api/DatPhong/Create',
      },
      {
        source: '/api/booking/:id',
        destination: 'https://ptud-web-1.onrender.com/api/DatPhong/GetById?id=:id',
      },
      // API dịch vụ
      {
        source: '/api/services',
        destination: 'https://ptud-web-1.onrender.com/api/DichVu/GetAll',
      },
      {
        source: '/api/services/:id',
        destination: 'https://ptud-web-1.onrender.com/api/DichVu/GetById?id=:id',
      },
      // API liên hệ
      {
        source: '/api/contact',
        destination: 'https://ptud-web-1.onrender.com/api/LienHe/Create',
      },
    ];
  },
};

export default nextConfig;
