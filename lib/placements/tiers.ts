import type { PlacementTier } from "@/types/database";

/**
 * Placement tiers: what each paid tier does (radius, duration, price). Prices are
 * recorded on the placement for reporting but NOT charged yet — Stripe checkout
 * is deferred; placements activate immediately for now.
 */
export type TierSpec = {
  tier: PlacementTier;
  name: string;
  radiusM: number;
  durationHours: number;
  priceCents: number;
  blurb: string;
  recommended?: boolean;
};

export const TIERS: Record<PlacementTier, TierSpec> = {
  boosted: {
    tier: "boosted",
    name: "Boosted",
    radiusM: 1000,
    durationHours: 48,
    priceCents: 2000,
    blurb: "Lifts your deal higher in the feed near you.",
  },
  featured: {
    tier: "featured",
    name: "Featured",
    radiusM: 3000,
    durationHours: 168,
    priceCents: 5000,
    blurb: "Top hero strip on Home — first thing diners see.",
    recommended: true,
  },
  // Retired tier — kept so existing placements still render; not purchasable
  // (absent from TIER_ORDER).
  spotlight: {
    tier: "spotlight",
    name: "Spotlight",
    radiusM: 5000,
    durationHours: 168,
    priceCents: 19900,
    blurb: "Top hero strip on Home — first thing diners see.",
  },
};

export const TIER_ORDER: PlacementTier[] = ["boosted", "featured"];

/** Higher values win when stale/overlapping active placements exist. */
export const PLACEMENT_PRIORITY: Record<PlacementTier, number> = {
  boosted: 1,
  featured: 2,
  spotlight: 3,
};

export function higherPlacementTier(
  current: PlacementTier | null,
  candidate: PlacementTier | null,
): PlacementTier | null {
  if (!current) return candidate;
  if (!candidate) return current;
  return PLACEMENT_PRIORITY[candidate] > PLACEMENT_PRIORITY[current]
    ? candidate
    : current;
}

/** Featured and legacy spotlight placements belong in the homepage carousel. */
export function isCarouselPlacement(tier: PlacementTier | null): boolean {
  return tier === "featured" || tier === "spotlight";
}

/**
 * Put active Boosted listings at the front of the standard grid while keeping
 * the ranking order stable inside both the paid and organic groups.
 */
export function prioritizeBoostedListings<
  T extends { placementTier: PlacementTier | null },
>(listings: readonly T[]): T[] {
  return [
    ...listings.filter((listing) => listing.placementTier === "boosted"),
    ...listings.filter((listing) => listing.placementTier !== "boosted"),
  ];
}
