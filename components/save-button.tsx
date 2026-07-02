"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Save/unsave heart. Optimistic toggle backed by /api/saves. Anonymous users are
 * redirected to login (saving requires an account; browsing does not).
 */
export function SaveButton({
  dealId,
  initialSaved,
  isAuthed,
  size = "md",
  className,
}: {
  dealId: string;
  initialSaved: boolean;
  isAuthed: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  const dims = { sm: "size-7", md: "size-9", lg: "size-10" }[size];
  const icon = { sm: "size-3.5", md: "size-[18px]", lg: "size-5" }[size];

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthed) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const next = !saved;
    setSaved(next); // optimistic
    startTransition(async () => {
      const res = await fetch("/api/saves", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: dealId }),
      });
      if (!res.ok) setSaved(!next); // revert on failure
      else router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved deals" : "Save this deal"}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-white/90 shadow-e1 backdrop-blur transition-transform",
        "hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-persimmon-100",
        dims,
        className,
      )}
    >
      <Heart
        className={cn(icon, saved ? "text-urgent" : "text-urgent")}
        fill={saved ? "currentColor" : "none"}
        aria-hidden
      />
    </button>
  );
}
