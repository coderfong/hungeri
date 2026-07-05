import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { isSuperMerchant } from "@/config/role-phones";
import type { BusinessRow, Database, Tables } from "@/types/database";

/** Cookie holding the business a super merchant is currently managing. */
export const ACTIVE_BUSINESS_COOKIE = "hungeri_active_business";

export type MerchantDb = SupabaseClient<Database>;

export type MerchantContext = {
  profile: Tables<"users">;
  /** The business being managed (owned merchant) or currently selected (super). */
  business: BusinessRow | null;
  /** True when the signed-in account may manage ANY business. */
  isSuper: boolean;
  /**
   * The client to read/write merchant data with. For a super merchant this is
   * the service-role client (so it can act on businesses it doesn't own); for a
   * normal merchant it's the RLS-scoped user session (ownership enforced).
   */
  db: MerchantDb;
};

/**
 * Loads the signed-in user's merchant context.
 *
 * - Normal merchant: their single owned business, via the RLS-scoped client.
 * - Super merchant: any business — the one named by the active-business cookie,
 *   else the first business — via the service-role client.
 *
 * Redirects to login if unauthenticated.
 */
export async function getMerchantContext(): Promise<MerchantContext> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/dashboard");

  const isSuper = isSuperMerchant(profile.email);

  // Role gate: the dashboard is merchant-only. Anyone else who lands here (e.g.
  // an admin or consumer who followed a /dashboard link, or was redirected to
  // /login?redirect=/dashboard and signed in) is sent to their own home instead
  // of being funneled into merchant onboarding.
  if (profile.role !== "merchant" && !isSuper) {
    redirect(profile.role === "admin" ? "/admin" : "/");
  }

  if (isSuper) {
    const db = createAdminClient();
    const activeId = (await cookies()).get(ACTIVE_BUSINESS_COOKIE)?.value;
    let business: BusinessRow | null = null;
    if (activeId) {
      const { data } = await db.from("businesses").select("*").eq("id", activeId).maybeSingle();
      business = data ?? null;
    }
    if (!business) {
      const { data } = await db
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      business = data ?? null;
    }
    return { profile, business, isSuper, db };
  }

  const db = await createClient();
  const { data: business } = await db
    .from("businesses")
    .select("*")
    .eq("owner_user_id", profile.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return { profile, business: business ?? null, isSuper, db };
}

/** Require a business to manage; bounce to onboarding if there's none. */
export async function requireBusiness(): Promise<{
  profile: Tables<"users">;
  business: BusinessRow;
  isSuper: boolean;
  db: MerchantDb;
}> {
  const ctx = await getMerchantContext();
  if (!ctx.business) redirect("/dashboard/onboarding");
  return { profile: ctx.profile, business: ctx.business, isSuper: ctx.isSuper, db: ctx.db };
}

/** Every business, for the super-merchant switcher. Service-role (bypasses RLS). */
export async function listAllBusinesses(): Promise<
  { id: string; name: string; slug: string }[]
> {
  const { data } = await createAdminClient()
    .from("businesses")
    .select("id, name, slug")
    .order("name", { ascending: true });
  return data ?? [];
}
