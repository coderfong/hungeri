import Link from "next/link";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { dealBadge, savingsLabel } from "@/lib/deals/format";
import { formatDateTime } from "@/lib/i18n/config";
import { DealImage } from "@/components/deal-image";
import { DealTypeBadge, SavingsBadge } from "@/components/ui/badges";
import { ModerationActions } from "@/components/admin/moderation-actions";

export const metadata = { title: "Moderation queue" };

type PendingDeal = {
  id: string;
  title: string;
  description: string | null;
  deal_type: "percentage" | "fixed_amount" | "bogo" | "set_menu" | "freebie" | "happy_hour" | "loyalty";
  discount_value: number | null;
  image_url: string | null;
  end_at: string;
  created_at: string;
  terms: string | null;
  fine_print: string | null;
  businesses: { name: string; slug: string; verified: boolean } | null;
};

/** Heuristic flags surfaced to the moderator (cheap auto-filter). */
function flags(d: PendingDeal): string[] {
  const out: string[] = [];
  if (d.deal_type === "percentage" && (d.discount_value ?? 0) > 80)
    out.push("Discount >80% — possible error or bait");
  if (d.businesses && !d.businesses.verified) out.push("Merchant not yet verified");
  if (!d.terms && !d.fine_print) out.push("No terms or fine print provided");
  return out;
}

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const admin = createAdminClient();
  const { data } = await admin
    .from("deals")
    .select(
      "id, title, description, deal_type, discount_value, image_url, end_at, created_at, terms, fine_print, businesses(name, slug, verified)",
    )
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });
  const deals = (data ?? []) as unknown as PendingDeal[];

  const selected = deals.find((d) => d.id === id) ?? deals[0] ?? null;

  return (
    <div className="flex min-h-[calc(100vh-49px)] flex-col md:h-[calc(100vh-0px)] md:flex-row">
      {/* Queue list */}
      <div className="border-b border-line-soft bg-surface md:w-[340px] md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="border-b border-line-soft px-5 py-4">
          <h1 className="font-display text-xl font-extrabold">Pending review</h1>
          <span className="text-xs font-bold text-muted">{deals.length} in queue</span>
        </div>
        {deals.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-500">Queue is clear 🎉</p>
        ) : (
          <ul>
            {deals.map((d) => {
              const isSel = selected?.id === d.id;
              const f = flags(d);
              return (
                <li key={d.id}>
                  <Link
                    href={`/admin/moderation?id=${d.id}`}
                    className={
                      "flex items-center gap-3 border-b border-line-soft px-4 py-3.5 " +
                      (isSel ? "border-l-[3px] border-l-persimmon-500 bg-persimmon-50" : "")
                    }
                  >
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-[10px]">
                      <DealImage src={d.image_url} alt={d.title} sizes="40px" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{d.title}</span>
                      <span className="block truncate text-xs text-muted">
                        {d.businesses?.name ?? "—"}
                      </span>
                    </span>
                    {f.length > 0 && (
                      <span className="rounded-[6px] bg-urgent-bg px-1.5 py-0.5 text-[10px] font-extrabold text-urgent">
                        FLAGGED
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-y-auto px-5 py-6 md:px-7">
        {!selected ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-ink-500">
            <ShieldAlert className="mb-3 size-10 text-persimmon-300" aria-hidden />
            <p className="text-sm">Nothing to review. New submissions appear here.</p>
          </div>
        ) : (
          <SelectedDeal deal={selected} />
        )}
      </div>
    </div>
  );
}

function SelectedDeal({ deal }: { deal: PendingDeal }) {
  const f = flags(deal);
  const savings = savingsLabel(deal);
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-muted">
        Submitted {formatDateTime(deal.created_at)}
      </div>

      <div className="mb-5 flex flex-col gap-5 sm:flex-row">
        <div className="w-full overflow-hidden rounded-card border border-line-soft bg-surface shadow-e1 sm:w-[200px] sm:shrink-0">
          <div className="relative h-[120px]">
            <DealImage src={deal.image_url} alt={deal.title} sizes="200px" />
            <span className="absolute left-2 top-2">
              <DealTypeBadge label={dealBadge(deal)} className="px-2 py-1 text-[10px]" />
            </span>
          </div>
          <div className="p-3">
            <div className="text-xs font-bold text-muted">{deal.businesses?.name}</div>
            <div className="font-display text-base font-extrabold">{deal.title}</div>
            {savings && <SavingsBadge className="mt-1.5 text-[11px]">{savings}</SavingsBadge>}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-extrabold">{deal.title}</h2>
          <p className="mb-3 text-sm text-ink-500">
            {deal.businesses?.name} · ends {formatDateTime(deal.end_at, { dateStyle: "medium" })} ·
            {deal.businesses?.verified ? " verified merchant" : " unverified merchant"}
          </p>

          {f.length > 0 && (
            <div className="mb-3 rounded-[13px] border border-persimmon-100 bg-persimmon-50 px-4 py-3">
              <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-persimmon-700">
                Why this was flagged
              </div>
              <ul className="space-y-1.5">
                {f.map((x) => (
                  <li key={x} className="flex items-center gap-2 text-sm text-ink-700">
                    <AlertTriangle className="size-[15px] shrink-0 text-warning" aria-hidden />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {deal.description && <p className="text-sm text-ink-600">{deal.description}</p>}
          {(deal.terms || deal.fine_print) && (
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              <b className="text-ink-900">Terms:</b> {deal.terms} {deal.fine_print}
            </p>
          )}
        </div>
      </div>

      <ModerationActions dealId={deal.id} />
    </div>
  );
}
