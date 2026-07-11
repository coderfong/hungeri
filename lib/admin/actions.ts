"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/context";

/**
 * Admin/ops mutations. Every action gates on requireAdmin() and then uses the
 * service-role client: moderation must act across all merchants' data, which the
 * per-merchant RLS deliberately forbids. The requireAdmin() gate is the trust
 * boundary.
 */
type Result = { ok: true } | { ok: false; error: string };

function moderationNote(reason?: string) {
  return reason ? { moderation: { reason, at: new Date().toISOString() } } : undefined;
}

// ── Deal moderation ──────────────────────────────────────────────────────────
export async function approveDeal(id: string): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: deal } = await admin.from("deals").select("end_at").eq("id", id).maybeSingle();
  if (!deal) return { ok: false, error: "Deal not found" };
  if (new Date(deal.end_at).getTime() <= Date.now()) {
    return { ok: false, error: "Deal's end date has already passed — ask the merchant to reschedule." };
  }

  const { error } = await admin.from("deals").update({ status: "live" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/moderation");
  revalidatePath("/");
  return { ok: true };
}

export async function rejectDeal(id: string, reason?: string): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("deals")
    .update({ status: "rejected", source_attribution: moderationNote(reason) ?? null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/moderation");
  return { ok: true };
}

/** Send a deal back to the merchant as a draft with feedback. */
export async function requestChanges(id: string, reason?: string): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("deals")
    .update({ status: "draft", source_attribution: moderationNote(reason) ?? null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/moderation");
  return { ok: true };
}

// ── Businesses ───────────────────────────────────────────────────────────────
const adminBusinessSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  description: z.string().max(600).optional(),
  cuisine_tags: z.array(z.string()).default([]),
  price_level: z.coerce.number().min(1).max(4).optional(),
  website: z.string().url().optional().or(z.literal("")),
  cover_url: z.string().url().optional().or(z.literal("")),
  outlet: z.object({
    address: z.string().min(3, "Address is required"),
    postal_code: z.string().optional(),
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    phone: z.string().optional(),
  }),
});
export type AdminBusinessInput = z.infer<typeof adminBusinessSchema>;

/**
 * Admin creates a business directly (e.g. onboarding a shop that isn't on the
 * platform yet). The admin becomes the owner row (businesses.owner_user_id is
 * NOT NULL); ownership can be transferred when the merchant signs up. Goes live
 * immediately — admins add real shops to show diners.
 */
export async function createBusinessAdmin(
  input: AdminBusinessInput,
): Promise<Result & { slug?: string }> {
  const profile = await requireAdmin();
  const parsed = adminBusinessSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  const admin = createAdminClient();

  let slug =
    d.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "business";
  const { data: existing } = await admin
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: biz, error: bizErr } = await admin
    .from("businesses")
    .insert({
      owner_user_id: profile.id,
      name: d.name,
      slug,
      description: d.description || null,
      cuisine_tags: d.cuisine_tags,
      price_level: d.price_level ?? null,
      website: d.website || null,
      cover_url: d.cover_url || null,
      status: "live",
    })
    .select("id")
    .single();
  if (bizErr || !biz) return { ok: false, error: bizErr?.message ?? "Could not create business" };

  const { error: locErr } = await admin.from("locations").insert({
    business_id: biz.id,
    address: d.outlet.address,
    postal_code: d.outlet.postal_code || null,
    lat: d.outlet.lat,
    lng: d.outlet.lng,
    phone: d.outlet.phone || null,
  });
  if (locErr) return { ok: false, error: locErr.message };

  revalidatePath("/admin/businesses");
  revalidatePath("/");
  return { ok: true, slug };
}

export async function verifyBusiness(id: string, verified: boolean): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("businesses").update({ verified }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/businesses");
  return { ok: true };
}

export async function setBusinessStatusAdmin(
  id: string,
  status: "live" | "draft" | "suspended",
): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("businesses").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/businesses");
  revalidatePath("/");
  return { ok: true };
}

// ── Reports / takedowns ──────────────────────────────────────────────────────
export async function resolveReport(id: string): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("reports")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/reports");
  return { ok: true };
}

/** Take down a reported deal (reject it) and resolve the report in one step. */
export async function takedownDeal(reportId: string, dealId: string): Promise<Result> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error: dErr } = await admin
    .from("deals")
    .update({ status: "rejected", source_attribution: moderationNote("Taken down after report") })
    .eq("id", dealId);
  if (dErr) return { ok: false, error: dErr.message };
  await admin
    .from("reports")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  revalidatePath("/admin/reports");
  revalidatePath("/admin/moderation");
  revalidatePath("/");
  return { ok: true };
}

// ── Curated entry ────────────────────────────────────────────────────────────
const curateSchema = z.object({
  business_id: z.string().uuid(),
  title: z.string().min(3).max(120),
  description: z.string().max(600).optional(),
  deal_type: z.enum([
    "percentage",
    "fixed_amount",
    "bogo",
    "set_menu",
    "freebie",
    "happy_hour",
    "loyalty",
  ]),
  discount_value: z.coerce.number().nonnegative().optional(),
  end_at: z.string().min(1),
  source_url: z.string().url().optional().or(z.literal("")),
  publisher: z.string().optional(),
});
export type CurateInput = z.infer<typeof curateSchema>;

export async function createCuratedDeal(input: CurateInput): Promise<Result> {
  await requireAdmin();
  const parsed = curateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (new Date(d.end_at).getTime() <= Date.now()) {
    return { ok: false, error: "End date must be in the future" };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("deals").insert({
    business_id: d.business_id,
    title: d.title,
    description: d.description || null,
    deal_type: d.deal_type,
    discount_value: d.discount_value ?? null,
    start_at: new Date().toISOString(),
    end_at: new Date(d.end_at).toISOString(),
    status: "live", // admin-curated goes live immediately
    source: "curated",
    source_attribution:
      d.source_url || d.publisher
        ? { url: d.source_url || null, publisher: d.publisher || null, curated_at: new Date().toISOString() }
        : { curated_at: new Date().toISOString() },
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/curate");
  revalidatePath("/");
  return { ok: true };
}
