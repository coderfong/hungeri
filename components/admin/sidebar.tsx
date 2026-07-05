"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  Flag,
  Store,
  Sparkles,
  LayoutDashboard,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/moderation", label: "Moderation", icon: ShieldAlert, badgeKey: "pending" },
  { href: "/admin/reports", label: "Reports", icon: Flag, badgeKey: "reports" },
  { href: "/admin/businesses", label: "Businesses", icon: Store },
  { href: "/admin/curate", label: "Curate", icon: Sparkles },
] as const;

export function AdminSidebar({ counts }: { counts: { pending: number; reports: number } }) {
  const pathname = usePathname();
  function active(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  }
  return (
    <>
      <aside className="hidden w-[210px] shrink-0 flex-col bg-ink-900 p-4 text-white md:flex">
        <Link href="/" className="mb-5 flex items-center gap-2.5 px-2 pt-2">
          <LogoMark className="size-[30px] rounded-[9px]" />
          <span className="font-display text-[17px] font-extrabold">Hungeri</span>
          <span className="rounded-[5px] bg-persimmon-300 px-1.5 py-0.5 text-[9px] font-extrabold text-ink-900">
            ADMIN
          </span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const on = active(item.href, "exact" in item ? item.exact : false);
            const badge =
              "badgeKey" in item ? counts[item.badgeKey as "pending" | "reports"] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm font-semibold",
                  on ? "bg-[#33271F] text-white" : "text-ink-300 hover:text-white",
                )}
              >
                <item.icon className={cn("size-[19px]", on && "text-persimmon-300")} aria-hidden />
                {item.label}
                {badge > 0 && (
                  <span className="ml-auto rounded-full bg-urgent px-2 text-[11px] font-extrabold text-white">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/"
          className="mt-auto flex items-center gap-2 px-3 text-xs font-semibold text-ink-300 hover:text-white"
        >
          <ExternalLink className="size-3.5" aria-hidden /> View site
        </Link>
      </aside>

      {/* Mobile top nav */}
      <div className="sticky top-0 z-40 bg-ink-900 text-white md:hidden">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-persimmon-500">
              <span
                className="size-2.5 rounded-full border-2 border-white"
                style={{ borderBottomColor: "transparent", transform: "rotate(45deg)" }}
                aria-hidden
              />
            </span>
            <span className="font-display font-extrabold">Hungeri Admin</span>
          </Link>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map((item) => {
            const on = active(item.href, "exact" in item ? item.exact : false);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-[13px] font-semibold",
                  on ? "bg-[#33271F] text-white" : "text-ink-300",
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
