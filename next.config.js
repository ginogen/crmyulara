/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'lh3.googleusercontent.com'],
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
  experimental: {
    serverActions: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "https": require.resolve("https-browserify"),
      "http": require.resolve("stream-http"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "assert": require.resolve("assert/"),
      "url": require.resolve("url/"),
      "zlib": require.resolve("browserify-zlib"),
      "buffer": require.resolve("buffer/"),
      "util": require.resolve("util/"),
      "path": require.resolve("path-browserify"),
    };
    return config;
  },
};

module.exports = nextConfig; 