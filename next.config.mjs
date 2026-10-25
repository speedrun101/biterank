/** @type {import('next').Config} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Prevents Unsplash domain whitelist errors
  },
};

export default nextConfig;