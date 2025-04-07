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
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "fs": false,
      "net": false,
      "tls": false,
      "child_process": false,
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
      "os": require.resolve("os-browserify/browser"),
      "process": require.resolve("process/browser"),
      "querystring": require.resolve("querystring-es3"),
    };

    const webpack = require('webpack');
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      })
    );

    return config;
  },
};

module.exports = nextConfig; 