import Link from "next/link";
import { ShieldAlert, Flag, Tag, Store, ArrowRight } from "lucide-react";
import { getAdminCounts } from "@/lib/admin/stats";
import { StatCard } from "@/components/merchant/stat-card";
import { TIER_ORDER, TIERS } from "@/lib/placements/tiers";
import { formatMoney } from "@/lib/i18n/config";

export const metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const counts = await getAdminCounts();

  return (
    <div className="px-5 py-6 md:px-8">
      <h1 className="mb-6 font-display text-2xl font-extrabold">Ops overview</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ShieldAlert} label="Pending review" value={counts.pending} />
        <StatCard icon={Flag} label="Open reports" value={counts.reports} />
        <StatCard icon={Tag} label="Live deals" value={counts.liveDeals} />
        <StatCard icon={Store} label="Live businesses" value={counts.liveBiz} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-card border border-line-soft bg-surface p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Jump in</h2>
          <div className="space-y-2">
            <QuickLink href="/admin/moderation" label={`Review ${counts.pending} pending deal${counts.pending === 1 ? "" : "s"}`} />
            <QuickLink href="/admin/reports" label={`Resolve ${counts.reports} open report${counts.reports === 1 ? "" : "s"}`} />
            <QuickLink href="/admin/businesses" label="Verify & manage businesses" />
            <QuickLink href="/admin/curate" label="Add a curated deal" />
          </div>
        </section>

        <section className="rounded-card border border-line-soft bg-surface p-5">
          <h2 className="mb-1 font-display text-lg font-bold">Featured-slot pricing</h2>
          <p className="mb-3 text-xs text-muted">
            Config-driven (config/ranking + lib/placements/tiers). Editing without a redeploy
            comes with DB-backed config later.
          </p>
          <div className="divide-y divide-line-soft">
            {TIER_ORDER.map((t) => {
              const s = TIERS[t];
              return (
                <div key={t} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-bold">{s.name}</span>
                  <span className="text-muted">
                    {s.radiusM / 1000} km · {s.durationHours}h
                  </span>
                  <span className="font-display font-extrabold">{formatMoney(s.priceCents)}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-btn border border-line-soft bg-bg px-4 py-3 text-sm font-semibold hover:border-ink-300"
    >
      {label}
      <ArrowRight className="ml-auto size-4 text-muted" aria-hidden />
    </Link>
  );
}
