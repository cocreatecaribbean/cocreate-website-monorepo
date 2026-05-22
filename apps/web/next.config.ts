import { withNextVideo } from "next-video/process";
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.cosmicjs.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },

  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    }
  },

  turbopack: {
    root: path.resolve(__dirname, '../../'),  // ← now absolute
  },

  transpilePackages: ['three'],
};

export default withNextVideo(nextConfig);