import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Just the Hungeri "H" fork mark (no wordmark, no link). The logo art sits on a
 * white tile so it reads on any background. Pass sizing/rounding via className.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative shrink-0 overflow-hidden bg-white", className)}>
      <Image src="/logo.jpg" alt="" fill sizes="60px" className="object-contain" priority />
    </span>
  );
}

/** Hungeri wordmark + the persimmon bitten-"H" fork mark. */
export function Logo({
  size = "md",
  withWordmark = true,
}: {
  size?: "sm" | "md";
  withWordmark?: boolean;
}) {
  const box = size === "sm" ? "size-[34px] rounded-[10px]" : "size-11 rounded-[13px]";
  const word = size === "sm" ? "text-[21px]" : "text-[26px]";
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Hungeri home">
      <LogoMark className={box} />
      {withWordmark && (
        <span className={cn("font-display font-extrabold tracking-tight", word)}>
          Hungeri
        </span>
      )}
    </Link>
  );
}
