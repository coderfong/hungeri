"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DealFilters } from "@/lib/deals/query";
import { countActive } from "@/lib/deals/filters";
import { FilterControls } from "@/components/filters/filter-controls";

/**
 * Filter trigger + bottom-sheet (mobile) / centred panel (desktop). The button
 * shows the active-filter count; the panel hosts the shared FilterControls.
 */
export function FilterSheet({
  basePath,
  filters,
  variant = "icon",
}: {
  basePath: string;
  filters: DealFilters;
  variant?: "icon" | "button";
}) {
  const [open, setOpen] = useState(false);
  const active = countActive(filters);

  // Lock scroll + close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Filters${active ? `, ${active} active` : ""}`}
          className="relative flex size-12 items-center justify-center rounded-btn bg-ink-900 text-white"
        >
          <SlidersHorizontal className="size-[19px]" aria-hidden />
          {active > 0 && (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-persimmon-500 text-[10px] font-extrabold">
              {active}
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-btn border-[1.5px] border-line bg-surface px-4 py-2.5 text-sm font-bold hover:border-ink-300"
        >
          <SlidersHorizontal className="size-[18px]" aria-hidden />
          Filters
          {active > 0 && (
            <span className="rounded-full bg-persimmon-500 px-2 text-[11px] font-extrabold text-white">
              {active}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className={cn(
              "relative flex max-h-[88vh] w-full flex-col overflow-hidden bg-bg",
              "rounded-t-[26px] md:max-w-md md:rounded-[20px]",
            )}
          >
            <div className="flex items-center border-b border-line-soft px-5 py-4">
              <h2 className="font-display text-xl font-extrabold">Filters</h2>
              {active > 0 && (
                <span className="ml-2 rounded-full bg-persimmon-500 px-2 py-0.5 text-xs font-extrabold text-white">
                  {active}
                </span>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="ml-auto text-ink-500 hover:text-ink-900"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <FilterControls
              basePath={basePath}
              initial={filters}
              onApplied={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
