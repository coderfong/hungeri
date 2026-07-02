import { createClient } from "@/lib/supabase/server";
import type { DealRow, LocationRow } from "@/types/database";

export type DealDetailBusiness = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_level: number | null;
  cuisine_tags: string[];
  logo_url: string | null;
  verified: boolean;
};

export type DealDetail = DealRow & {
  business: DealDetailBusiness | null;
  locations: LocationRow[];
  featured: boolean;
  saved: boolean;
  isAuthed: boolean;
};

// Note: locations relate to businesses (not deals), so they can't be embedded
// from the deals row — they're fetched separately by business_id below.
const DETAIL_SELECT =
  "*, businesses(id, name, slug, description, price_level, cuisine_tags, logo_url, verified), " +
  "featured_placements(tier, status, start_at, end_at)";

/** Full deal for the detail page. Returns null if not visible under RLS. */
export async function getDealDetail(id: string): Promise<DealDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("deals")
    .select(DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as unknown as Record<string, unknown>;
  const biz = (Array.isArray(row.businesses) ? row.businesses[0] : row.businesses) as
    | DealDetailBusiness
    | null;
  const placements = (row.featured_placements as Record<string, unknown>[] | null) ?? [];
  const now = Date.now();
  const featured = placements.some(
    (p) =>
      p.status === "active" &&
      new Date(p.start_at as string).getTime() <= now &&
      new Date(p.end_at as string).getTime() > now,
  );

  // Outlets for this brand (locations FK -> businesses).
  let locations: LocationRow[] = [];
  if (biz?.id) {
    const { data: locs } = await supabase
      .from("locations")
      .select("*")
      .eq("business_id", biz.id);
    locations = (locs as unknown as LocationRow[]) ?? [];
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let saved = false;
  if (user) {
    const { data: s } = await supabase
      .from("saves")
      .select("id")
      .eq("consumer_id", user.id)
      .eq("deal_id", id)
      .maybeSingle();
    saved = !!s;
  }

  return {
    ...(row as unknown as DealRow),
    business: biz,
    locations,
    featured,
    saved,
    isAuthed: !!user,
  };
}
