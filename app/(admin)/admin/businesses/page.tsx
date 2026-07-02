import { BadgeCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { BusinessActions } from "@/components/admin/business-actions";

export const metadata = { title: "Businesses" };

const STATUS_STYLE: Record<string, string> = {
  live: "bg-savings-bg text-savings",
  draft: "bg-line-soft text-muted",
  suspended: "bg-urgent-bg text-urgent",
};

export default async function BusinessesPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("businesses")
    .select("id, name, slug, status, verified, cuisine_tags, created_at")
    .order("created_at", { ascending: false });
  const businesses = data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-6 md:px-8">
      <h1 className="mb-5 font-display text-2xl font-extrabold">Businesses</h1>

      <div className="overflow-hidden rounded-card border border-line-soft bg-surface">
        {businesses.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center gap-3 border-b border-line-soft px-4 py-3.5 last:border-0">
            <span className="flex size-10 items-center justify-center rounded-[10px] bg-ink-900 font-display text-sm font-extrabold text-white">
              {b.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-bold">{b.name}</span>
                {b.verified && <BadgeCheck className="size-4 shrink-0 text-persimmon-500" aria-hidden />}
              </div>
              <div className="text-xs text-muted">{b.cuisine_tags?.[0] ?? "—"}</div>
            </div>
            <span className={`rounded-[7px] px-2.5 py-1 text-[11px] font-extrabold capitalize ${STATUS_STYLE[b.status] ?? "bg-line-soft text-muted"}`}>
              {b.status}
            </span>
            <BusinessActions businessId={b.id} verified={b.verified} status={b.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
