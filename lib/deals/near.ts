import { createClient } from "@/lib/supabase/server";
import type { FeedDeal } from "@/lib/deals/query";

/**
 * "Deals near me" via the PostGIS deals_near() RPC (ST_DWithin + great-circle
 * distance, GiST-indexed). Returns one row per deal at its nearest outlet,
 * globally sorted by distance.
 */

export type NearLocation = {
  id: string;
  lat: number;
  lng: number;
  address: string | null;
  postal_code: string | null;
};

export type NearDeal = FeedDeal & {
  distance_m: number;
  location: NearLocation;
};

type RpcRow = { deal_id: string; location_id: string; distance_m: number };

export async function getDealsNear(
  lat: number,
  lng: number,
  radiusM = 3000,
): Promise<NearDeal[]> {
  const supabase = await createClient();

  const { data: rpc, error } = await supabase.rpc("deals_near", {
    in_lat: lat,
    in_lng: lng,
    in_radius_m: radiusM,
  });
  if (error) throw new Error(`deals_near: ${error.message}`);
  const rows = (rpc ?? []) as RpcRow[];
  if (rows.length === 0) return [];

  const dealIds = rows.map((r) => r.deal_id);
  const locIds = rows.map((r) => r.location_id);

  const [{ data: dealsData }, { data: locsData }] = await Promise.all([
    supabase
      .from("deals")
      .select(
        "id, title, description, deal_type, discount_value, image_url, channels, dietary_tags, start_at, end_at, created_at, " +
          "businesses!inner(name, slug, price_level, cuisine_tags, logo_url, verified, status)",
      )
      .in("id", dealIds)
      .eq("status", "live"),
    supabase
      .from("locations")
      .select("id, lat, lng, address, postal_code")
      .in("id", locIds),
  ]);

  const dealsById = new Map<string, Record<string, unknown>>();
  for (const d of (dealsData ?? []) as unknown as Record<string, unknown>[]) {
    dealsById.set(d.id as string, d);
  }
  const locsById = new Map<string, NearLocation>();
  for (const l of (locsData ?? []) as unknown as NearLocation[]) {
    locsById.set(l.id, l);
  }

  const out: NearDeal[] = [];
  for (const r of rows) {
    const d = dealsById.get(r.deal_id);
    const loc = locsById.get(r.location_id);
    if (!d || !loc) continue;
    const biz = Array.isArray(d.businesses) ? d.businesses[0] : d.businesses;
    out.push({
      ...(d as unknown as FeedDeal),
      businesses: biz,
      featured: false,
      placementTier: null,
      geoScope: null,
      distance_m: r.distance_m,
      location: loc,
    });
  }

  return out.sort((a, b) => a.distance_m - b.distance_m);
}
