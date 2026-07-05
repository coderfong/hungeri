"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/context";
import type { UserRole } from "@/types/database";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Change a user's role (admin-only). Uses the admin's SESSION client — not the
 * service-role client — because the set_user_role RPC is SECURITY DEFINER and
 * checks is_admin(), which needs the caller's auth.uid(). Requires migration
 * 0010_admin_promote_role.sql.
 */
async function setUserRole(userId: string, role: UserRole): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_role", { target: userId, new_role: role });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}

/** Form action: promote a consumer to merchant. */
export async function upgradeToMerchant(formData: FormData): Promise<void> {
  const userId = String(formData.get("userId") ?? "");
  if (userId) await setUserRole(userId, "merchant");
  revalidatePath("/admin/users");
}
