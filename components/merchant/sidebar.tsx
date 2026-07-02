"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  Megaphone,
  BarChart3,
  Store,
  Settings,
  QrCode,
  BadgeCheck,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/deals", label: "Deals", icon: Tag },
  { href: "/dashboard/placements", label: "Placements", icon: Megaphone },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/outlets", label: "Outlets", icon: Store },
  { href: "/dashboard/qr", label: "QR code", icon: QrCode },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export type SidebarBusiness = {
  name: string;
  verified: boolean;
  status: string;
} | null;

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

/** Dark merchant sidebar (desktop) + horizontal nav (mobile). */
export function MerchantSidebar({ business }: { business: SidebarBusiness }) {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-[220px] shrink-0 flex-col bg-ink-900 p-4 text-white md:flex">
        <Link href="/" className="mb-5 flex items-center gap-2.5 px-2 pt-2">
          <span className="flex size-[30px] items-center justify-center rounded-[9px] bg-persimmon-500">
            <span
              className="size-3 rounded-full border-[2.5px] border-white"
              style={{ borderBottomColor: "transparent", transform: "rotate(45deg)" }}
              aria-hidden
            />
          </span>
          <span className="font-display text-lg font-extrabold">Hungeri</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm font-semibold",
                  active ? "bg-[#33271F] text-white" : "text-ink-300 hover:text-white",
                )}
              >
                <Icon className={cn("size-[19px]", active && "text-persimmon-300")} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <Link
            href="/"
            className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold text-ink-300 hover:text-white"
          >
            <ExternalLink className="size-3.5" aria-hidden /> View site
          </Link>
          {business && (
            <div className="flex items-center gap-2.5 rounded-xl bg-[#33271F] p-2.5">
              <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-ink-900 font-display font-extrabold">
                {business.name.charAt(0)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-bold">{business.name}</span>
                <span className="flex items-center gap-1 text-[11px] font-bold">
                  {business.verified ? (
                    <span className="flex items-center gap-1 text-savings">
                      <BadgeCheck className="size-3" aria-hidden /> Verified
                    </span>
                  ) : (
                    <span className="text-warning capitalize">{business.status}</span>
                  )}
                </span>
              </span>
            </div>
          )}
        </div>
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
            <span className="font-display font-extrabold">Hungeri</span>
          </Link>
          {business && (
            <span className="ml-auto truncate text-sm font-bold text-ink-300">{business.name}</span>
          )}
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-[13px] font-semibold",
                  active ? "bg-[#33271F] text-white" : "text-ink-300",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
