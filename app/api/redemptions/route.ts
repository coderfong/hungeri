import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Redeem a deal by scanning the shop's static QR.
 *
 * The client posts the scanned `shop_token` (the business's qr_token). We verify
 * it belongs to the deal's business — proving the customer is physically at the
 * outlet — then record the redemption (authed users only; RLS requires
 * consumer_id = auth.uid). Anonymous scans still validate but aren't recorded.
 */
const bodySchema = z.object({
  deal_id: z.string().uuid(),
  shop_token: z.string().uuid(),
  location_id: z.string().uuid().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const supabase = await createClient();

  // The deal + its business' QR token.
  const { data: deal } = await supabase
    .from("deals")
    .select("id, title, redemption_method, businesses(qr_token, name)")
    .eq("id", parsed.data.deal_id)
    .maybeSingle();
  if (!deal) return NextResponse.json({ error: "deal_not_found" }, { status: 404 });

  const biz = (Array.isArray(deal.businesses) ? deal.businesses[0] : deal.businesses) as
    | { qr_token: string; name: string }
    | null;

  if (!biz || biz.qr_token !== parsed.data.shop_token) {
    return NextResponse.json(
      { error: "wrong_shop", message: "That QR isn't for this deal's shop." },
      { status: 400 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The consumer's phone (shown to staff on the redeemed screen so they can
  // confirm who's redeeming). Phone-login stores it in the auth user's metadata.
  const meta = (user?.user_metadata ?? {}) as { phone?: string; display_name?: string };
  const phone: string | null = user ? meta.phone ?? meta.display_name ?? null : null;
  if (user) {
    await supabase.from("redemptions").insert({
      deal_id: parsed.data.deal_id,
      consumer_id: user.id,
      method: deal.redemption_method,
      location_id: parsed.data.location_id ?? null,
    });
  }

  return NextResponse.json({
    ok: true,
    recorded: !!user,
    shop: biz.name,
    deal: deal.title,
    phone,
  });
}
