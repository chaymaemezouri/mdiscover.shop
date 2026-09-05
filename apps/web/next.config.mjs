/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.mdiscover.shop' },
      { protocol: 'https', hostname: 'mdiscover.shop' },
      { protocol: 'http', hostname: 'localhost', port: '4000' },
      { protocol: 'http', hostname: 'localhost', port: '9000' },
    ],
  },
  transpilePackages: ['@mdiscovershop/shared'],
  async rewrites() {
    const adminOrigin = process.env.ADMIN_ORIGIN ?? 'http://localhost:3002';
    // Browser URLs use https://mdiscover.shop/media/... — proxy to API /uploads (MinIO)
    const mediaOrigin = (
      process.env.MEDIA_PROXY_ORIGIN ||
      process.env.API_INTERNAL_URL ||
      'http://localhost:4000'
    ).replace(/\/$/, '');
    return {
      beforeFiles: [
        {
          source: '/admin',
          destination: `${adminOrigin}/admin`,
        },
        {
          source: '/admin/:path*',
          destination: `${adminOrigin}/admin/:path*`,
        },
        {
          source: '/media/:path*',
          destination: `${mediaOrigin}/uploads/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
