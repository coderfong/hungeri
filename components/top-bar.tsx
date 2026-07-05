import Link from "next/link";
import { Heart, MapPin, ChevronDown } from "lucide-react";
import { Logo } from "@/components/logo";
import { RoleAvatar } from "@/components/role-avatar";
import { SearchBox } from "@/components/search-box";
import type { UserRole } from "@/types/database";

export type ShellUser = { display_name: string | null; email: string; role: UserRole } | null;

/** Desktop top bar (md+). On mobile each screen renders its own header. */
export function TopBar({ user, location = "Singapore" }: { user: ShellUser; location?: string }) {
  return (
    <header className="sticky top-0 z-40 hidden items-center gap-5 border-b border-line-soft bg-surface px-7 py-4 md:flex">
      <Logo size="sm" />
      <Link
        href="/near-me"
        className="ml-2 flex items-center gap-1.5 text-sm font-bold hover:text-persimmon-600"
      >
        <MapPin className="size-[17px] text-persimmon-500" aria-hidden />
        {location}
        <ChevronDown className="size-[15px] text-muted" aria-hidden />
      </Link>
      <div className="mx-auto w-full max-w-[440px]">
        <SearchBox variant="bar" />
      </div>
      <div className="flex items-center gap-3.5">
        <Link href="/saved" aria-label="Saved deals" className="text-ink-500 hover:text-urgent">
          <Heart className="size-[22px]" aria-hidden />
        </Link>
        {user ? (
          <Link href="/account" aria-label="Your profile" className="shrink-0">
            <RoleAvatar role={user.role} size={36} className="size-9" />
          </Link>
        ) : (
          <Link href="/login" className="text-sm font-bold text-persimmon-500 hover:underline">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
