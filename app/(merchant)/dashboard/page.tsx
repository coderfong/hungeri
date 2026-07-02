import Link from "next/link";
import { Eye, Heart, TicketCheck, Percent, Plus, Zap } from "lucide-react";
import { requireBusiness } from "@/lib/merchant/context";
import { getBusinessStats } from "@/lib/merchant/stats";
import { StatCard, DealStatusBadge } from "@/components/merchant/stat-card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { business } = await requireBusiness();
  const stats = await getBusinessStats(business.id);

  const liveDeals = stats.deals.filter((d) => d.status === "live");
  const endingToday = liveDeals.filter(
    (d) => new Date(d.end_at).getTime() - Date.now() < 86_400_000,
  ).length;
  const convRate = stats.totalSaves
    ? Math.round((stats.totalRedemptions / stats.totalSaves) * 100)
    : 0;

  return (
    <div className="px-5 py-6 md:px-8">
      <div className="mb-6 flex flex-wrap items-start gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Good day, {business.name}</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            {stats.liveCount} live deal{stats.liveCount === 1 ? "" : "s"}
            {endingToday > 0 && ` · ${endingToday} ending today`}
            {!business.verified && " · verification pending"}
          </p>
        </div>
        <Link href="/dashboard/deals/new" className="ml-auto">
          <Button>
            <Plus className="size-[18px]" aria-hidden /> Create deal
          </Button>
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Eye} label="Views" value={stats.totalViews.toLocaleString()} />
        <StatCard icon={Heart} label="Saves" value={stats.totalSaves.toLocaleString()} />
        <StatCard icon={TicketCheck} label="Redemptions" value={stats.totalRedemptions.toLocaleString()} />
        <StatCard icon={Percent} label="Save→Redeem" value={`${convRate}%`} sub="Saves that redeemed" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">Live deals</h2>
          {liveDeals.length === 0 ? (
            <div className="rounded-card border border-dashed border-line bg-surface px-4 py-10 text-center">
              <p className="text-sm text-ink-500">No live deals yet.</p>
              <Link href="/dashboard/deals/new" className="mt-3 inline-block">
                <Button size="sm">Create your first deal</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-card border border-line-soft bg-surface">
              {liveDeals.map((d) => (
                <Link
                  key={d.id}
                  href={`/dashboard/deals/${d.id}/edit`}
                  className="flex items-center gap-3.5 border-b border-line-soft px-4 py-3.5 last:border-0 hover:bg-bg"
                >
                  <span className="flex-1">
                    <span className="block text-sm font-bold">{d.title}</span>
                    <span className="text-xs text-muted">
                      ends {new Date(d.end_at).toLocaleDateString("en-SG")}
                    </span>
                  </span>
                  <span className="text-right text-xs">
                    <span className="block font-bold">{d.views.toLocaleString()} views</span>
                    <span className="text-muted">{d.redemptions} redeemed</span>
                  </span>
                  <DealStatusBadge status={d.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-card bg-gradient-to-br from-persimmon-500 to-urgent p-6 text-white">
          <Zap className="size-7" fill="currentColor" aria-hidden />
          <h3 className="mb-1.5 mt-3 font-display text-[22px] font-extrabold leading-tight">
            Reach 3× more diners
          </h3>
          <p className="mb-4 text-sm leading-relaxed opacity-95">
            Boost a deal to the top of the feed in your area. Placements arrive in the next
            update.
          </p>
          <Link href="/dashboard/placements">
            <Button variant="secondary" className="w-full bg-white text-persimmon-500 hover:bg-white/90">
              Explore placements
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
