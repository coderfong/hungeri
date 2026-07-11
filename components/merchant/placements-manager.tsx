"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap, Star, Sparkles, Check, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlacementTier } from "@/types/database";
import { TIERS, TIER_ORDER } from "@/lib/placements/tiers";
import { formatMoney, formatDateTime } from "@/lib/i18n/config";
import { formatDistance } from "@/lib/geo/format";
import { createPlacement, endPlacement } from "@/lib/merchant/actions";
import { Button } from "@/components/ui/button";

const TIER_ICON = { boosted: Zap, featured: Star, spotlight: Sparkles } as const;

export type PromotableDeal = { id: string; title: string };
export type ActivePlacement = {
  id: string;
  tier: PlacementTier;
  dealTitle: string;
  end_at: string;
  price_cents: number;
  radiusM: number | null;
};

export function PlacementsManager({
  deals,
  active,
}: {
  deals: PromotableDeal[];
  active: ActivePlacement[];
}) {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<PlacementTier | null>(null);
  const [dealId, setDealId] = useState(deals[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function activate() {
    if (!selectedTier || !dealId) return;
    setError(null);
    start(async () => {
      const res = await createPlacement(dealId, selectedTier);
      if (!res.ok) setError(res.error);
      else {
        setSelectedTier(null);
        router.refresh();
      }
    });
  }

  function end(id: string) {
    start(async () => {
      await endPlacement(id);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <div className="grid gap-4 sm:grid-cols-2">
          {TIER_ORDER.map((t) => {
            const spec = TIERS[t];
            const Icon = TIER_ICON[t];
            const selected = selectedTier === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTier(t)}
                className={cn(
                  "relative rounded-card bg-surface p-5 text-left transition-shadow",
                  selected
                    ? "border-2 border-persimmon-500 shadow-e3"
                    : spec.recommended
                      ? "border-2 border-persimmon-200"
                      : "border border-line",
                )}
              >
                {spec.recommended && (
                  <span className="absolute -top-2.5 left-5 rounded-md bg-persimmon-500 px-2.5 py-1 text-[11px] font-extrabold text-white">
                    RECOMMENDED
                  </span>
                )}
                <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-persimmon-50">
                  <Icon className="size-5 text-persimmon-500" aria-hidden />
                </span>
                <div className="font-display text-lg font-extrabold">{spec.name}</div>
                <p className="mb-3 mt-1 text-sm leading-snug text-ink-500">{spec.blurb}</p>
                <div className="font-display text-2xl font-extrabold">
                  {formatMoney(spec.priceCents)}
                  <span className="text-sm font-semibold text-muted">
                    /{spec.durationHours >= 168 ? "week" : `${spec.durationHours}h`}
                  </span>
                </div>
                <ul className="mt-3 space-y-2 border-t border-line-soft pt-3 text-sm">
                  <li className="flex items-center gap-2 text-ink-700">
                    <Check className="size-4 text-savings" aria-hidden /> Feed priority
                  </li>
                  <li className="flex items-center gap-2 text-ink-700">
                    <MapPin className="size-4 text-muted" aria-hidden /> {formatDistance(spec.radiusM)} radius
                  </li>
                  <li className="flex items-center gap-2 text-ink-700">
                    <Clock className="size-4 text-muted" aria-hidden /> {spec.durationHours} hours
                  </li>
                </ul>
              </button>
            );
          })}
        </div>

        <h2 className="mb-3 mt-7 font-display text-lg font-bold">Active placements</h2>
        {active.length === 0 ? (
          <p className="rounded-card border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-ink-500">
            No active placements yet.
          </p>
        ) : (
          <div className="space-y-3">
            {active.map((p) => {
              const Icon = TIER_ICON[p.tier];
              return (
                <div key={p.id} className="flex items-center gap-3.5 rounded-card border border-line-soft bg-surface p-4">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-ad-bg">
                    <Icon className="size-5 text-ad-text" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">
                      {p.dealTitle} · {TIERS[p.tier].name}
                    </div>
                    <div className="text-xs text-muted">
                      {p.radiusM ? `${formatDistance(p.radiusM)} · ` : ""}ends {formatDateTime(p.end_at, { dateStyle: "medium" })}
                    </div>
                  </div>
                  <span className="rounded-[8px] bg-savings-bg px-2.5 py-1 text-xs font-extrabold text-savings">Active</span>
                  <button
                    onClick={() => end(p.id)}
                    disabled={pending}
                    className="text-xs font-bold text-ink-500 hover:text-error"
                  >
                    End
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout (no charge — Stripe deferred) */}
      <div className="self-start rounded-card bg-ink-900 p-6 text-white">
        <h3 className="mb-4 font-display text-lg font-bold">Activate placement</h3>
        {deals.length === 0 ? (
          <p className="text-sm text-ink-300">Create a live deal first, then promote it here.</p>
        ) : (
          <>
            <label className="mb-1.5 block text-xs font-bold text-ink-300">Deal</label>
            <select
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
              className="mb-4 w-full rounded-btn border border-[#33271F] bg-[#33271F] px-3 py-2.5 text-sm text-white outline-none"
            >
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>

            <div className="mb-4 flex items-center justify-between border-y border-[#33271F] py-3 text-sm">
              <span className="text-ink-300">{selectedTier ? TIERS[selectedTier].name : "Select a tier"}</span>
              <span className="font-bold">
                {selectedTier ? formatMoney(TIERS[selectedTier].priceCents) : "—"}
              </span>
            </div>

            {error && <p className="mb-3 text-sm font-semibold text-persimmon-300">{error}</p>}

            <Button className="w-full" disabled={!selectedTier || pending} onClick={activate}>
              {pending ? "Activating…" : "Activate (no charge yet)"}
            </Button>
            <p className="mt-3 text-center text-xs text-ink-300">
              Payments are off in this build — placements activate immediately.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
