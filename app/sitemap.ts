import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { clientEnv } from "@/lib/env";

/**
 * Dynamic sitemap of live, server-rendered pages: the feed plus every live deal
 * and business (the SEO-bearing pages with Schema.org markup). Anonymous RLS
 * read returns only public/live rows, which is exactly what we want indexed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = clientEnv.NEXT_PUBLIC_SITE_URL;
  const supabase = await createClient();

  const [{ data: deals }, { data: businesses }] = await Promise.all([
    supabase.from("deals").select("id, updated_at").eq("status", "live").limit(5000),
    supabase
      .from("businesses")
      .select("slug, updated_at")
      .eq("status", "live")
      .limit(5000),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/search`, changeFrequency: "daily", priority: 0.5 },
    { url: `${base}/near-me`, changeFrequency: "daily", priority: 0.5 },
  ];

  const dealPages: MetadataRoute.Sitemap = (deals ?? []).map((d) => ({
    url: `${base}/deals/${d.id}`,
    lastModified: d.updated_at ?? undefined,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const bizPages: MetadataRoute.Sitemap = (businesses ?? []).map((b) => ({
    url: `${base}/b/${b.slug}`,
    lastModified: b.updated_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...dealPages, ...bizPages];
}
