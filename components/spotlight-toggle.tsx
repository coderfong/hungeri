"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";
import { setSpotlight } from "@/lib/admin/spotlight";
import { cn } from "@/lib/utils";

/**
 * Admin/super-merchant control to add or remove a shop from the homepage
 * featured carousel. Rendered inside a card/banner <Link>, so it stops the
 * click from navigating.
 */
export function SpotlightToggle({
  businessId,
  active,
  className,
}: {
  businessId: string;
  active: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    setError(null);
    const res = await setSpotlight(businessId, !active);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Failed");
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={error ?? (active ? "Remove from spotlight" : "Add to spotlight")}
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-extrabold shadow-e1 transition-colors",
        active
          ? "bg-persimmon-500 text-white hover:bg-persimmon-600"
          : "bg-white/90 text-ink-700 hover:bg-white",
        className,
      )}
    >
      {busy ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <Star className={cn("size-3.5", active && "fill-current")} aria-hidden />
      )}
      {active ? "Featured" : "Feature"}
    </button>
  );
}
