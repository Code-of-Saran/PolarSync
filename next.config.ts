import type { NextConfig } from "next";

// FastAPI backend (see backend/). All /api and /files requests are proxied so the
// browser talks to a single origin (no CORS, works over LAN for mobile testing).
const BACKEND_URL = process.env.POLARSYNC_API_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'unpkg.com' },
    ],
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
      { source: '/files/:path*', destination: `${BACKEND_URL}/files/:path*` },
    ];
  },
};

export default nextConfig;
