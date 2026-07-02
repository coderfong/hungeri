"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Native share where available, clipboard copy as fallback. */
export function ShareButton({
  title,
  className,
  label,
}: {
  title: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share this deal"
      className={cn("inline-flex items-center justify-center gap-2", className)}
    >
      {copied ? <Check className="size-[19px] text-savings" aria-hidden /> : <Share2 className="size-[19px]" aria-hidden />}
      {label && <span>{copied ? "Link copied" : label}</span>}
    </button>
  );
}
