"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { DEAL_TYPES } from "@/lib/deals/facets";
import { createCuratedDeal, type CurateInput } from "@/lib/admin/actions";
import type { DealType } from "@/types/database";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-btn border-[1.5px] border-line bg-bg px-3.5 py-3 text-[15px] outline-none focus:border-persimmon-500 focus:ring-4 focus:ring-persimmon-100";

export function CurateForm({ businesses }: { businesses: { id: string; name: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    business_id: businesses[0]?.id ?? "",
    title: "",
    description: "",
    deal_type: "percentage" as DealType,
    discount_value: "",
    end_at: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 16),
    source_url: "",
    publisher: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    const input: CurateInput = {
      business_id: form.business_id,
      title: form.title,
      description: form.description || undefined,
      deal_type: form.deal_type,
      discount_value: form.discount_value ? Number(form.discount_value) : undefined,
      end_at: form.end_at,
      source_url: form.source_url || "",
      publisher: form.publisher || undefined,
    };
    const res = await createCuratedDeal(input);
    setBusy(false);
    if (!res.ok) setError(res.error);
    else {
      setDone(true);
      setForm((f) => ({ ...f, title: "", description: "", discount_value: "", source_url: "" }));
      router.refresh();
    }
  }

  if (businesses.length === 0) {
    return <p className="text-sm text-ink-500">No live businesses to attach a curated deal to.</p>;
  }

  return (
    <div className="space-y-4">
      {done && (
        <p className="rounded-btn bg-savings-bg px-3.5 py-2.5 text-sm font-semibold text-savings">
          Curated deal published. Add another or view it on the feed.
        </p>
      )}
      <div>
        <div className="mb-1.5 text-[13px] font-bold">Business</div>
        <select
          className={inputCls}
          value={form.business_id}
          onChange={(e) => setForm((f) => ({ ...f, business_id: e.target.value }))}
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>
      <div>
        <div className="mb-1.5 text-[13px] font-bold">Headline</div>
        <input
          className={inputCls}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="1-for-1 mains this weekend"
        />
      </div>
      <div>
        <div className="mb-1.5 text-[13px] font-bold">Deal type</div>
        <div className="flex flex-wrap gap-2">
          {DEAL_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, deal_type: t.value }))}
              className={cn(
                "rounded-pill px-3.5 py-2 text-[13px] font-semibold",
                form.deal_type === t.value
                  ? "bg-persimmon-500 font-bold text-white"
                  : "border-[1.5px] border-line bg-surface text-ink-700",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {(form.deal_type === "percentage" || form.deal_type === "fixed_amount") && (
        <div>
          <div className="mb-1.5 text-[13px] font-bold">
            {form.deal_type === "percentage" ? "Percent off (%)" : "Amount off (S$)"}
          </div>
          <input
            type="number"
            className={inputCls}
            value={form.discount_value}
            onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
          />
        </div>
      )}
      <div>
        <div className="mb-1.5 text-[13px] font-bold">Valid until</div>
        <input
          type="datetime-local"
          className={inputCls}
          value={form.end_at}
          onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 text-[13px] font-bold">Source URL (attribution)</div>
          <input
            className={inputCls}
            value={form.source_url}
            onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
            placeholder="https://…"
          />
        </div>
        <div>
          <div className="mb-1.5 text-[13px] font-bold">Publisher</div>
          <input
            className={inputCls}
            value={form.publisher}
            onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))}
            placeholder="e.g. eatbook.sg"
          />
        </div>
      </div>
      {error && <p className="text-sm font-semibold text-error">{error}</p>}
      <Button disabled={busy || !form.title} onClick={submit}>
        {busy ? "Publishing…" : "Publish curated deal"}
      </Button>
    </div>
  );
}
