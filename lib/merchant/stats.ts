import { createAdminClient } from "@/lib/supabase/admin";
import type { DealRow } from "@/types/database";

/**
 * Aggregate stats for a merchant's deals. Uses the service-role client because
 * saves (and cross-user view/redemption rows) aren't readable by the merchant
 * under RLS. Always scope to a business_id the caller has already verified they
 * own (via requireBusiness) — never pass an untrusted id here.
 */

export type DealWithStats = Pick<
  DealRow,
  "id" | "title" | "status" | "end_at" | "deal_type" | "discount_value" | "image_url"
> & { views: number; saves: number; redemptions: number };

export type BusinessStats = {
  totalViews: number;
  totalSaves: number;
  totalRedemptions: number;
  liveCount: number;
  deals: DealWithStats[];
};

async function countByDeal(
  admin: ReturnType<typeof createAdminClient>,
  table: "deal_views" | "saves" | "redemptions",
  dealIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (dealIds.length === 0) return map;
  const { data } = await admin.from(table).select("deal_id").in("deal_id", dealIds);
  for (const r of (data ?? []) as { deal_id: string }[]) {
    map.set(r.deal_id, (map.get(r.deal_id) ?? 0) + 1);
  }
  return map;
}

export async function getBusinessStats(businessId: string): Promise<BusinessStats> {
  const admin = createAdminClient();

  const { data: dealsData } = await admin
    .from("deals")
    .select("id, title, status, end_at, deal_type, discount_value, image_url")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  const deals = (dealsData ?? []) as DealWithStats[];
  const dealIds = deals.map((d) => d.id);

  const [views, saves, reds] = await Promise.all([
    countByDeal(admin, "deal_views", dealIds),
    countByDeal(admin, "saves", dealIds),
    countByDeal(admin, "redemptions", dealIds),
  ]);

  let totalViews = 0;
  let totalSaves = 0;
  let totalRedemptions = 0;
  for (const d of deals) {
    d.views = views.get(d.id) ?? 0;
    d.saves = saves.get(d.id) ?? 0;
    d.redemptions = reds.get(d.id) ?? 0;
    totalViews += d.views;
    totalSaves += d.saves;
    totalRedemptions += d.redemptions;
  }

  return {
    totalViews,
    totalSaves,
    totalRedemptions,
    liveCount: deals.filter((d) => d.status === "live").length,
    deals,
  };
}
