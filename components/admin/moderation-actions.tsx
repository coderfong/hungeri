"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { approveDeal, rejectDeal, requestChanges } from "@/lib/admin/actions";

const PRESET_REASONS = [
  "Discount looks like an error",
  "Add validity dates",
  "Verify business first",
  "Image doesn't match the offer",
  "Terms unclear or missing",
];

export function ModerationActions({ dealId }: { dealId: string }) {
  const router = useRouter();
  const [reasons, setReasons] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function reasonText() {
    return [...reasons, custom.trim()].filter(Boolean).join("; ") || undefined;
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Something went wrong");
        return;
      }
      router.push("/admin/moderation");
      router.refresh();
    });
  }

  return (
    <div className="rounded-card border border-line-soft bg-surface p-[18px]">
      <div className="mb-3 text-sm font-bold">Decision</div>
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row">
        <button
          onClick={() => run(() => approveDeal(dealId))}
          disabled={pending}
          className="flex flex-1 items-center justify-center gap-2 rounded-btn bg-savings px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          <Check className="size-[17px]" aria-hidden /> Approve
        </button>
        <button
          onClick={() => run(() => rejectDeal(dealId, reasonText()))}
          disabled={pending}
          className="flex flex-1 items-center justify-center gap-2 rounded-btn bg-urgent px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          <X className="size-[17px]" aria-hidden /> Reject
        </button>
        <button
          onClick={() => run(() => requestChanges(dealId, reasonText()))}
          disabled={pending}
          className="flex flex-1 items-center justify-center gap-2 rounded-btn border-[1.5px] border-line bg-surface px-4 py-3 text-sm font-bold disabled:opacity-60"
        >
          <MessageSquare className="size-4" aria-hidden /> Request changes
        </button>
      </div>

      <div className="mb-2 text-xs font-bold text-muted">Reason (sent to merchant)</div>
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESET_REASONS.map((r) => {
          const on = reasons.includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => setReasons((p) => (on ? p.filter((x) => x !== r) : [...p, r]))}
              className={cn(
                "rounded-pill px-3 py-1.5 text-xs font-semibold",
                on ? "bg-ink-900 text-white" : "border border-line bg-bg text-ink-700",
              )}
            >
              {r}
            </button>
          );
        })}
      </div>
      <input
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        placeholder="Custom note (optional)"
        className="w-full rounded-btn border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-persimmon-500"
      />
      {error && <p className="mt-3 text-sm font-semibold text-error">{error}</p>}
    </div>
  );
}
