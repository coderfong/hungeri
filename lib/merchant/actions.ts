"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DealStatus, PlacementTier } from "@/types/database";
import { TIERS } from "@/lib/placements/tiers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { requireBusiness, getMerchantContext, ACTIVE_BUSINESS_COOKIE } from "@/lib/merchant/context";
import {
  onboardingInput,
  businessInput,
  outletInput,
  dealInput,
  type OnboardingInput,
  type BusinessInput,
  type OutletInput,
  type DealInput,
} from "@/lib/merchant/schema";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/** Build a deals.recurring_rule jsonb from the simple toggle (daily window). */
function buildRecurringRule(d: DealInput) {
  if (!d.recurring) return null;
  return d.recurring_rule ?? { freq: "daily" };
}

// ── Onboarding ───────────────────────────────────────────────────────────────
export async function createBusinessWithOutlets(
  input: OnboardingInput,
): Promise<Result<{ businessId: string }>> {
  const parsed = onboardingInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };

  const supabase = await createClient();
  const { business, outlets, uen } = parsed.data;

  // Unique slug.
  let slug = slugify(business.name) || "business";
  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: biz, error: bizErr } = await supabase
    .from("businesses")
    .insert({
      owner_user_id: profile.id,
      name: business.name,
      slug,
      description: business.description || null,
      cuisine_tags: business.cuisine_tags,
      price_level: business.price_level ?? null,
      website: business.website || null,
      logo_url: business.logo_url || null,
      cover_url: business.cover_url || null,
      status: "draft",
      socials: uen ? { uen, verification_requested: true } : {},
    })
    .select("id")
    .single();
  if (bizErr || !biz) return { ok: false, error: bizErr?.message ?? "Could not create business" };

  const { error: locErr } = await supabase.from("locations").insert(
    outlets.map((o) => ({
      business_id: biz.id,
      address: o.address,
      postal_code: o.postal_code || null,
      lat: o.lat,
      lng: o.lng,
      phone: o.phone || null,
    })),
  );
  if (locErr) return { ok: false, error: locErr.message };

  // Promote the owner to the merchant role (needs service role — the self-update
  // role-escalation guard blocks doing this as the user).
  if (profile.role === "consumer") {
    await createAdminClient().from("users").update({ role: "merchant" }).eq("id", profile.id);
  }

  revalidatePath("/dashboard");
  return { ok: true, data: { businessId: biz.id } };
}

// ── Business profile ─────────────────────────────────────────────────────────
export async function updateBusiness(input: BusinessInput): Promise<Result> {
  const parsed = businessInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { business, db: supabase } = await requireBusiness();
  const { error } = await supabase
    .from("businesses")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      cuisine_tags: parsed.data.cuisine_tags,
      price_level: parsed.data.price_level ?? null,
      website: parsed.data.website || null,
      logo_url: parsed.data.logo_url || null,
      cover_url: parsed.data.cover_url || null,
    })
    .eq("id", business.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/settings");
  revalidatePath(`/b/${business.slug}`);
  return { ok: true };
}

