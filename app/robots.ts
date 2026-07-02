import type { MetadataRoute } from "next";
import { clientEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = clientEnv.NEXT_PUBLIC_SITE_URL;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep authed/ops areas out of the index.
      disallow: ["/dashboard", "/admin", "/account", "/api", "/auth"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
