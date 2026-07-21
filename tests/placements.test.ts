import { describe, expect, it } from "vitest";
import { higherPlacementTier, isCarouselPlacement } from "@/lib/placements/tiers";

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
});
