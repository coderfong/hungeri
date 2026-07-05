import Image from "next/image";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

/**
 * Default profile picture for a user, keyed on their role. Each role has a
 * distinct on-brand avatar (see /public/avatars): consumer = persimmon person,
 * merchant = charcoal storefront, admin = deep persimmon→ink shield.
 */
const AVATAR: Record<UserRole, string> = {
  consumer: "/avatars/consumer.svg",
  merchant: "/avatars/merchant.svg",
  admin: "/avatars/admin.svg",
};

export function RoleAvatar({
  role,
  size = 64,
  className,
}: {
  role: UserRole;
  /** Rendered width/height in px. */
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={AVATAR[role] ?? AVATAR.consumer}
      alt=""
      width={size}
      height={size}
      className={cn("rounded-full", className)}
      priority
    />
  );
}
