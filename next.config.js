/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://ptud-web-1.onrender.com/api/:path*',
        basePath: false
      }
    ]
  },
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
  // Tăng timeout cho API requests
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
    externalResolver: true,
  },
  // Add production settings
  swcMinify: true,
  reactStrictMode: false,
  // Add environment variables that can be accessed client-side
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://ptud-web-1.onrender.com/api',
    useProxy: process.env.NEXT_PUBLIC_USE_PROXY || 'true',
    useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA || 'false',
  }
}

module.exports = nextConfig 