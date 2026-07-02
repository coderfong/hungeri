import type { LucideIcon } from "lucide-react";

/** Dashboard metric tile. */
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-card border border-line-soft bg-surface p-[18px]">
      <div className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-muted">
        <Icon className="size-4" aria-hidden />
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
