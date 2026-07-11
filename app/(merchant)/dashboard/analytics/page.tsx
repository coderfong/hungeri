import { Eye, Heart, TicketCheck } from "lucide-react";
import { requireBusiness } from "@/lib/merchant/context";
import { getBusinessStats } from "@/lib/merchant/stats";
import { StatCard, DealStatusBadge } from "@/components/merchant/stat-card";

export const metadata = { title: "Analytics" };

/**
 * Basic per-deal analytics (real counts). Time-series charts + placement
 * attribution land in M6; this gives merchants the core numbers now.
 */
export default async function AnalyticsPage() {
  const { business } = await requireBusiness();
  const stats = await getBusinessStats(business.id);

  return (
    <div className="px-5 py-6 md:px-8">
      <h1 className="font-display text-2xl font-extrabold">Analytics</h1>
      <p className="mt-1 text-sm text-ink-500">{business.name} · all-time</p>

      <div className="my-6 grid grid-cols-3 gap-4">
        <StatCard icon={Eye} label="Views" value={stats.totalViews.toLocaleString()} tone="brand" />
        <StatCard icon={Heart} label="Saves" value={stats.totalSaves.toLocaleString()} tone="urgent" />
        <StatCard icon={TicketCheck} label="Redemptions" value={stats.totalRedemptions.toLocaleString()} tone="savings" />
      </div>

      <h2 className="mb-3 font-display text-lg font-bold">Per-deal performance</h2>
      {stats.deals.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-surface px-4 py-10 text-center text-sm text-ink-500">
          No deals yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-card border border-line-soft bg-surface">
          <div className="hidden grid-cols-[1fr_repeat(3,80px)_90px] gap-3 border-b border-line-soft px-4 py-2.5 text-xs font-bold text-muted sm:grid">
            <span>Deal</span>
            <span className="text-right">Views</span>
            <span className="text-right">Saves</span>
            <span className="text-right">Redeems</span>
            <span className="text-right">Status</span>
          </div>
          {stats.deals.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-2 gap-2 border-b border-line-soft px-4 py-3 last:border-0 sm:grid-cols-[1fr_repeat(3,80px)_90px] sm:items-center sm:gap-3"
            >
              <span className="col-span-2 truncate text-sm font-bold sm:col-span-1">{d.title}</span>
              <span className="text-sm sm:text-right">
                <span className="text-muted sm:hidden">Views </span>
                {d.views.toLocaleString()}
              </span>
              <span className="text-sm sm:text-right">
                <span className="text-muted sm:hidden">Saves </span>
                {d.saves.toLocaleString()}
              </span>
              <span className="text-sm sm:text-right">
                <span className="text-muted sm:hidden">Redeems </span>
                {d.redemptions.toLocaleString()}
              </span>
              <span className="sm:text-right">
                <DealStatusBadge status={d.status} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
