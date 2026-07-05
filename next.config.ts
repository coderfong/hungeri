import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Our own default role avatars in /public/avatars are SVGs. Allow the image
    // optimizer to serve them, sandboxed by a strict CSP (no scripts).
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
