import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import type { BusinessRow, Tables } from "@/types/database";

export type MerchantContext = {
  profile: Tables<"users">;
  business: BusinessRow | null;
};

/**
 * Loads the signed-in user's profile + the business they own (MVP: one business
 * per merchant). Redirects to login if unauthenticated.
 */
export async function getMerchantContext(): Promise<MerchantContext> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/dashboard");

  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_user_id", profile.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return { profile, business: business ?? null };
}

/** Require an owned business; bounce to onboarding if none exists yet. */
export async function requireBusiness(): Promise<{
  profile: Tables<"users">;
  business: BusinessRow;
}> {
  const { profile, business } = await getMerchantContext();
  if (!business) redirect("/dashboard/onboarding");
  return { profile, business };
}
