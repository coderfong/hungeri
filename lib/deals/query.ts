import { createClient } from "@/lib/supabase/server";
import type { DealRow, DealType, DealChannel, PlacementTier } from "@/types/database";
import { rankDeals, type GeoScope } from "@/lib/ranking";

/**
 * Deal queries for the consumer surface. Filtering is pushed to Postgres (FTS +
 * indexed columns + array overlaps) so it scales; the FTS lives behind this
 * module so it can later move to a dedicated search service.
 *
 * Ordering here is "ranking-lite": active paid placements first, then soonest to
 * expire. The full config-driven ranking module (distance/recency/engagement
 * weights) replaces this in M5 — see lib/ranking.
 */

export type FeedBusiness = {
  id: string;
  name: string;
  slug: string;
  price_level: number | null;
  cuisine_tags: string[];
  logo_url: string | null;
  /** Shop-level cover image (separate from any individual deal's image). */
  cover_url: string | null;
  verified: boolean;
};

export type FeedDeal = Pick<
  DealRow,
  | "id"
  | "title"
  | "description"
  | "deal_type"
  | "discount_value"
  | "image_url"
  | "channels"
  | "dietary_tags"
  | "start_at"
  | "end_at"
  | "created_at"
> & {
  businesses: FeedBusiness | null;
  featured: boolean;
  /** Active paid placement tier (drives ranking + label), null if organic. */
  placementTier: PlacementTier | null;
  geoScope: GeoScope;
};

export type DealFilters = {
  q?: string;
  cuisine?: string[];
  dealType?: string[];
  priceLevel?: number[];
  channel?: string[];
  dietary?: string[];
  endingSoon?: boolean;
  newToday?: boolean;
  limit?: number;
};

const FEED_SELECT =
  "id, title, description, deal_type, discount_value, image_url, channels, dietary_tags, start_at, end_at, created_at, " +
  "businesses!inner(id, name, slug, price_level, cuisine_tags, logo_url, cover_url, verified, status), " +
  "featured_placements(tier, status, start_at, end_at)";

const DAY_MS = 86_400_000;

type RawRow = Record<string, unknown>;

/** Normalise a raw joined row into a FeedDeal (Supabase returns nested arrays/objects). */
function toFeedDeal(row: RawRow): FeedDeal {
  const biz = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses;
  const placements = (row.featured_placements as RawRow[] | null) ?? [];
  const now = Date.now();
  const active = placements.find(
    (p) =>
      p.status === "active" &&
      new Date(p.start_at as string).getTime() <= now &&
      new Date(p.end_at as string).getTime() > now,
  );
  const scope = active?.geo_scope as
    | { lat?: number; lng?: number; radius_m?: number }
    | null
    | undefined;
  const geoScope: GeoScope =
    scope && scope.lat != null && scope.lng != null && scope.radius_m != null
      ? { lat: scope.lat, lng: scope.lng, radiusM: scope.radius_m }
      : null;
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    deal_type: row.deal_type as FeedDeal["deal_type"],
    discount_value: row.discount_value as number | null,
    image_url: row.image_url as string | null,
    channels: (row.channels as FeedDeal["channels"]) ?? [],
    dietary_tags: (row.dietary_tags as string[]) ?? [],
    start_at: row.start_at as string,
    end_at: row.end_at as string,
    created_at: row.created_at as string,
    businesses: biz
      ? {
          id: biz.id,
          name: biz.name,
          slug: biz.slug,
          price_level: biz.price_level,
          cuisine_tags: biz.cuisine_tags ?? [],
          logo_url: biz.logo_url,
          cover_url: biz.cover_url ?? null,
          verified: biz.verified,
        }
      : null,
    featured: !!active,
    placementTier: (active?.tier as PlacementTier | undefined) ?? null,
    geoScope,
  };
}

