import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Avoid build failure from Next.js 16 generated .next/dev/types (Route constraint bug)
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      }
    ],
  },
};

export default nextConfig;