/** Toggle the business live/draft (merchant publishing their storefront). */
export async function setBusinessStatus(status: "live" | "draft"): Promise<Result> {
  const { business, db: supabase } = await requireBusiness();
  const { error } = await supabase.from("businesses").update({ status }).eq("id", business.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

// ── Outlets ──────────────────────────────────────────────────────────────────
export async function addOutlet(input: OutletInput): Promise<Result> {
  const parsed = outletInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { business, db: supabase } = await requireBusiness();
  const { error } = await supabase.from("locations").insert({
    business_id: business.id,
    address: parsed.data.address,
    postal_code: parsed.data.postal_code || null,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    phone: parsed.data.phone || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/outlets");
  return { ok: true };
}

export async function deleteOutlet(id: string): Promise<Result> {
  const { business, db: supabase } = await requireBusiness();
  // Scope to the active business (RLS also enforces this for normal merchants).
  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/outlets");
  return { ok: true };
}

// ── Deals ────────────────────────────────────────────────────────────────────
export async function saveDeal(
  input: DealInput,
  opts: { id?: string; publish?: boolean } = {},
): Promise<Result<{ id: string }>> {
  const parsed = dealInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { business, db: supabase } = await requireBusiness();
  const d = parsed.data;

  // Publishing routes through moderation; drafts stay editable. A live end date
  // in the past would be rejected by the DB trigger, so guard here too.
  const status: DealStatus = opts.publish ? "pending_review" : "draft";

  const row = {
    business_id: business.id,
    title: d.title,
    description: d.description || null,
    deal_type: d.deal_type,
    discount_value: d.discount_value ?? null,
    terms: d.terms || null,
    fine_print: d.fine_print || null,
    image_url: d.image_url || null,
    channels: d.channels,
    dietary_tags: d.dietary_tags,
    start_at: new Date(d.start_at).toISOString(),
    end_at: new Date(d.end_at).toISOString(),
    recurring_rule: buildRecurringRule(d),
    redemption_method: d.redemption_method,
    redemption_code: d.redemption_code || null,
    redemption_url: d.redemption_url || null,
    status,
    source: "merchant" as const,
  };

  if (opts.id) {
    const { error } = await supabase.from("deals").update(row).eq("id", opts.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/deals");
    return { ok: true, data: { id: opts.id } };
  }

  const { data, error } = await supabase.from("deals").insert(row).select("id").single();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not save deal" };
  revalidatePath("/dashboard/deals");
  return { ok: true, data: { id: data.id } };
}

export async function deleteDeal(id: string): Promise<Result> {
  const { business, db: supabase } = await requireBusiness();
  const { error } = await supabase
    .from("deals")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/deals");
  return { ok: true };
}

// ── Placements (monetization) ────────────────────────────────────────────────
// Stripe checkout is deferred, so placements activate immediately (free). The
// tier's price is recorded for reporting. featured_placements RLS is admin-only,
// so we verify deal ownership as the merchant, then insert via the admin client
// (the same trust boundary the Stripe webhook would use).
export async function createPlacement(
  dealId: string,
  tier: PlacementTier,
): Promise<Result<{ id: string }>> {
  const { business, db: supabase } = await requireBusiness();

  const { data: deal } = await supabase
    .from("deals")
    .select("id, business_id")
    .eq("id", dealId)
    .maybeSingle();
  if (!deal || deal.business_id !== business.id) {
    return { ok: false, error: "That deal isn't yours" };
  }

  const spec = TIERS[tier];
  const { data: outlet } = await supabase
    .from("locations")
    .select("lat, lng")
    .eq("business_id", business.id)
    .limit(1)
    .maybeSingle();
  const geo_scope = outlet
    ? { lat: outlet.lat, lng: outlet.lng, radius_m: spec.radiusM }
    : null;

  const now = Date.now();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("featured_placements")
    .insert({
      deal_id: dealId,
      tier,
      geo_scope,
      start_at: new Date(now).toISOString(),
      end_at: new Date(now + spec.durationHours * 3_600_000).toISOString(),
      price_cents: spec.priceCents,
      status: "active",
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not activate" };

  revalidatePath("/dashboard/placements");
  revalidatePath("/");
  return { ok: true, data: { id: data.id } };
}

export async function endPlacement(id: string): Promise<Result> {
  const { business } = await requireBusiness();
  const admin = createAdminClient();

  // Verify the placement belongs to one of this merchant's deals.
  const { data: p } = await admin
    .from("featured_placements")
    .select("id, deal_id, deals(business_id)")
    .eq("id", id)
    .maybeSingle();
  const ownerBiz = (p as { deals?: { business_id?: string } } | null)?.deals?.business_id;
  if (!p || ownerBiz !== business.id) return { ok: false, error: "Not your placement" };

  const { error } = await admin
    .from("featured_placements")
    .update({ status: "ended" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/placements");
  revalidatePath("/");
  return { ok: true };
}

/** Onboarding wizard success → straight to the dashboard. */
export async function finishOnboarding(input: OnboardingInput) {
  const res = await createBusinessWithOutlets(input);
  if (res.ok) redirect("/dashboard");
  return res;
}

// ── Super merchant: switch which business is being managed ─────────────────────
export async function setActiveBusiness(formData: FormData): Promise<void> {
  // Only a super merchant may switch; everyone else is pinned to their own.
  const { isSuper } = await getMerchantContext();
  if (!isSuper) redirect("/dashboard");

  const businessId = String(formData.get("businessId") ?? "");
  const cookieStore = await cookies();
  if (businessId) {
    cookieStore.set(ACTIVE_BUSINESS_COOKIE, businessId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  redirect("/dashboard");
}
