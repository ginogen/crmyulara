/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  transpilePackages: [],
  typescript: {
    // Ignorar errores de TS durante la construcción
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 