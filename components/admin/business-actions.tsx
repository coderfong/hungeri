"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Ban, RotateCcw } from "lucide-react";
import { verifyBusiness, setBusinessStatusAdmin } from "@/lib/admin/actions";

export function BusinessActions({
  businessId,
  verified,
  status,
}: {
  businessId: string;
  verified: boolean;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const refresh = () => router.refresh();

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <button
        onClick={() => start(async () => { await verifyBusiness(businessId, !verified); refresh(); })}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-btn border border-line bg-surface px-3 py-2 text-xs font-bold disabled:opacity-60"
      >
        <BadgeCheck className="size-3.5 text-persimmon-500" aria-hidden />
        {verified ? "Unverify" : "Verify"}
      </button>
      {status === "suspended" ? (
        <button
          onClick={() => start(async () => { await setBusinessStatusAdmin(businessId, "live"); refresh(); })}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-btn bg-savings px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          <RotateCcw className="size-3.5" aria-hidden /> Reinstate
        </button>
      ) : (
        <button
          onClick={() => start(async () => { await setBusinessStatusAdmin(businessId, "suspended"); refresh(); })}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-btn bg-urgent px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          <Ban className="size-3.5" aria-hidden /> Suspend
        </button>
      )}
    </div>
  );
}
