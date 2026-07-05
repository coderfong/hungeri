"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { isSuperMerchant } from "@/config/role-phones";
import { createAdminClient } from "@/lib/supabase/admin";

export type SpotlightResult = { ok: boolean; error?: string };

/**
 * Add/remove a business from the homepage featured carousel. Admin & super-
 * merchant only; uses the service-role client (they may curate any business).
 * Requires migration 0011_business_spotlight.sql.
 */
export async function setSpotlight(businessId: string, on: boolean): Promise<SpotlightResult> {
  const profile = await getCurrentProfile();
  const privileged =
    !!profile && (profile.role === "admin" || isSuperMerchant(profile.email));
  if (!privileged) return { ok: false, error: "You don't have permission to do that." };
  if (!businessId) return { ok: false, error: "Missing business." };

  const { error } = await createAdminClient()
    .from("businesses")
    .update({ spotlight: on })
    .eq("id", businessId);
  if (error) {
    return {
      ok: false,
      error: /column .*spotlight/i.test(error.message)
        ? "Spotlight isn't set up yet — apply migration 0011."
        : error.message,
    };
  }

  revalidatePath("/");
  return { ok: true };
}
