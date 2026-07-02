import { createClient } from "@/lib/supabase/server";

/** Deal ids the current user has saved. Empty for anonymous visitors. */
export async function getSavedDealIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from("saves")
    .select("deal_id")
    .eq("consumer_id", user.id);
  return new Set((data ?? []).map((r) => r.deal_id));
}
