import type { PlacementTier } from "@/types/database";
import { DEFAULT_RANKING_CONFIG, type RankingConfig } from "@/lib/ranking/config";

/**
 * Hungeri feed ranking — the single, documented, testable place where deal order
 * is decided. Pure functions, no I/O, fully config-driven (see ranking.weights.json).
 *
 * Score = Σ (weight_i × subScore_i), each subScore normalised to 0..1:
 *   • paid       — active placement tier (spotlight > featured > boosted), applied
 *                  only inside the placement's geo radius (or everywhere when the
 *                  viewer has no location, e.g. the home feed).
 *   • distance   — closer is better (only when the viewer's distance is known).
 *   • recency    — newer deals decay by a half-life.
 *   • expiry     — a mild "ending soon" urgency boost (never for expired deals).
 *   • engagement — saves (weighted) + views, saturating.
 *
 * Paid is the heaviest single lever but never the only one, and the UI always
 * labels paid items "Featured · Ad" — ranking and disclosure are kept separate.
 */

export type GeoScope = { lat: number; lng: number; radiusM: number } | null;

export type RankInput = {
  id: string;
  createdAt: string; // ISO
  endAt: string; // ISO
  placement?: { tier: PlacementTier; geoScope?: GeoScope } | null;
  /** Distance from the viewer to the nearest outlet, metres (null if unknown). */
  distanceM?: number | null;
  engagement?: { saves?: number; views?: number };
};

export type RankContext = {
  now?: number;
  viewer?: { lat: number; lng: number } | null;
};

export type ScoreBreakdown = {
  paid: number;
  distance: number;
  recency: number;
  expiry: number;
  engagement: number;
};

export type Ranked<T> = T & { score: number; breakdown: ScoreBreakdown; paidApplied: boolean };

const HOUR = 3_600_000;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Great-circle distance in metres between two lat/lng points. */
export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Whether a paid placement applies for this viewer (inside its geo radius). */
function placementApplies(
  placement: NonNullable<RankInput["placement"]>,
  viewer: RankContext["viewer"],
): boolean {
  const scope = placement.geoScope;
  if (!scope) return true; // no geo restriction → applies everywhere
  if (!viewer) return true; // viewer location unknown (home feed) → show it
  return haversineMeters(viewer, scope) <= scope.radiusM;
}

function paidScore(input: RankInput, ctx: RankContext, cfg: RankingConfig): number {
  if (!input.placement) return 0;
  if (!placementApplies(input.placement, ctx.viewer)) return 0;
  return cfg.tierScore[input.placement.tier] ?? 0;
}

function distanceScore(input: RankInput, cfg: RankingConfig): number {
  if (input.distanceM == null) return 0; // no signal
  const { fullScoreMeters, zeroScoreMeters } = cfg.distance;
  if (input.distanceM <= fullScoreMeters) return 1;
  if (input.distanceM >= zeroScoreMeters) return 0;
  return 1 - (input.distanceM - fullScoreMeters) / (zeroScoreMeters - fullScoreMeters);
}

function recencyScore(input: RankInput, now: number, cfg: RankingConfig): number {
  const ageHours = Math.max(0, (now - new Date(input.createdAt).getTime()) / HOUR);
  return clamp01(0.5 ** (ageHours / cfg.recencyHalfLifeHours));
}

function expiryScore(input: RankInput, now: number, cfg: RankingConfig): number {
  const hoursLeft = (new Date(input.endAt).getTime() - now) / HOUR;
  if (hoursLeft <= 0) return 0; // expired — no urgency boost
  if (hoursLeft >= cfg.expirySoonHours) return 0; // not "soon" yet
  return clamp01((cfg.expirySoonHours - hoursLeft) / cfg.expirySoonHours);
}

function engagementScore(input: RankInput, cfg: RankingConfig): number {
  const saves = input.engagement?.saves ?? 0;
  const views = input.engagement?.views ?? 0;
  return clamp01((saves * 5 + views) / cfg.engagementSaturation);
}

/** Score a single deal. Exposed for testing and explainability. */
export function scoreDeal(
  input: RankInput,
  ctx: RankContext = {},
  cfg: RankingConfig = DEFAULT_RANKING_CONFIG,
): { score: number; breakdown: ScoreBreakdown; paidApplied: boolean } {
  const now = ctx.now ?? Date.now();
  const breakdown: ScoreBreakdown = {
    paid: paidScore(input, ctx, cfg),
    distance: distanceScore(input, cfg),
    recency: recencyScore(input, now, cfg),
    expiry: expiryScore(input, now, cfg),
    engagement: engagementScore(input, cfg),
  };
  const w = cfg.weights;
  const score =
    w.paid * breakdown.paid +
    w.distance * breakdown.distance +
    w.recency * breakdown.recency +
    w.expiry * breakdown.expiry +
    w.engagement * breakdown.engagement;
  return { score, breakdown, paidApplied: breakdown.paid > 0 };
}

/** Rank deals highest-score first. Stable: ties keep input order. */
export function rankDeals<T extends RankInput>(
  inputs: T[],
  ctx: RankContext = {},
  cfg: RankingConfig = DEFAULT_RANKING_CONFIG,
): Ranked<T>[] {
  return inputs
    .map((input, i) => ({ ...input, ...scoreDeal(input, ctx, cfg), _i: i }))
    .sort((a, b) => b.score - a.score || a._i - b._i)
    .map(({ _i, ...rest }) => rest as Ranked<T>);
}
