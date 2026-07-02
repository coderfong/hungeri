import type { SourceAdapter, NormalizedDeal } from "@/lib/ingestion/types";
import { flags } from "@/lib/flags";

/**
 * Scraping fallback — DOCUMENTED INTERFACE ONLY, intentionally not implemented.
 *
 * This is OFF by default (FEATURE_SCRAPING_ENABLED=false) and deliberately ships
 * as a no-op. If a scraping source is ever added it MUST:
 *   • only fetch from sources whose terms permit it (no aggressive crawling)
 *   • store source='scraped' + source_attribution (original URL, publisher, time)
 *   • be clearly labelled to users as third-party sourced
 *   • be excluded from any paid placement
 *   • be removable via /api/ingestion/takedown
 *
 * We do NOT build aggressive scrapers. This stub exists so the capability has a
 * single, governed entry point rather than ad-hoc scripts.
 */
export const scrapedStubAdapter: SourceAdapter = {
  id: "scraped:stub",
  source: "scraped",
  isEnabled() {
    return flags.scrapingEnabled; // default false
  },
  async fetch(): Promise<NormalizedDeal[]> {
    if (!flags.scrapingEnabled) return [];
    // Intentionally unimplemented — see the contract above before enabling.
    return [];
  },
};
