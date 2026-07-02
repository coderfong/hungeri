import { getServerEnv } from "@/lib/env";

/**
 * Feature flags. Server-evaluated so they can never be toggled from the client.
 *
 * Scraping ingestion is intentionally OFF by default. Even when enabled, scraped
 * deals must store source attribution + original URL, be clearly labelled, and be
 * excluded from any paid placement (see lib/ingestion + ranking module).
 */
export const flags = {
  get scrapingEnabled() {
    return getServerEnv().FEATURE_SCRAPING_ENABLED;
  },
};
