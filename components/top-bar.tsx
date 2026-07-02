import Link from "next/link";
import { Search, Heart, MapPin, ChevronDown } from "lucide-react";
import { Logo } from "@/components/logo";

export type ShellUser = { display_name: string | null; email: string } | null;

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
      <Link
        href="/search"
        className="mx-auto flex max-w-[440px] flex-1 items-center gap-2.5 rounded-btn border-[1.5px] border-line bg-bg px-3.5 py-2.5 text-sm text-muted hover:border-ink-300"
      >
        <Search className="size-[18px]" aria-hidden />
        Search deals, food, places…
      </Link>
      <div className="flex items-center gap-3.5">
        <Link href="/saved" aria-label="Saved deals" className="text-ink-500 hover:text-urgent">
          <Heart className="size-[22px]" aria-hidden />
        </Link>
        {user ? (
          <Link
            href="/account"
            aria-label="Your profile"
            className="flex size-9 items-center justify-center rounded-full bg-persimmon-200 font-display font-bold text-persimmon-700"
          >
            {(user.display_name ?? user.email).charAt(0).toUpperCase()}
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
