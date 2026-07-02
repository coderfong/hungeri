import { NearMeClient } from "@/components/near-me/near-me-client";

export const metadata = { title: "Deals near you" };

/**
 * Map / near-me. Geolocation + the Mapbox map are client-side; the radius search
 * runs server-side via the deals_near PostGIS RPC (/api/deals/near).
 */
export default function NearMePage() {
  return <NearMeClient />;
}
