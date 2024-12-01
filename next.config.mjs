/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ktvilla-images.s3.ap-northeast-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ktvilla-images.s3.amazonaws.com",
        pathname: "/**",
      }
    ]
  }
};

export default nextConfig;
