/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@afipsdk/afip.js'],
  },
};

module.exports = nextConfig;