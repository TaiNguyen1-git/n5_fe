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
    domains: ['images.unsplash.com'],
  }
}

module.exports = nextConfig 