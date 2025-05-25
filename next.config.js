/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cấu hình thư mục pages
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Cấu hình đường dẫn
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://ptud-web-1.onrender.com/api/:path*',
        basePath: false
      }
    ]
  },

  // Cấu hình hình ảnh
  images: {
    domains: [
      'images.unsplash.com',
      'via.placeholder.com',
      'ptud-web-1.onrender.com',
      'i.imgur.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Cấu hình cơ bản
  reactStrictMode: false,
  eslint: {
    // Disable ESLint during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during build
    ignoreBuildErrors: true,
  },
  // Increase build timeout
  staticPageGenerationTimeout: 180,
  // Optimize bundle size
  experimental: {
    optimizePackageImports: ['antd'],
  },

  // Add transpile packages to fix module resolution issues
  transpilePackages: [
    'rc-util',
    'rc-picker',
    'rc-pagination',
    'rc-tree',
    'rc-table',
    '@ant-design/icons-svg',
    '@rc-component/trigger',
    '@rc-component/portal',
    '@rc-component/util',
    'rc-motion',
    'rc-resize-observer',
    'rc-virtual-list'
  ],

  // Add environment variables that can be accessed client-side
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://ptud-web-1.onrender.com/api',
    useProxy: process.env.NEXT_PUBLIC_USE_PROXY || 'true',
    useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA || 'false',
  }
}

module.exports = nextConfig