"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { resolveReport, takedownDeal } from "@/lib/admin/actions";

export function ReportActions({ reportId, dealId }: { reportId: string; dealId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={() => start(async () => { await takedownDeal(reportId, dealId); router.refresh(); })}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-btn bg-urgent px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
      >
        <Trash2 className="size-3.5" aria-hidden /> Take down
      </button>
      <button
        onClick={() => start(async () => { await resolveReport(reportId); router.refresh(); })}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-btn border border-line bg-surface px-3 py-2 text-xs font-bold disabled:opacity-60"
      >
        <Check className="size-3.5" aria-hidden /> Resolve
      </button>
    </div>
  );
}
