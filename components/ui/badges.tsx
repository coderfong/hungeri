import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small badge primitives. Each encodes one colour-meaning from the design system
 * so paid/savings/urgency can never be visually confused.
 */

/** Calm gold "Featured · Ad" chip. Always shown on paid placements (disclosure). */
export function FeaturedLabel({
  className,
  short = false,
}: {
  className?: string;
  short?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[9px] border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide",
        "border-ad-border bg-ad-bg text-ad-text",
        className,
      )}
    >
      <Star className="size-3" aria-hidden />
      {short ? "Featured" : "Featured · Ad"}
    </span>
  );
}

/**
 * Full-width gold ribbon across the top of a paid listing. Paired with
 * `featuredFrame` so featured cards read unmistakably different from organic
 * listings while staying clearly disclosed.
 */
export function FeaturedRibbon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1.5 bg-gradient-to-r from-ad-border via-ad-bg to-ad-border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-ad-text",
        className,
      )}
    >
      <Star className="size-3" fill="currentColor" aria-hidden />
      Featured · Ad
      <Star className="size-3" fill="currentColor" aria-hidden />
    </div>
  );
}

/** Gold gradient frame classes for a featured listing's wrapper element. */
export const featuredFrame =
  "bg-gradient-to-br from-[#EDD584] via-[#F7EBBE] to-[#EDD584] p-[3px] shadow-[0_12px_30px_rgba(203,164,54,0.3)]";

/** Solid persimmon offer badge, e.g. "1-FOR-1" / "30% OFF". */
export function DealTypeBadge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-[8px] bg-persimmon-500 px-2.5 py-1.5 text-[11px] font-extrabold text-white",
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Green savings badge — the only place green is used. */
export function SavingsBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-[8px] bg-savings-bg px-2.5 py-1.5 text-[13px] font-extrabold text-savings",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function NewTodayBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-[8px] bg-savings-bg px-2.5 py-1.5 text-[11px] font-extrabold uppercase text-savings",
        className,
      )}
    >
      New today
    </span>
  );
}

/** $ $$ $$$ $$$$ price-level indicator. */
export function PriceLevel({
  level,
  className,
}: {
  level: number | null;
  className?: string;
}) {
  if (!level) return null;
  return (
    <span className={cn("text-[13px] font-bold", className)} aria-label={`Price level ${level} of 4`}>
      <span className="text-ink-900">{"$".repeat(level)}</span>
      <span className="text-ink-300">{"$".repeat(4 - level)}</span>
    </span>
  );
}

/** Star rating chip (static for MVP — ratings come later). */
export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-bold">
      <Star className="size-3.5 text-star" fill="currentColor" aria-hidden />
      {value.toFixed(1)}
      {count != null && <span className="font-medium text-muted">({count})</span>}
    </span>
  );
}

/** Neutral tag chip (cuisine, dietary, channel). */
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-chip bg-line-soft px-2.5 py-1.5 text-[11px] font-semibold text-ink-500">
      {children}
    </span>
  );
}
