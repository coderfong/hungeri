import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Static shop-QR landing. A phone camera scanning the printed QR opens
 * /r/{qr_token}; we resolve the business and send them to its Hungeri page so
 * they can see the shop's deals. (The in-app scanner reads the same token to
 * redeem — see /api/redemptions.)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const { origin } = new URL(request.url);

  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("slug")
    .eq("qr_token", token)
    .maybeSingle();

  return NextResponse.redirect(`${origin}${data?.slug ? `/b/${data.slug}` : "/"}`);
}
