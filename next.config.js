/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://ptud-web-1.onrender.com/api/:path*'
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
  }
}

module.exports = nextConfig 