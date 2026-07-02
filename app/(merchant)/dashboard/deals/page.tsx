import Link from "next/link";
import { Plus } from "lucide-react";
import { requireBusiness } from "@/lib/merchant/context";
import { DealStatusBadge } from "@/components/merchant/stat-card";
import { DealRowActions } from "@/components/merchant/deal-row-actions";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/i18n/config";

export const metadata = { title: "Deals" };

export default async function DealsListPage() {
  const { business, db: supabase } = await requireBusiness();
  const { data: deals } = await supabase
    .from("deals")
    .select("id, title, status, start_at, end_at, deal_type")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return (
    <div className="px-5 py-6 md:px-8">
      <div className="mb-6 flex items-center">
        <h1 className="font-display text-2xl font-extrabold">Deals</h1>
        <Link href="/dashboard/deals/new" className="ml-auto">
          <Button>
            <Plus className="size-[18px]" aria-hidden /> Create deal
          </Button>
        </Link>
      </div>

      {!deals?.length ? (
        <div className="rounded-card border border-dashed border-line bg-surface px-4 py-12 text-center">
          <p className="text-sm text-ink-500">No deals yet — create your first to start reaching diners.</p>
          <Link href="/dashboard/deals/new" className="mt-3 inline-block">
            <Button size="sm">Create deal</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-line-soft bg-surface">
          {deals.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 border-b border-line-soft px-4 py-3.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{d.title}</div>
                <div className="text-xs text-muted">
                  {formatDateTime(d.start_at, { dateStyle: "medium" })} →{" "}
                  {formatDateTime(d.end_at, { dateStyle: "medium" })}
                </div>
              </div>
              <DealStatusBadge status={d.status} />
              <DealRowActions dealId={d.id} status={d.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
