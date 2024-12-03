/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: 'stablesoaps-w1.s3.us-west-1.amazonaws.com',
        pathname: "/**",
        pathname: '/dreamshop/**',
      },
      {
        protocol: "https",
        hostname: 'stablesoaps-w1.s3.amazonaws.com',
        pathname: "/**",
        pathname: '/dreamshop/**',
      }
    ]
  }
};

export default nextConfig;
