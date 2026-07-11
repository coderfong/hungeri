import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Per-metric accent so each dashboard tile reads at a glance. */
export type StatTone = "brand" | "savings" | "urgent" | "gold";

const TONE_STYLES: Record<StatTone, { chip: string; bar: string }> = {
  brand: { chip: "bg-persimmon-50 text-persimmon-500", bar: "bg-persimmon-500" },
  savings: { chip: "bg-savings-bg text-savings", bar: "bg-savings" },
  urgent: { chip: "bg-urgent-bg text-urgent", bar: "bg-urgent" },
  gold: { chip: "bg-ad-bg text-ad-text", bar: "bg-warning" },
};

/** Dashboard metric tile. */
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "brand",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone?: StatTone;
}) {
  const t = TONE_STYLES[tone];
  return (
    <div className="relative overflow-hidden rounded-card border border-line-soft bg-surface p-[18px]">
      <span className={cn("absolute inset-x-0 top-0 h-1", t.bar)} aria-hidden />
      <div className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-muted">
        <span className={cn("flex size-7 items-center justify-center rounded-lg", t.chip)}>
          <Icon className="size-4" aria-hidden />
        </span>
        {label}
      </div>
      <div className="font-display text-3xl font-extrabold">{value}</div>
      {sub && <div className="mt-1 text-xs font-semibold text-muted">{sub}</div>}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  live: "bg-savings-bg text-savings",
  pending_review: "bg-[#FEF3DD] text-warning",
  draft: "bg-line-soft text-muted",
  expired: "bg-line-soft text-muted",
  rejected: "bg-urgent-bg text-urgent",
};

const STATUS_LABELS: Record<string, string> = {
  live: "Live",
  pending_review: "In review",
  draft: "Draft",
  expired: "Expired",
  rejected: "Rejected",
};

export function DealStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-[7px] px-2.5 py-1 text-[11px] font-extrabold ${STATUS_STYLES[status] ?? "bg-line-soft text-muted"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
