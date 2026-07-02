import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import type { Tables } from "@/types/database";

/** Require an admin. Bounces non-admins home, unauthenticated users to login. */
export async function requireAdmin(): Promise<Tables<"users">> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/admin");
  if (profile.role !== "admin") redirect("/");
  return profile;
}
