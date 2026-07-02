"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Live countdown for expiring deals. Shows HH:MM:SS in coral mono when under a
 * day remains; otherwise a calm "Ends <date>". Coral is reserved for urgency.
 */
function format(msLeft: number): { text: string; urgent: boolean } {
  if (msLeft <= 0) return { text: "Ended", urgent: false };
  const totalSec = Math.floor(msLeft / 1000);
  const days = Math.floor(totalSec / 86400);
  if (days >= 1) {
    return { text: `${days}d left`, urgent: false };
  }
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { text: `${pad(h)}:${pad(m)}:${pad(s)}`, urgent: true };
}

export function Countdown({
  endAt,
  className,
  withIcon = true,
  prefix,
}: {
  endAt: string;
  className?: string;
  withIcon?: boolean;
  prefix?: string;
}) {
  const end = new Date(endAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  // Start ticking only after mount to avoid hydration mismatch.
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const msLeft = end - (now ?? Date.now());
  const { text } = format(msLeft);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] font-bold",
        msLeft <= 0 ? "text-muted" : "text-urgent",
        className,
      )}
      suppressHydrationWarning
    >
      {withIcon && <Clock className="size-3" aria-hidden />}
      {prefix}
      {text}
    </span>
  );
}
