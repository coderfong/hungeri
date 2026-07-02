"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Eye } from "lucide-react";
import { deleteDeal } from "@/lib/merchant/actions";

/** Edit / preview / delete controls for a deal row. */
export function DealRowActions({ dealId, status }: { dealId: string; status: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  function remove() {
    start(async () => {
      await deleteDeal(dealId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      {status === "live" && (
        <Link
          href={`/deals/${dealId}`}
          target="_blank"
          aria-label="Preview live deal"
          className="flex size-8 items-center justify-center rounded-lg text-ink-500 hover:bg-bg"
        >
          <Eye className="size-4" aria-hidden />
        </Link>
      )}
      <Link
        href={`/dashboard/deals/${dealId}/edit`}
        aria-label="Edit deal"
        className="flex size-8 items-center justify-center rounded-lg text-ink-500 hover:bg-bg"
      >
        <Pencil className="size-4" aria-hidden />
      </Link>
      {confirming ? (
        <button
          onClick={remove}
          disabled={pending}
          className="rounded-lg px-2 py-1 text-xs font-bold text-error hover:bg-urgent-bg"
        >
          {pending ? "…" : "Confirm"}
        </button>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          aria-label="Delete deal"
          className="flex size-8 items-center justify-center rounded-lg text-ink-500 hover:bg-urgent-bg hover:text-error"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
