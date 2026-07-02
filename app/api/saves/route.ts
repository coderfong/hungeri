import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Save / unsave a deal. Auth required (RLS also enforces consumer_id = auth.uid).
 * Body: { deal_id: uuid }. Returns { saved: boolean }.
 */
const bodySchema = z.object({ deal_id: z.string().uuid() });

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { error } = await supabase
    .from("saves")
    .upsert(
      { consumer_id: user.id, deal_id: parsed.data.deal_id },
      { onConflict: "consumer_id,deal_id", ignoreDuplicates: true },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ saved: true });
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { error } = await supabase
    .from("saves")
    .delete()
    .eq("consumer_id", user.id)
    .eq("deal_id", parsed.data.deal_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ saved: false });
}