/** Fetch live deals matching the filters, ordered ranking-lite. */
export async function getFeedDeals(filters: DealFilters = {}): Promise<FeedDeal[]> {
  const supabase = await createClient();
  let query = supabase
    .from("deals")
    .select(FEED_SELECT)
    .eq("status", "live")
    .eq("businesses.status", "live");

  if (filters.q) {
    // Match deal title/description AND the shop name + cuisine. (The deals FTS
    // vector only covers deal text, so business-name matches like "birds" need
    // an explicit lookup.) Sanitise chars that would break PostgREST or-syntax.
    const q = filters.q.replace(/[,()%*{}]/g, " ").trim();
    const cap = q.charAt(0).toUpperCase() + q.slice(1);
    const { data: bizMatches } = await supabase
      .from("businesses")
      .select("id")
      .eq("status", "live")
      .or(`name.ilike.%${q}%,cuisine_tags.cs.{${cap}}`);
    const bizIds = (bizMatches ?? []).map((b) => b.id);
    const ors = [`title.ilike.%${q}%`, `description.ilike.%${q}%`];
    if (bizIds.length) ors.push(`business_id.in.(${bizIds.join(",")})`);
    query = query.or(ors.join(","));
  }
  if (filters.dealType?.length)
    query = query.in("deal_type", filters.dealType as DealType[]);
  if (filters.cuisine?.length)
    query = query.overlaps("businesses.cuisine_tags", filters.cuisine);
  if (filters.priceLevel?.length)
    query = query.in("businesses.price_level", filters.priceLevel);
  if (filters.channel?.length)
    query = query.overlaps("channels", filters.channel as DealChannel[]);
  if (filters.dietary?.length)
    query = query.overlaps("dietary_tags", filters.dietary);
  if (filters.endingSoon)
    query = query.lte("end_at", new Date(Date.now() + DAY_MS).toISOString());
  if (filters.newToday)
    query = query.gte("created_at", new Date(Date.now() - DAY_MS).toISOString());

  query = query.order("end_at", { ascending: true }).limit(filters.limit ?? 60);

  const { data, error } = await query;
  if (error) throw new Error(`getFeedDeals: ${error.message}`);

  const deals = ((data ?? []) as unknown as RawRow[]).map(toFeedDeal);

  // Rank via the shared ranking module. No viewer location on the home feed, so
  // distance is neutral and placements apply everywhere (within their geo radius
  // when a viewer location is later provided, e.g. on the map). Engagement is
  // omitted here to keep the feed query light.
  const ranked = rankDeals(
    deals.map((d) => ({
      id: d.id,
      createdAt: d.created_at,
      endAt: d.end_at,
      placement: d.placementTier ? { tier: d.placementTier, geoScope: d.geoScope } : null,
    })),
  );
  const order = new Map(ranked.map((r, i) => [r.id, i]));
  return deals.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

/** Just the active featured/spotlight deals, for the homepage spotlight strip. */
export async function getSpotlightDeals(limit = 5): Promise<FeedDeal[]> {
  const all = await getFeedDeals({ limit: 60 });
  return all.filter((d) => d.featured).slice(0, limit);
}

/**
 * Shop-centric listing for the home feed: one entry per business, carrying its
 * top-ranked ("headline") deal, how many live deals it has, and whether any are
 * paid-featured. Built on the ranked deal feed so shop order follows ranking and
 * featured shops surface first.
 */
export type ShopListing = {
  business: FeedBusiness;
  /** Top-ranked live deal, or null for a live shop that has no deals yet. */
  headline: FeedDeal | null;
  dealCount: number;
  /** Paid placement is active. */
  featured: boolean;
  /** Admin/super-merchant curated into the homepage carousel. */
  spotlight: boolean;
};

/**
 * Business ids curated into the homepage carousel. Guarded: if the `spotlight`
 * column hasn't been added yet (migration 0011) this quietly returns none so the
 * feed never breaks.
 */
async function getSpotlightIds(): Promise<Set<string>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("spotlight", true)
      .eq("status", "live");
    if (error) return new Set();
    return new Set((data ?? []).map((b) => b.id));
  } catch {
    return new Set();
  }
}

const SHOP_SELECT = "id, name, slug, price_level, cuisine_tags, logo_url, cover_url, verified";

/** Any active facet means the feed is deal-driven; dealless shops don't apply. */
function hasAnyFilter(f: DealFilters): boolean {
  return !!(
    f.q ||
    f.cuisine?.length ||
    f.dealType?.length ||
    f.priceLevel?.length ||
    f.channel?.length ||
    f.dietary?.length ||
    f.endingSoon ||
    f.newToday
  );
}

export async function getFeedShops(filters: DealFilters = {}): Promise<ShopListing[]> {
  const [deals, spotlightIds] = await Promise.all([
    getFeedDeals({ ...filters, limit: filters.limit ?? 120 }),
    getSpotlightIds(),
  ]);
  const byShop = new Map<string, ShopListing>();
  for (const d of deals) {
    const biz = d.businesses;
    if (!biz) continue;
    const existing = byShop.get(biz.slug);
    if (!existing) {
      byShop.set(biz.slug, {
        business: biz,
        headline: d,
        dealCount: 1,
        featured: d.featured,
        spotlight: spotlightIds.has(biz.id),
      });
    } else {
      existing.dealCount += 1;
      existing.featured = existing.featured || d.featured;
    }
  }

  // Include live shops that have no live deals so every merchant is discoverable
  // (and so a spotlighted dealless shop still appears). Only on the unfiltered
  // feed — filtered views are inherently deal-driven.
  if (!hasAnyFilter(filters)) {
    const supabase = await createClient();
    const { data } = await supabase.from("businesses").select(SHOP_SELECT).eq("status", "live");
    for (const b of (data ?? []) as FeedBusiness[]) {
      if (byShop.has(b.slug)) continue;
      byShop.set(b.slug, {
        business: { ...b, cover_url: b.cover_url ?? null, cuisine_tags: b.cuisine_tags ?? [] },
        headline: null,
        dealCount: 0,
        featured: false,
        spotlight: spotlightIds.has(b.id),
      });
    }
  }

  return [...byShop.values()];
}
