"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { isSuperMerchant } from "@/config/role-phones";
import { createAdminClient } from "@/lib/supabase/admin";

export type SetImageResult = { ok: boolean; error?: string };

/**
 * Set (or clear) the image on a shop's headline deal. Gated to admins and
 * super-merchants, who may edit any business — so it uses the service-role
 * client to bypass per-owner RLS. Wired to the homepage drag-and-drop editor.
 */
export async function setShopHeadlineImage(
  dealId: string,
  imageUrl: string,
): Promise<SetImageResult> {
  const profile = await getCurrentProfile();
  const privileged =
    !!profile && (profile.role === "admin" || isSuperMerchant(profile.email));
  if (!privileged) return { ok: false, error: "You don't have permission to do that." };
  if (!dealId) return { ok: false, error: "Missing deal." };

  const { error } = await createAdminClient()
    .from("deals")
    .update({ image_url: imageUrl || null })
    .eq("id", dealId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/near-me");
  return { ok: true };
}
