import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

/**
 * Server-side auth helpers. Always uses getUser() (revalidates the JWT) rather
 * than getSession() so route protection can't be spoofed via a stale cookie.
 */

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Returns the authed user joined with their public.users profile (incl. role). */
export async function getCurrentProfile(): Promise<Tables<"users"> | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
}
