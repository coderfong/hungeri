import type { DealType, DealSource } from "@/types/database";

/**
 * Ingestion source-adapter interface. Primary supply is merchant-submitted +
 * admin-curated; this lets partner feeds (and, if ever enabled, a clearly
 * labelled scraping fallback) be added without touching the rest of the app.
 *
 * Rules every non-first-party source MUST follow:
 *   • set `source` + `source_attribution` (original URL + publisher + fetched_at)
 *   • be excluded from paid placement (only merchant-owned deals can be promoted)
 *   • be takeable down via /api/ingestion/takedown
 */
export type NormalizedDeal = {
  /** The existing Hungeri business this deal belongs to. */
  business_id: string;
  title: string;
  description?: string;
  deal_type: DealType;
  discount_value?: number;
  end_at: string; // ISO
  source: DealSource; // 'partner_api' | 'scraped' | 'curated'
  source_attribution: { url?: string; publisher?: string; fetched_at: string };
};

export interface SourceAdapter {
  /** Stable identifier, e.g. "partner:chope". */
  id: string;
  source: DealSource;
  /** Whether this adapter is allowed to run (e.g. gated by a feature flag). */
  isEnabled(): boolean;
  /** Pull + normalise deals. Must be polite and respect the source's terms. */
  fetch(): Promise<NormalizedDeal[]>;
}
