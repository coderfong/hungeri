import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDealsNear } from "@/lib/deals/near";

/**
 * GET /api/deals/near?lat=&lng=&radius= → deals within radius (m) of a point,
 * nearest first. Used by the client near-me map/list after geolocation.
 */
const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(50_000).default(3000),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });

  const { lat, lng, radius } = parsed.data;
  try {
    const deals = await getDealsNear(lat, lng, radius);
    return NextResponse.json({ deals });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "near_failed" },
      { status: 500 },
    );
  }
}
