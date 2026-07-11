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
import { setActiveBusiness } from "@/lib/merchant/actions";
import { LogoMark } from "@/components/logo";

// Each section gets its own icon colour so pages are easy to tell apart.
const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true, color: "text-persimmon-300" },
  { href: "/dashboard/deals", label: "Deals", icon: Tag, color: "text-[#5ecf8f]" },
  { href: "/dashboard/placements", label: "Placements", icon: Megaphone, color: "text-[#f0c95c]" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, color: "text-[#7fb5ff]" },
  { href: "/dashboard/outlets", label: "Outlets", icon: Store, color: "text-[#c99bff]" },
  { href: "/dashboard/qr", label: "QR code", icon: QrCode, color: "text-[#ff9db5]" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, color: "text-ink-300" },
];

export type SidebarBusiness = {
  name: string;
  verified: boolean;
  status: string;
} | null;

export type SwitcherBusiness = { id: string; name: string; slug: string };

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

/** Super-merchant business picker — submits on change to switch the active shop. */
function BusinessSwitcher({
  businesses,
  activeBusinessId,
}: {
  businesses: SwitcherBusiness[];
  activeBusinessId: string | null;
}) {
  return (
    <form action={setActiveBusiness} className="mb-3">
      <label className="mb-1 block px-1 text-[10px] font-bold uppercase tracking-wide text-persimmon-300">
        Managing (super)
      </label>
      <select
        name="businessId"
        defaultValue={activeBusinessId ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-full rounded-[10px] border border-[#4A3A2E] bg-[#33271F] px-2.5 py-2 text-[13px] font-semibold text-white outline-none focus:border-persimmon-400"
      >
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </form>
  );
}

/** Dark merchant sidebar (desktop) + horizontal nav (mobile). */
export function MerchantSidebar({
  business,
  isSuper = false,
  businesses = [],
  activeBusinessId = null,
}: {
  business: SidebarBusiness;
  isSuper?: boolean;
  businesses?: SwitcherBusiness[];
  activeBusinessId?: string | null;
}) {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-[220px] shrink-0 flex-col bg-ink-900 p-4 text-white md:flex">
        <Link href="/" className="mb-5 flex items-center gap-2.5 px-2 pt-2">
          <LogoMark className="size-[30px] rounded-[9px]" />
          <span className="font-display text-lg font-extrabold">Hungeri</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon, exact, color }) => {
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
                <Icon className={cn("size-[19px]", color)} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          {isSuper && businesses.length > 0 && (
            <BusinessSwitcher businesses={businesses} activeBusinessId={activeBusinessId} />
          )}
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
          {isSuper && businesses.length > 0 ? (
            <form action={setActiveBusiness} className="ml-auto">
              <select
                name="businessId"
                defaultValue={activeBusinessId ?? ""}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                aria-label="Managing business"
                className="max-w-[160px] truncate rounded-[9px] border border-[#4A3A2E] bg-[#33271F] px-2 py-1.5 text-[13px] font-semibold text-white outline-none"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </form>
          ) : (
            business && (
              <span className="ml-auto truncate text-sm font-bold text-ink-300">{business.name}</span>
            )
          )}
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map(({ href, label, icon: Icon, exact, color }) => {
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
                <Icon className={cn("size-4", color)} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
