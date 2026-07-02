import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Report a deal (abuse / inaccurate / expired-but-live). Anyone may report;
 * reporter_id attaches if signed in. Admins triage in the moderation queue (M6).
 */
const bodySchema = z.object({
  deal_id: z.string().uuid(),
  reason: z.string().min(3).max(500),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("reports").insert({
    deal_id: parsed.data.deal_id,
    reporter_id: user?.id ?? null,
    reason: parsed.data.reason,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
