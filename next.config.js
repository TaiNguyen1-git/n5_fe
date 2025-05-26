/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cấu hình thư mục pages
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Cấu hình đường dẫn - tối ưu hóa và gộp từ cả 2 file config
  async rewrites() {
    return [
      // API proxy chung - ưu tiên cao nhất
      {
        source: '/api/:path*',
        destination: 'https://ptud-web-1.onrender.com/api/:path*',
        basePath: false
      }
    ]
  },

  // Cấu hình hình ảnh - tối ưu hóa
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
    // Tối ưu hóa hình ảnh
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Cấu hình cơ bản - tối ưu hóa
  reactStrictMode: false, // Giữ false để tránh double rendering
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Tối ưu hóa build performance
  staticPageGenerationTimeout: 180,

  // Tối ưu hóa bundle size
  experimental: {
    optimizePackageImports: ['antd', 'react-icons', 'date-fns'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Tối ưu hóa transpile packages
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

  // Environment variables
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://ptud-web-1.onrender.com/api',
    useProxy: process.env.NEXT_PUBLIC_USE_PROXY || 'true',
    useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA || 'false',
  },

  // Webpack tối ưu hóa
  webpack: (config, { dev, isServer }) => {
    // Tối ưu hóa bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          antd: {
            test: /[\\/]node_modules[\\/]antd[\\/]/,
            name: 'antd',
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },
}

module.exports = nextConfig