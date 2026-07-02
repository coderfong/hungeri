import Link from "next/link";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DealFilters } from "@/lib/deals/query";
import { toQueryString } from "@/lib/deals/filters";

/**
 * Horizontal quick-filter chips (link-based, no JS). Toggles common facets in
 * the URL so the server re-renders the filtered feed.
 */
export function QuickChips({
  basePath,
  filters,
}: {
  basePath: string;
  filters: DealFilters;
}) {
  const noFacets =
    !filters.cuisine?.length &&
    !filters.dealType?.length &&
    !filters.priceLevel?.length &&
    !filters.channel?.length &&
    !filters.dietary?.length &&
    !filters.endingSoon &&
    !filters.newToday;

  const cuisineChips = ["Cafe", "Japanese", "Local", "Dessert"];

  function cuisineHref(c: string): string {
    const has = filters.cuisine?.includes(c);
    const cuisine = has
      ? filters.cuisine?.filter((x) => x !== c)
      : [...(filters.cuisine ?? []), c];
    return `${basePath}${toQueryString({ ...filters, cuisine })}`;
  }

  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
      <Chip href={`${basePath}${toQueryString({ q: filters.q })}`} active={noFacets} solid>
        All deals
      </Chip>
      <Chip
        href={`${basePath}${toQueryString({ ...filters, endingSoon: !filters.endingSoon })}`}
        active={!!filters.endingSoon}
        tone="urgent"
      >
        <Clock className="size-3.5" aria-hidden />
        Ending soon
      </Chip>
      <Chip
        href={`${basePath}${toQueryString({ ...filters, newToday: !filters.newToday })}`}
        active={!!filters.newToday}
        tone="savings"
      >
        New today
      </Chip>
      {cuisineChips.map((c) => (
        <Chip key={c} href={cuisineHref(c)} active={!!filters.cuisine?.includes(c)}>
          {c}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  href,
  active,
  solid,
  tone,
  children,
}: {
  href: string;
  active: boolean;
  solid?: boolean;
  tone?: "urgent" | "savings";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill px-3.5 py-2 text-[13px] font-bold transition-colors",
        active && (solid || !tone) && "bg-persimmon-500 text-white",
        active && tone === "urgent" && "bg-urgent-bg text-urgent",
        active && tone === "savings" && "bg-savings-bg text-savings",
        !active && "border-[1.5px] border-line bg-surface font-semibold text-ink-700 hover:border-ink-300",
      )}
    >
      {children}
    </Link>
  );
}
