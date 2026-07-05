import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, LogOut, Store, ShieldAlert } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { RoleAvatar } from "@/components/role-avatar";

export const metadata = { title: "Profile" };

export default async function AccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/account");

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pt-6">
      <div className="mb-6 flex items-center gap-4">
        <RoleAvatar role={profile.role} size={64} className="size-16 shrink-0 shadow-sm" />
        <div>
          <h1 className="font-display text-2xl font-extrabold">
            {profile.display_name ?? "Your profile"}
          </h1>
          <p className="text-sm text-muted">{profile.email}</p>
          <span className="mt-1 inline-block rounded-full bg-line-soft px-2.5 py-0.5 text-xs font-bold capitalize text-ink-500">
            {profile.role}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Link
          href="/saved"
          className="flex items-center gap-3 rounded-card border border-line-soft bg-surface px-4 py-3.5 font-semibold hover:border-ink-300"
        >
          <Heart className="size-5 text-persimmon-500" aria-hidden /> Saved deals
        </Link>
        {(profile.role === "merchant" || profile.role === "admin") && (
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-card border border-line-soft bg-surface px-4 py-3.5 font-semibold hover:border-ink-300"
          >
            <Store className="size-5 text-persimmon-500" aria-hidden /> Merchant dashboard
          </Link>
        )}
        {profile.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-card border border-line-soft bg-surface px-4 py-3.5 font-semibold hover:border-ink-300"
          >
            <ShieldAlert className="size-5 text-persimmon-500" aria-hidden /> Admin console
          </Link>
        )}
      </div>

      <form action="/auth/signout" method="post" className="mt-6">
        <Button type="submit" variant="outline" className="w-full">
          <LogOut className="size-[18px]" aria-hidden /> Sign out
        </Button>
      </form>
    </main>
  );
}
