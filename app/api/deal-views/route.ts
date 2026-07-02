import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Log a deal view for merchant analytics (M6). Anonymous views are allowed
 * (consumer_id null); authed views attach the user. RLS permits the insert.
 */
const bodySchema = z.object({
  deal_id: z.string().uuid(),
  source: z.enum(["feed", "map", "featured", "search"]).default("feed"),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("deal_views").insert({
    deal_id: parsed.data.deal_id,
    consumer_id: user?.id ?? null,
    source: parsed.data.source,
  });
  // Fire-and-forget: never block the page on analytics.
  return NextResponse.json({ ok: true });
}
