import { createAdminClient } from "@/lib/supabase/admin";
import type { SourceAdapter, NormalizedDeal } from "@/lib/ingestion/types";
import { partnerExampleAdapter } from "@/lib/ingestion/adapters/partner-example";
import { scrapedStubAdapter } from "@/lib/ingestion/adapters/scraped-stub";

/** Registered source adapters. Add partner feeds here. */
export const ADAPTERS: SourceAdapter[] = [partnerExampleAdapter, scrapedStubAdapter];

/**
 * Run all enabled adapters and upsert their deals. Ingested deals always carry
 * their source + attribution and go to 'pending_review' (admin moderates before
 * they go live); they are never auto-promoted to paid placement.
 */
export async function runIngestion(): Promise<{ source: string; ingested: number }[]> {
  const admin = createAdminClient();
  const results: { source: string; ingested: number }[] = [];

  for (const adapter of ADAPTERS) {
    if (!adapter.isEnabled()) continue;
    let deals: NormalizedDeal[] = [];
    try {
      deals = await adapter.fetch();
    } catch (e) {
      console.error(`[ingestion] ${adapter.id} failed: ${(e as Error).message}`);
      continue;
    }
    if (deals.length === 0) {
      results.push({ source: adapter.id, ingested: 0 });
      continue;
    }

    const rows = deals.map((d) => ({
      business_id: d.business_id,
      title: d.title,
      description: d.description ?? null,
      deal_type: d.deal_type,
      discount_value: d.discount_value ?? null,
      start_at: new Date().toISOString(),
      end_at: d.end_at,
      status: "pending_review" as const,
      source: d.source,
      source_attribution: d.source_attribution,
    }));
    const { error } = await admin.from("deals").insert(rows);
    if (error) console.error(`[ingestion] insert ${adapter.id}: ${error.message}`);
    results.push({ source: adapter.id, ingested: error ? 0 : rows.length });
  }

  return results;
}
