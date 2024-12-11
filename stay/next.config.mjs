import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
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

const withMDX = createMDX({});
export default withMDX(nextConfig);
