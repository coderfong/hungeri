import type { SourceAdapter, NormalizedDeal } from "@/lib/ingestion/types";

/**
 * Example partner-API adapter (stub). A real one would call the partner's API,
 * map their reservation/deal records to NormalizedDeal, and resolve each to an
 * existing Hungeri business_id (e.g. by matching outlet name/postal code).
 *
 * Returns [] until wired to a real endpoint + credentials — included as the
 * reference implementation for the SourceAdapter contract.
 */
export const partnerExampleAdapter: SourceAdapter = {
  id: "partner:example",
  source: "partner_api",
  isEnabled() {
    // Enable once an API base URL + key are configured for this partner.
    return false;
  },
  async fetch(): Promise<NormalizedDeal[]> {
    // const res = await fetch(`${PARTNER_BASE}/deals`, { headers: { Authorization: ... } });
    // const raw = await res.json();
    // return raw.map(toNormalizedDeal); // map + resolve business_id
    return [];
  },
};
