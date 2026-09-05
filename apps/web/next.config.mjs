/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost', port: '9000' },
    ],
  },
  transpilePackages: ['@mdiscovershop/shared'],
  async rewrites() {
    const adminOrigin = process.env.ADMIN_ORIGIN ?? 'http://localhost:3002';
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
      ],
    };
  },
};

export default nextConfig;
