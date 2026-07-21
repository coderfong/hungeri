import { describe, expect, it } from "vitest";
import {
  higherPlacementTier,
  isCarouselPlacement,
  prioritizeBoostedListings,
} from "@/lib/placements/tiers";

describe("placement presentation", () => {
  it("keeps the strongest tier when overlapping active rows exist", () => {
    expect(higherPlacementTier("boosted", "featured")).toBe("featured");
    expect(higherPlacementTier("featured", "boosted")).toBe("featured");
    expect(higherPlacementTier("featured", "spotlight")).toBe("spotlight");
  });

  it("puts featured tiers in the carousel but keeps boosted deals in the grid", () => {
    expect(isCarouselPlacement("featured")).toBe(true);
    expect(isCarouselPlacement("spotlight")).toBe(true);
    expect(isCarouselPlacement("boosted")).toBe(false);
    expect(isCarouselPlacement(null)).toBe(false);
  });

  it("places every boosted listing at the top of the grid without disturbing group order", () => {
    const listings = [
      { id: "organic-a", placementTier: null },
      { id: "boosted-a", placementTier: "boosted" as const },
      { id: "featured", placementTier: "featured" as const },
      { id: "boosted-b", placementTier: "boosted" as const },
      { id: "organic-b", placementTier: null },
    ];

    expect(prioritizeBoostedListings(listings).map((listing) => listing.id)).toEqual([
      "boosted-a",
      "boosted-b",
      "organic-a",
      "featured",
      "organic-b",
    ]);
  });
});
