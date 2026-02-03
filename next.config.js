/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enable static export for Cloudflare Pages
  images: {
    unoptimized: true,  // Required for static export
  },
};

export default nextConfig;
