"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Repeat } from "lucide-react";
import type { DealType, DealChannel } from "@/types/database";
import { DEAL_TYPES, CHANNELS, DIETARY } from "@/lib/deals/facets";
import { saveDeal } from "@/lib/merchant/actions";
import type { DealInput } from "@/lib/merchant/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/merchant/image-upload";
import { DealPreview } from "@/components/merchant/deal-preview";

type FormState = {
  title: string;
  description: string;
  deal_type: DealType;
  discount_value: string;
  channels: DealChannel[];
  dietary_tags: string[];
  start_at: string;
  end_at: string;
  recurring: boolean;
  image_url: string;
  terms: string;
  fine_print: string;
};

function localInput(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-pill px-3.5 py-2 text-[13px] font-semibold transition-colors",
        active
          ? "bg-persimmon-500 font-bold text-white"
          : "border-[1.5px] border-line bg-surface text-ink-700 hover:border-ink-300",
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-bold">{label}</div>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-btn border-[1.5px] border-line bg-bg px-3.5 py-3 text-[15px] outline-none focus:border-persimmon-500 focus:ring-4 focus:ring-persimmon-100";

export function DealForm({
  businessId,
  businessName,
  dealId,
  initial,
}: {
  businessId: string;
  businessName: string;
  dealId?: string;
  initial?: Partial<FormState> & { start_iso?: string; end_iso?: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    deal_type: initial?.deal_type ?? "bogo",
    discount_value: initial?.discount_value ?? "",
    channels: initial?.channels ?? ["dine_in"],
    dietary_tags: initial?.dietary_tags ?? [],
    start_at: initial?.start_iso ? localInput(initial.start_iso) : localInput(),
    end_at: initial?.end_iso ? localInput(initial.end_iso) : localInput(new Date(Date.now() + 7 * 864e5).toISOString()),
    recurring: initial?.recurring ?? false,
    image_url: initial?.image_url ?? "",
    terms: initial?.terms ?? "",
    fine_print: initial?.fine_print ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "draft" | "publish">(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const valueLabel =
    form.deal_type === "percentage"
      ? "Percent off (%)"
      : form.deal_type === "fixed_amount"
        ? "Amount off (S$)"
        : null;

  async function submit(publish: boolean) {
    setError(null);
    setBusy(publish ? "publish" : "draft");
    const input: DealInput = {
      title: form.title,
      description: form.description || undefined,
      deal_type: form.deal_type,
      discount_value: form.discount_value ? Number(form.discount_value) : undefined,
      channels: form.channels,
      dietary_tags: form.dietary_tags,
      start_at: form.start_at,
      end_at: form.end_at,
      recurring: form.recurring,
      redemption_method: "show_screen",
      image_url: form.image_url || undefined,
      terms: form.terms || undefined,
      fine_print: form.fine_print || undefined,
    };
    const res = await saveDeal(input, { id: dealId, publish });
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/dashboard/deals");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-line-soft bg-surface px-5 py-4 md:px-7">
        <Link href="/dashboard/deals" aria-label="Back to deals">
          <ArrowLeft className="size-[22px]" aria-hidden />
        </Link>
        <h1 className="font-display text-xl font-extrabold">{dealId ? "Edit deal" : "Create deal"}</h1>
        <span className="rounded-lg bg-line-soft px-2.5 py-1 text-xs font-bold text-muted">Draft</span>
        <div className="ml-auto flex gap-2.5">
          <Button variant="outline" size="sm" disabled={!!busy} onClick={() => submit(false)}>
            {busy === "draft" ? "Saving…" : "Save draft"}
          </Button>
          <Button size="sm" disabled={!!busy} onClick={() => submit(true)}>
            {busy === "publish" ? "Submitting…" : "Publish deal"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mx-5 mt-4 rounded-btn bg-urgent-bg px-3.5 py-2.5 text-sm font-semibold text-urgent md:mx-7">
          {error}
        </p>
      )}

      <div className="grid gap-0 lg:grid-cols-[1.3fr_380px]">
        {/* Form */}
        <div className="space-y-5 px-5 py-6 md:px-7 lg:border-r lg:border-line-soft">
          <Field label="Deal headline" hint="Short and punchy — the big text on your card.">
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="1-for-1 Bubble Tea"
            />
          </Field>

          <Field label="Deal type">
            <div className="flex flex-wrap gap-2">
              {DEAL_TYPES.map((t) => (
                <Pill key={t.value} active={form.deal_type === t.value} onClick={() => set("deal_type", t.value)}>
                  {t.label}
                </Pill>
              ))}
            </div>
          </Field>

          {valueLabel && (
            <Field label={valueLabel}>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={form.discount_value}
                onChange={(e) => set("discount_value", e.target.value)}
                placeholder={form.deal_type === "percentage" ? "30" : "5.00"}
              />
            </Field>
          )}

          <Field label="Description">
            <textarea
              rows={2}
              className={cn(inputCls, "resize-none")}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Any milk tea, dine-in only · Daily 2–6pm"
            />
          </Field>

          <Field label="Deal image" hint="Optional. JPG/PNG, ideally 1080px+.">
            <ImageUpload
              value={form.image_url}
              onChange={(url) => set("image_url", url)}
              pathPrefix={businessId}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Starts">
              <input
                type="datetime-local"
                className={inputCls}
                value={form.start_at}
                onChange={(e) => set("start_at", e.target.value)}
              />
            </Field>
            <Field label="Valid until">
              <input
                type="datetime-local"
                className={inputCls}
                value={form.end_at}
                onChange={(e) => set("end_at", e.target.value)}
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={() => set("recurring", !form.recurring)}
            className="flex w-full items-center gap-3 rounded-[13px] border border-line-soft bg-surface px-4 py-3.5 text-left"
          >
            <Repeat className="size-5 text-persimmon-500" aria-hidden />
            <span className="flex-1">
              <span className="block text-sm font-bold">Recurring deal</span>
              <span className="block text-xs text-muted">Auto-repeat daily in this window</span>
            </span>
            <span
              className={cn(
                "relative h-7 w-12 rounded-full transition-colors",
                form.recurring ? "bg-persimmon-500" : "bg-line",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-6 rounded-full bg-white transition-all",
                  form.recurring ? "right-0.5" : "left-0.5",
                )}
              />
            </span>
          </button>

          <Field label="Channels">
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((c) => (
                <Pill
                  key={c.value}
                  active={form.channels.includes(c.value)}
                  onClick={() => set("channels", toggle(form.channels, c.value))}
                >
                  {c.label}
                </Pill>
              ))}
            </div>
          </Field>

          <Field label="Dietary tags">
            <div className="flex flex-wrap gap-2">
              {DIETARY.map((d) => (
                <Pill
                  key={d}
                  active={form.dietary_tags.includes(d)}
                  onClick={() => set("dietary_tags", toggle(form.dietary_tags, d))}
                >
                  {d}
                </Pill>
              ))}
            </div>
          </Field>

          <Field
            label="How diners redeem"
            hint="Diners scan the shop QR in-store and show the “Redeemed!” screen to staff."
          >
            <div className={cn(inputCls, "flex items-center bg-line-soft text-ink-500")}>
              Show screen in-store
            </div>
          </Field>

          <Field label="Terms">
            <textarea
              rows={2}
              className={cn(inputCls, "resize-none")}
              value={form.terms}
              onChange={(e) => set("terms", e.target.value)}
              placeholder="Valid for dine-in. One redemption per visit."
            />
          </Field>
          <Field label="Fine print">
            <textarea
              rows={2}
              className={cn(inputCls, "resize-none")}
              value={form.fine_print}
              onChange={(e) => set("fine_print", e.target.value)}
              placeholder="Not valid with other promotions."
            />
          </Field>
        </div>

        {/* Live preview */}
        <div className="bg-[#F8F1EB] px-6 py-6">
          <div className="sticky top-6">
            <DealPreview
              title={form.title}
              description={form.description}
              dealType={form.deal_type}
              discountValue={form.discount_value ? Number(form.discount_value) : null}
              imageUrl={form.image_url}
              businessName={businessName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
