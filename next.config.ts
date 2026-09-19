import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@whiskeysockets/baileys', 'pino', 'jimp', 'sharp', '@ffmpeg-installer/ffmpeg'],
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;
