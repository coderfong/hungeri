"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DealFilters } from "@/lib/deals/query";
import { toQueryString } from "@/lib/deals/filters";
import {
  CUISINES,
  DEAL_TYPES,
  CHANNELS,
  DIETARY,
  PRICE_LEVELS,
} from "@/lib/deals/facets";
import { Button } from "@/components/ui/button";

/** A selectable pill toggling membership of a string array. */
function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-pill px-3.5 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-persimmon-100",
        active
          ? "bg-persimmon-500 font-bold text-white"
          : "border-[1.5px] border-line bg-surface text-ink-700 hover:border-ink-300",
      )}
    >
      {children}
    </button>
  );
}

function toggle<T>(arr: T[] | undefined, v: T): T[] {
  const set = new Set(arr ?? []);
  set.has(v) ? set.delete(v) : set.add(v);
  return [...set];
}

/**
 * The full filter control set. Manages a local draft, applies by pushing the URL
 * query string (the page re-renders server-side with the new filters). Used by
 * both the mobile sheet and desktop rail. Distance lands with the map in M3.
 */
export function FilterControls({
  basePath,
  initial,
  onApplied,
}: {
  basePath: string;
  initial: DealFilters;
  onApplied?: () => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<DealFilters>(initial);

  function apply() {
    router.push(`${basePath}${toQueryString({ ...draft, q: initial.q })}`);
    onApplied?.();
  }
  function reset() {
    setDraft({ q: initial.q });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <section>
          <h3 className="mb-2.5 text-sm font-extrabold">Cuisine</h3>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => (
              <Pill
                key={c}
                active={!!draft.cuisine?.includes(c)}
                onClick={() => setDraft((d) => ({ ...d, cuisine: toggle(d.cuisine, c) }))}
              >
                {c}
              </Pill>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2.5 text-sm font-extrabold">Deal type</h3>
          <div className="flex flex-wrap gap-2">
            {DEAL_TYPES.map((t) => (
              <Pill
                key={t.value}
                active={!!draft.dealType?.includes(t.value)}
                onClick={() => setDraft((d) => ({ ...d, dealType: toggle(d.dealType, t.value) }))}
              >
                {t.label}
              </Pill>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2.5 text-sm font-extrabold">Price level</h3>
          <div className="flex gap-2">
            {PRICE_LEVELS.map((lvl) => {
              const active = !!draft.priceLevel?.includes(lvl);
              return (
                <button
                  key={lvl}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setDraft((d) => ({ ...d, priceLevel: toggle(d.priceLevel, lvl) }))}
                  className={cn(
                    "flex-1 rounded-[11px] py-2.5 text-center text-sm font-extrabold transition-colors",
                    active
                      ? "bg-ink-900 text-white"
                      : "border-[1.5px] border-line bg-surface text-muted hover:border-ink-300",
                  )}
                >
                  {"$".repeat(lvl)}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-2.5 text-sm font-extrabold">Channel</h3>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <Pill
                key={c.value}
                active={!!draft.channel?.includes(c.value)}
                onClick={() => setDraft((d) => ({ ...d, channel: toggle(d.channel, c.value) }))}
              >
                {c.label}
              </Pill>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2.5 text-sm font-extrabold">Dietary</h3>
          <div className="flex flex-wrap gap-2">
            {DIETARY.map((d0) => (
              <Pill
                key={d0}
                active={!!draft.dietary?.includes(d0)}
                onClick={() => setDraft((d) => ({ ...d, dietary: toggle(d.dietary, d0) }))}
              >
                {d0}
              </Pill>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2.5 text-sm font-extrabold">Timing</h3>
          <div className="flex flex-wrap gap-2">
            <Pill
              active={!!draft.endingSoon}
              onClick={() => setDraft((d) => ({ ...d, endingSoon: !d.endingSoon }))}
            >
              Ending soon
            </Pill>
            <Pill
              active={!!draft.newToday}
              onClick={() => setDraft((d) => ({ ...d, newToday: !d.newToday }))}
            >
              New today
            </Pill>
          </div>
        </section>
      </div>

      <div className="flex items-center gap-3 border-t border-line-soft bg-surface px-5 py-4">
        <button
          type="button"
          onClick={reset}
          className="text-sm font-bold text-ink-500 hover:text-ink-900"
        >
          Reset
        </button>
        <Button size="md" className="flex-1" onClick={apply}>
          Show deals
        </Button>
      </div>
    </div>
  );
}
