import { createClient } from "@/lib/supabase/server";
import type { BusinessRow, LocationRow } from "@/types/database";
import type { FeedDeal } from "@/lib/deals/query";

export type BusinessProfile = BusinessRow & {
  locations: LocationRow[];
  deals: FeedDeal[];
};

/** Public business profile by slug: the live business + its live deals + outlets. */
export async function getBusinessBySlug(slug: string): Promise<BusinessProfile | null> {
  const supabase = await createClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .select("*, locations(*)")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();
  if (error || !business) return null;

  const { data: deals } = await supabase
    .from("deals")
    .select(
      "id, title, description, deal_type, discount_value, image_url, channels, dietary_tags, start_at, end_at, created_at",
    )
    .eq("business_id", business.id)
    .eq("status", "live")
    .order("end_at", { ascending: true });

  const row = business as unknown as BusinessRow & { locations: LocationRow[] };
  return {
    ...row,
    locations: row.locations ?? [],
    deals: ((deals ?? []) as unknown as FeedDeal[]).map((d) => ({
      ...d,
      businesses: {
        name: row.name,
        slug: row.slug,
        price_level: row.price_level,
        cuisine_tags: row.cuisine_tags,
        logo_url: row.logo_url,
        verified: row.verified,
      },
      featured: false,
      placementTier: null,
      geoScope: null,
    })),
  };
}
