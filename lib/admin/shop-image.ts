"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { isSuperMerchant } from "@/config/role-phones";
import { createAdminClient } from "@/lib/supabase/admin";

export type SetImageResult = { ok: boolean; error?: string };

/**
 * Set (or clear) a shop's cover image. This is a BUSINESS-level cover, distinct
 * from any individual deal's image — so it only appears as the shop card cover,
 * not on every deal thumbnail. Gated to admins and super-merchants (who may edit
 * any business), so it uses the service-role client to bypass per-owner RLS.
 */
export async function setShopCover(
  businessId: string,
  imageUrl: string,
): Promise<SetImageResult> {
  const profile = await getCurrentProfile();
  const privileged =
    !!profile && (profile.role === "admin" || isSuperMerchant(profile.email));
  if (!privileged) return { ok: false, error: "You don't have permission to do that." };
  if (!businessId) return { ok: false, error: "Missing business." };

  const { error } = await createAdminClient()
    .from("businesses")
    .update({ cover_url: imageUrl || null })
    .eq("id", businessId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/near-me");
  return { ok: true };
}
