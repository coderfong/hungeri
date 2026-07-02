"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, MapPin, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Feed", icon: UtensilsCrossed, match: (p: string) => p === "/" },
  { href: "/near-me", label: "Map", icon: MapPin, match: (p: string) => p.startsWith("/near-me") },
  { href: "/saved", label: "Saved", icon: Heart, match: (p: string) => p.startsWith("/saved") },
  { href: "/account", label: "Profile", icon: User, match: (p: string) => p.startsWith("/account") },
];

/** Mobile bottom tab bar (hidden on desktop, where the top bar takes over). */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line-soft bg-surface px-0 pb-[max(16px,env(safe-area-inset-bottom))] pt-2.5 md:hidden"
      aria-label="Primary"
    >
      {ITEMS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 text-[11px] font-semibold",
              active ? "text-persimmon-500" : "text-muted",
            )}
          >
            <Icon
              className="size-[22px]"
              strokeWidth={active ? 2.4 : 2}
              fill={active && label === "Saved" ? "var(--color-persimmon-200)" : "none"}
              aria-hidden
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
