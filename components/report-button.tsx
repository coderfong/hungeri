"use client";

import { useEffect, useState } from "react";
import { Flag, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const REASONS = [
  "Deal has expired but still shows live",
  "Incorrect details or price",
  "Offensive or inappropriate",
  "Not affiliated with this business",
  "Other",
];

/** Report a deal: opens a small dialog, posts to /api/reports. */
export function ReportButton({ dealId }: { dealId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit() {
    setPending(true);
    const finalReason = reason === "Other" ? detail || "Other" : `${reason}${detail ? ` — ${detail}` : ""}`;
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deal_id: dealId, reason: finalReason.slice(0, 500) }),
    });
    setPending(false);
    if (res.ok) setDone(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 p-2 text-[13px] font-bold text-muted hover:text-ink-700"
      >
        <Flag className="size-[15px]" aria-hidden />
        Report this deal
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Report deal"
            className="relative w-full max-w-md rounded-t-[26px] bg-surface p-5 md:rounded-[20px]"
          >
            <div className="mb-4 flex items-center">
              <h2 className="font-display text-xl font-extrabold">Report this deal</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="ml-auto text-ink-500">
                <X className="size-5" aria-hidden />
              </button>
            </div>

            {done ? (
              <div className="py-6 text-center">
                <p className="font-bold">Thanks — we&apos;ll take a look.</p>
                <p className="mt-1 text-sm text-ink-500">Our team reviews reports daily.</p>
                <Button className="mt-5 w-full" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </div>
            ) : (
              <>
                <fieldset className="space-y-2">
                  <legend className="sr-only">Reason</legend>
                  {REASONS.map((r) => (
                    <label
                      key={r}
                      className="flex cursor-pointer items-center gap-3 rounded-btn border border-line px-3.5 py-2.5 text-sm has-[:checked]:border-persimmon-500 has-[:checked]:bg-persimmon-50"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="accent-persimmon-500"
                      />
                      {r}
                    </label>
                  ))}
                </fieldset>
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="Add any details (optional)"
                  rows={3}
                  className="mt-3 w-full resize-none rounded-btn border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-persimmon-500"
                />
                <Button className="mt-4 w-full" onClick={submit} disabled={pending}>
                  {pending ? "Sending…" : "Submit report"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
