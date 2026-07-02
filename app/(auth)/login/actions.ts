"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Phone-number login WITHOUT verification.
 *
 * There's no SMS/OTP step: a phone number IS the credential. We map the number
 * to a deterministic synthetic email (the users table + signup trigger require a
 * non-null email), create that account on first use, then mint a session using
 * the same admin generateLink → /auth/confirm mechanism as the dev sign-in
 * helper. Same number => same account, every time.
 *
 * NOTE: with no verification, anyone who types a number is signed in as its
 * owner. That's intentional for this MVP; do not ship it to production as-is.
 */

/** Synthetic-email domain for phone accounts (never receives real mail). */
const PHONE_EMAIL_DOMAIN = "phone.hungeri.app";

export type LoginState = { error?: string };

/** Reduce user input to bare digits and sanity-check the length. */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
}

export async function loginWithPhone(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const digits = normalizePhone(String(formData.get("phone") ?? ""));
  const redirectTo = String(formData.get("redirect") || "/") || "/";
  if (!digits) return { error: "Enter a valid phone number." };

  const email = `p${digits}@${PHONE_EMAIL_DOMAIN}`;
  const admin = createAdminClient();

  // Create the account on first sign-in; ignore "already registered" on repeat.
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name: `+${digits}`, phone: digits, role: "consumer" },
  });
  if (createErr && !/exist|registered|already/i.test(createErr.message)) {
    return { error: createErr.message };
  }

  // Mint a one-time token and hand it to /auth/confirm, which sets the session.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    return { error: error?.message ?? "Could not sign you in. Try again." };
  }

  redirect(
    `/auth/confirm?token_hash=${tokenHash}&type=magiclink&redirect=${encodeURIComponent(redirectTo)}`,
  );
}
