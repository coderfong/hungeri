import { describe, it, expect } from "vitest";
import { shouldExpire, isEndingSoon, isExpired } from "@/lib/deals/format";

const NOW = Date.parse("2026-06-29T12:00:00Z");
const inHours = (h: number) => new Date(NOW + h * 3_600_000).toISOString();

describe("deal-expiry job logic (public.expire_deals mirror)", () => {
  it("flips a live deal whose window has passed", () => {
    expect(shouldExpire({ status: "live", end_at: inHours(-1) }, NOW)).toBe(true);
    expect(shouldExpire({ status: "live", end_at: inHours(-0.001) }, NOW)).toBe(true);
  });

  it("leaves a live deal still in its window", () => {
    expect(shouldExpire({ status: "live", end_at: inHours(5) }, NOW)).toBe(false);
  });

  it("ignores deals that aren't live", () => {
    expect(shouldExpire({ status: "draft", end_at: inHours(-5) }, NOW)).toBe(false);
    expect(shouldExpire({ status: "expired", end_at: inHours(-5) }, NOW)).toBe(false);
    expect(shouldExpire({ status: "pending_review", end_at: inHours(-5) }, NOW)).toBe(false);
  });

  it("isExpired / isEndingSoon thresholds", () => {
    // These helpers read the real clock, so build offsets from Date.now().
    const rel = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
    expect(isExpired(rel(-1))).toBe(true);
    expect(isExpired(rel(1))).toBe(false);
    expect(isEndingSoon(rel(2))).toBe(true); // within 24h
    expect(isEndingSoon(rel(48))).toBe(false); // beyond 24h
    expect(isEndingSoon(rel(-2))).toBe(false); // already past
  });
});
