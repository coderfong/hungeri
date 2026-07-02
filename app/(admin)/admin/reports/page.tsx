import { Flag, CheckCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/i18n/config";
import { ReportActions } from "@/components/admin/report-actions";

export const metadata = { title: "Reports" };

type ReportRow = {
  id: string;
  reason: string;
  created_at: string;
  deal_id: string;
  deals: { title: string; businesses: { name: string } | null } | null;
};

export default async function ReportsPage() {
  const admin = createAdminClient();
  const { data: openData } = await admin
    .from("reports")
    .select("id, reason, created_at, deal_id, deals(title, businesses(name))")
    .eq("status", "open")
    .order("created_at", { ascending: true });
  const { data: resolvedData } = await admin
    .from("reports")
    .select("id, reason, created_at, deal_id, deals(title, businesses(name))")
    .eq("status", "resolved")
    .order("resolved_at", { ascending: false })
    .limit(10);

  const open = (openData ?? []) as unknown as ReportRow[];
  const resolved = (resolvedData ?? []) as unknown as ReportRow[];

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 md:px-8">
      <div className="mb-5 flex items-center">
        <h1 className="font-display text-2xl font-extrabold">Diner reports</h1>
        <span className="ml-auto text-xs font-bold text-muted">Resolve within 24h</span>
      </div>

      {open.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-surface px-4 py-10 text-center text-sm text-ink-500">
          No open reports. 🎉
        </p>
      ) : (
        <div className="overflow-hidden rounded-card border border-line-soft bg-surface">
          {open.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 border-b border-line-soft px-4 py-3.5 last:border-0">
              <span className="flex size-11 items-center justify-center rounded-xl bg-urgent-bg">
                <Flag className="size-5 text-urgent" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">
                  {r.deals?.title ?? "Deleted deal"}
                  {r.deals?.businesses?.name && (
                    <span className="text-muted"> · {r.deals.businesses.name}</span>
                  )}
                </div>
                <div className="text-xs text-ink-500">
                  “{r.reason}” · {formatDateTime(r.created_at, { dateStyle: "medium" })}
                </div>
              </div>
              <ReportActions reportId={r.id} dealId={r.deal_id} />
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <>
          <h2 className="mb-3 mt-7 font-display text-lg font-bold">Recently resolved</h2>
          <div className="overflow-hidden rounded-card border border-line-soft bg-surface">
            {resolved.map((r) => (
              <div key={r.id} className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-0">
                <CheckCheck className="size-5 text-savings" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm">{r.deals?.title ?? "Deleted deal"}</span>
                <span className="rounded-[7px] bg-savings-bg px-2 py-0.5 text-[11px] font-extrabold text-savings">
                  Resolved
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
