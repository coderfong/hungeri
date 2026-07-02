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
