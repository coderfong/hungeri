import { createAdminClient } from "@/lib/supabase/admin";
import { requireBusiness } from "@/lib/merchant/context";
import {
  PlacementsManager,
  type ActivePlacement,
  type PromotableDeal,
} from "@/components/merchant/placements-manager";
import type { PlacementTier } from "@/types/database";

export const metadata = { title: "Placements" };

export default async function PlacementsPage() {
  const { business, db: supabase } = await requireBusiness();

  // Live deals the merchant can promote.
  const { data: deals } = await supabase
    .from("deals")
    .select("id, title")
    .eq("business_id", business.id)
    .eq("status", "live")
    .order("created_at", { ascending: false });
  const promotable: PromotableDeal[] = (deals ?? []) as PromotableDeal[];

  // Active placements for this business's deals (admin client — RLS on
  // featured_placements is locked down; we scope to verified-owned deals).
  const dealIds = promotable.map((d) => d.id);
  const titleById = new Map(promotable.map((d) => [d.id, d.title]));
  let active: ActivePlacement[] = [];
  if (dealIds.length) {
    const { data: pl } = await createAdminClient()
      .from("featured_placements")
      .select("id, tier, deal_id, end_at, price_cents, geo_scope, status")
      .in("deal_id", dealIds)
      .eq("status", "active")
      .order("end_at", { ascending: true });
    active = (pl ?? []).map((p) => {
      const scope = p.geo_scope as { radius_m?: number } | null;
      return {
        id: p.id as string,
        tier: p.tier as PlacementTier,
        dealTitle: titleById.get(p.deal_id as string) ?? "Deal",
        end_at: p.end_at as string,
        price_cents: p.price_cents as number,
        radiusM: scope?.radius_m ?? null,
      };
    });
  }

  return (
    <div className="px-5 py-6 md:px-8">
      <h1 className="font-display text-2xl font-extrabold">Get seen by more diners</h1>
      <p className="mt-1 text-sm text-ink-500">
        Promote a deal. Every placement is clearly labelled “Featured · Ad” to diners.
      </p>
      <div className="mt-6">
        <PlacementsManager deals={promotable} active={active} />
      </div>
    </div>
  );
}
