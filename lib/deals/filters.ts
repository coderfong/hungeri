import type { DealFilters } from "@/lib/deals/query";

/** URL <-> DealFilters. Multi-value facets are comma-separated in the query string. */

export type SearchParams = Record<string, string | string[] | undefined>;

function list(v: string | string[] | undefined): string[] | undefined {
  if (!v) return undefined;
  const arr = (Array.isArray(v) ? v.join(",") : v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? arr : undefined;
}

export function parseFilters(sp: SearchParams): DealFilters {
  return {
    q: typeof sp.q === "string" && sp.q.trim() ? sp.q.trim() : undefined,
    cuisine: list(sp.cuisine),
    dealType: list(sp.type),
    priceLevel: list(sp.price)?.map(Number).filter((n) => n >= 1 && n <= 4),
    channel: list(sp.channel),
    dietary: list(sp.dietary),
    endingSoon: sp.ending === "1",
    newToday: sp.new === "1",
  };
}

/** Count active filters for the "Filters (n)" badge. */
export function countActive(f: DealFilters): number {
  return (
    (f.cuisine?.length ?? 0) +
    (f.dealType?.length ?? 0) +
    (f.priceLevel?.length ?? 0) +
    (f.channel?.length ?? 0) +
    (f.dietary?.length ?? 0) +
    (f.endingSoon ? 1 : 0) +
    (f.newToday ? 1 : 0)
  );
}

/** Build a query string from a partial filter set (used by links/toggles). */
export function toQueryString(f: DealFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.cuisine?.length) p.set("cuisine", f.cuisine.join(","));
  if (f.dealType?.length) p.set("type", f.dealType.join(","));
  if (f.priceLevel?.length) p.set("price", f.priceLevel.join(","));
  if (f.channel?.length) p.set("channel", f.channel.join(","));
  if (f.dietary?.length) p.set("dietary", f.dietary.join(","));
  if (f.endingSoon) p.set("ending", "1");
  if (f.newToday) p.set("new", "1");
  const s = p.toString();
  return s ? `?${s}` : "";
}
