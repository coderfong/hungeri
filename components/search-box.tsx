"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

/** Search input that debounces into the URL (?q=). Server renders the results. */
export function SearchBox({ initialQuery = "" }: { initialQuery?: string }) {
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

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex flex-1 items-center gap-2.5 rounded-[13px] border-[1.5px] border-persimmon-500 bg-surface px-3.5 py-3 shadow-[0_0_0_4px_var(--color-persimmon-200)]">
        <Search className="size-[18px] text-persimmon-500" aria-hidden />
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search deals, food, places…"
          aria-label="Search deals"
          className="w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-muted"
        />
        {value && (
          <button onClick={() => setValue("")} aria-label="Clear search" className="text-muted">
            <X className="size-[17px]" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
