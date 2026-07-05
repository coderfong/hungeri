import type { NextConfig } from "next";

// Merchant/admin-uploaded imagery lives in the public Supabase Storage bucket;
// derive its host from the project URL so next/image will optimise it.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  images: {
    // Our own default role avatars in /public/avatars are SVGs. Allow the image
    // optimizer to serve them, sandboxed by a strict CSP (no scripts).
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      ...(supabaseHost
        ? ([
            {
              protocol: "https",
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ] as const)
        : []),
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
