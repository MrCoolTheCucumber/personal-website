/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: ["user-images.githubusercontent.com", "i.imgur.com"],
  },
  experimental: {
    images: {
      unoptimized: true,
    },
  },
  webpack: (config, ctx) => {
    config.experiments.asyncWebAssembly = true;
    return config;
  },
};

module.exports = nextConfig;
