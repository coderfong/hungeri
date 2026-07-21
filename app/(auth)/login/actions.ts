"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { roleForPhone, phoneEmail } from "@/config/role-phones";
import type { UserRole } from "@/types/database";
import { normalizePhone, safeInternalRedirect } from "@/lib/phone-auth";

/**
 * Phone-number login WITHOUT verification.
 *
 * There's no SMS/OTP step: a phone number IS the credential. We map the number
 * to a deterministic synthetic email (the users table + signup trigger require a
 * non-null email), create that account on first use, then mint a one-time
 * magiclink token (admin generateLink) and immediately verify it with the
 * cookie-bound client to establish the session in this action's response.
 * Same number => same account, every time.
 *
 * Role assignment: a few fixed numbers map to merchant/admin (see role-phones);
 * everyone else is a consumer. The role is set when the account is first created
 * (the signup trigger reads it from metadata) because a DB trigger forbids
 * changing a role afterwards.
 *
 * NOTE: with no verification, anyone who types a number is signed in as its
 * owner. That's intentional for this MVP; do not ship it to production as-is.
 */

export type LoginState = { error?: string; merchantAccount?: boolean };

/** Where each role lands by default when no explicit redirect was requested. */
function homeForRole(role: UserRole): string {
  return role === "admin" ? "/admin" : role === "merchant" ? "/dashboard" : "/";
}

export async function loginWithPhone(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const digits = normalizePhone(String(formData.get("phone") ?? ""));
  const requested = String(formData.get("redirect") || "").trim();
  if (!digits) return { error: "Enter a valid phone number." };

  const role = roleForPhone(digits);
  const email = phoneEmail(digits);

  // All auth work is wrapped so a config problem (e.g. a missing service-role
  // key on the server) surfaces as a visible message instead of an unhandled
  // 500 that leaves the form silently stuck. The redirect() below must stay
  // OUTSIDE this try — it signals success by throwing NEXT_REDIRECT.
  let ok = false;
  let accountRole = role;
  try {
    const admin = createAdminClient();

    // Merchant accounts must use their password-backed portal, including
    // self-onboarded numbers that are not present in the legacy allowlist.
    const { data: existingProfile } = await admin
      .from("users")
      .select("role")
      .eq("email", email)
      .maybeSingle();
    if (role === "merchant" || existingProfile?.role === "merchant") {
      return {
        error: "This is a merchant account. Sign in through the merchant portal.",
        merchantAccount: true,
      };
    }

    accountRole = (existingProfile?.role ?? role) as UserRole;

    // Create the account on first sign-in; the signup trigger reads the role
    // from metadata. On repeat logins it already exists (role stays as first set).
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { display_name: digits, phone: digits, role: accountRole },
    });
    if (createErr && !/exist|registered|already/i.test(createErr.message)) {
      return { error: createErr.message };
    }

    // Mint a one-time token, then establish the session HERE by verifying it
    // with the cookie-bound client so the auth cookies are written into THIS
    // action's response. Previously we redirected to the /auth/confirm route
    // handler to do the verify, but that hop is followed by the client router
    // and its Set-Cookie is dropped — leaving protected pages (e.g. /dashboard)
    // unauthenticated and bouncing straight back to /login.
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (error) return { error: error.message };
    const tokenHash = data?.properties?.hashed_token;
    if (!tokenHash) return { error: "Could not sign you in. Try again." };

    const supabase = await createClient();
    const { error: otpErr } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });
    if (otpErr) return { error: otpErr.message };
    ok = true;
  } catch (err) {
    console.error("loginWithPhone: auth failed", err);
    return { error: "Sign-in is temporarily unavailable. Please try again shortly." };
  }

  if (!ok) return { error: "Could not sign you in. Try again." };

  const redirectTo = safeInternalRedirect(requested, homeForRole(accountRole));
  redirect(redirectTo);
}
