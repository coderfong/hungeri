import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Curated featured-banner imagery (Suntec directory creative assets).
      {
        protocol: "https",
        hostname: "s3.amazonaws.com",
        pathname: "/fileservice.in/**",
      },
      {
        protocol: "https",
        hostname: "platform-public-suntec-prod.s3.ap-southeast-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
