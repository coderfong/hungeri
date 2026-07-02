import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/context";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Takedown endpoint for ingested (partner/scraped) or any deal. Admin-only.
 * Accepts a deal_id or a source URL (matches deals.source_attribution->>url).
 * Sets matching deals to 'rejected' so they leave all public surfaces.
 */
const bodySchema = z
  .object({
    deal_id: z.string().uuid().optional(),
    source_url: z.string().url().optional(),
  })
  .refine((b) => b.deal_id || b.source_url, { message: "deal_id or source_url required" });

export async function POST(request: NextRequest) {
  await requireAdmin(); // redirects non-admins
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const admin = createAdminClient();
  const patch = { status: "rejected" as const };
  const query = admin.from("deals").update(patch);

  const { data, error } = parsed.data.deal_id
    ? await query.eq("id", parsed.data.deal_id).select("id")
    : await query.eq("source_attribution->>url", parsed.data.source_url!).select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, removed: data?.length ?? 0 });
}
