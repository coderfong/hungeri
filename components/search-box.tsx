"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Search input that debounces into the URL (?q=). Server renders the results.
 *
 * - `prominent` (default): the big focused search field on the /search page.
 * - `bar`: a compact field used as the always-present top-bar / home entry, so
 *   pressing it lets you type in place instead of bouncing to an empty box.
 */
export function SearchBox({
  initialQuery = "",
  variant = "prominent",
  autoFocus = false,
}: {
  initialQuery?: string;
  variant?: "prominent" | "bar";
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      router.push(value.trim() ? `/search?q=${encodeURIComponent(value.trim())}` : "/search");
    }, 300);
    return () => clearTimeout(t);
  }, [value, router]);

  const bar = variant === "bar";

  return (
    <div
      className={cn(
        "flex flex-1 items-center gap-2.5 bg-surface",
        bar
          ? "rounded-btn border-[1.5px] border-line px-3.5 py-2.5 focus-within:border-persimmon-400"
          : "rounded-[13px] border-[1.5px] border-persimmon-500 px-3.5 py-3 shadow-[0_0_0_4px_var(--color-persimmon-200)]",
      )}
    >
      <Search className={cn("size-[18px]", bar ? "text-muted" : "text-persimmon-500")} aria-hidden />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search deals, food, places…"
        aria-label="Search deals"
        className={cn(
          "w-full bg-transparent outline-none placeholder:text-muted",
          bar ? "text-sm" : "text-[15px] font-medium",
        )}
      />
      {value && (
        <button onClick={() => setValue("")} aria-label="Clear search" className="text-muted">
          <X className="size-[17px]" aria-hidden />
        </button>
      )}
    </div>
  );
}
