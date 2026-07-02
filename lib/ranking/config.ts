import weights from "@/config/ranking.weights.json";

/**
 * Ranking configuration. Loaded from config/ranking.weights.json so weights can
 * be tuned without touching code. (To tune without a redeploy, this loader can
 * later read from a DB table or remote config behind the same RankingConfig type.)
 */
export type RankingConfig = {
  weights: {
    paid: number;
    distance: number;
    recency: number;
    expiry: number;
    engagement: number;
  };
  tierScore: { spotlight: number; featured: number; boosted: number };
  distance: { fullScoreMeters: number; zeroScoreMeters: number };
  recencyHalfLifeHours: number;
  expirySoonHours: number;
  engagementSaturation: number;
};

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  weights: weights.weights,
  tierScore: weights.tierScore,
  distance: weights.distance,
  recencyHalfLifeHours: weights.recencyHalfLifeHours,
  expirySoonHours: weights.expirySoonHours,
  engagementSaturation: weights.engagementSaturation,
};
