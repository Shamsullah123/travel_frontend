import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXTAUTH_SECRET: 'dev_secret_key_123',
    NEXT_PUBLIC_BACKEND_URL: 'http://127.0.0.1:5000',
    NEXT_PUBLIC_API_URL: 'http://127.0.0.1:5000/api',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  /* config options here */
};

export default nextConfig;
