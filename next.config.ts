import type { NextConfig } from 'next';
const backend = (process.env.API_PROXY_TARGET || 'http://127.0.0.1:5000').replace(/\/+$/, '');
const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.*.*', '10.*.*.*', ...Array.from({ length: 16 }, (_, i) => `172.${i + 16}.*.*`), ...(process.env.DEV_ALLOWED_ORIGINS || '').split(',').filter(Boolean)],
  async rewrites() { return [{ source: '/backend/:path*', destination: `${backend}/:path*` }]; },
};
export default nextConfig;
