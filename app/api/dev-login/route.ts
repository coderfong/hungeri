import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * DEV-ONLY one-click sign-in for the seeded demo accounts.
 *
 * Generates a fresh magic-link token (admin API) AND verifies it in the same
 * request, setting the SSR session cookie — so the URL is stable and reusable,
 * never goes stale, and needs no email (sidesteps the email rate limit).
 *
 * Hard-guarded: disabled in production, and only the fake @hungeri.test demo
 * accounts are allowed, so this can never impersonate a real user.
 *
 *   /api/dev-login?as=merchant   (or consumer | admin)
 *   /api/dev-login?email=merchant@hungeri.test&redirect=/dashboard
 */
const ACCOUNTS: Record<string, { email: string; redirect: string }> = {
  consumer: { email: "consumer@hungeri.test", redirect: "/" },
  merchant: { email: "merchant@hungeri.test", redirect: "/dashboard" },
  admin: { email: "admin@hungeri.test", redirect: "/admin" },
};

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 404 });
  }

  const { searchParams, origin } = new URL(request.url);
  const as = searchParams.get("as");
  const preset = as ? ACCOUNTS[as] : null;
  const email = preset?.email ?? searchParams.get("email") ?? "";
  const redirect = searchParams.get("redirect") ?? preset?.redirect ?? "/";

  if (!email.endsWith("@hungeri.test")) {
    return NextResponse.json(
      { error: "only @hungeri.test demo accounts are allowed" },
      { status: 400 },
    );
  }

  // 1) Mint a fresh token (admin API — not the email path, so no rate limit).
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data?.properties?.hashed_token) {
    return NextResponse.json(
      { error: error?.message ?? "could not generate link" },
      { status: 500 },
    );
  }

  // 2) Verify it as this request's user → sets the auth cookie.
  const supabase = await createClient();
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: data.properties.hashed_token,
  });
  if (verifyErr) {
    return NextResponse.json({ error: verifyErr.message }, { status: 500 });
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
