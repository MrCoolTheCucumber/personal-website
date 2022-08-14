/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: ["user-images.githubusercontent.com", "i.imgur.com"],
  },
};

module.exports = nextConfig;
