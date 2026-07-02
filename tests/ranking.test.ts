import { describe, it, expect } from "vitest";
import { rankDeals, scoreDeal, haversineMeters, type RankInput } from "@/lib/ranking";

const NOW = Date.parse("2026-06-29T12:00:00Z");
const ctx = { now: NOW };

function deal(over: Partial<RankInput> & { id: string }): RankInput {
  return {
    createdAt: new Date(NOW - 3 * 86_400_000).toISOString(), // 3 days old
    endAt: new Date(NOW + 7 * 86_400_000).toISOString(), // ends in 7 days
    ...over,
  };
}

describe("ranking module", () => {
  it("ranks a paid placement above an otherwise-identical organic deal", () => {
    const organic = deal({ id: "organic" });
    const featured = deal({ id: "featured", placement: { tier: "featured" } });
    const [first] = rankDeals([organic, featured], ctx);
    expect(first.id).toBe("featured");
    expect(first.paidApplied).toBe(true);
  });

  it("orders paid tiers spotlight > featured > boosted", () => {
    const ranked = rankDeals(
      [
        deal({ id: "boosted", placement: { tier: "boosted" } }),
        deal({ id: "spotlight", placement: { tier: "spotlight" } }),
        deal({ id: "featured", placement: { tier: "featured" } }),
      ],
      ctx,
    );
    expect(ranked.map((r) => r.id)).toEqual(["spotlight", "featured", "boosted"]);
  });

  it("does NOT apply a placement boost outside its geo radius", () => {
    const viewer = { lat: 1.3521, lng: 103.8198 }; // far from the placement centre
    const farPaid = deal({
      id: "farPaid",
      placement: { tier: "spotlight", geoScope: { lat: 1.29, lng: 103.85, radiusM: 500 } },
    });
    const near = deal({ id: "near", distanceM: 100 });
    const ranked = rankDeals([farPaid, near], { now: NOW, viewer });
    const paid = ranked.find((r) => r.id === "farPaid")!;
    expect(paid.paidApplied).toBe(false); // viewer is outside the 500m radius
    expect(ranked[0].id).toBe("near"); // nearby organic wins
  });

  it("applies a placement boost when the viewer is inside the radius", () => {
    const centre = { lat: 1.3, lng: 103.85 };
    const ranked = rankDeals(
      [deal({ id: "p", placement: { tier: "boosted", geoScope: { ...centre, radiusM: 1000 } } })],
      { now: NOW, viewer: { lat: 1.3005, lng: 103.85 } }, // ~55m away
    );
    expect(ranked[0].paidApplied).toBe(true);
  });

  it("scores a closer deal higher than a far one (distance signal)", () => {
    const close = scoreDeal(deal({ id: "c", distanceM: 200 }), ctx).breakdown.distance;
    const far = scoreDeal(deal({ id: "f", distanceM: 6000 }), ctx).breakdown.distance;
    expect(close).toBeGreaterThan(far);
    expect(close).toBe(1); // within fullScoreMeters
  });

  it("gives an expiring-soon deal an urgency boost, but never an expired one", () => {
    const soon = scoreDeal(
      deal({ id: "soon", endAt: new Date(NOW + 2 * 3_600_000).toISOString() }),
      ctx,
    ).breakdown.expiry;
    const later = scoreDeal(deal({ id: "later" }), ctx).breakdown.expiry; // 7 days out
    const expired = scoreDeal(
      deal({ id: "expired", endAt: new Date(NOW - 3_600_000).toISOString() }),
      ctx,
    ).breakdown.expiry;
    expect(soon).toBeGreaterThan(later);
    expect(expired).toBe(0);
  });

  it("ranking is stable for tied scores (keeps input order)", () => {
    const a = deal({ id: "a" });
    const b = deal({ id: "b" });
    expect(rankDeals([a, b], ctx).map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("haversine roughly matches a known short distance", () => {
    const d = haversineMeters({ lat: 1.3, lng: 103.85 }, { lat: 1.3005, lng: 103.85 });
    expect(d).toBeGreaterThan(40);
    expect(d).toBeLessThan(80);
  });
});
