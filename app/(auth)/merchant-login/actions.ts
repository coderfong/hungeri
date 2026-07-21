"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { phoneEmail, roleForPhone } from "@/config/role-phones";
import { normalizePhone, safeInternalRedirect } from "@/lib/phone-auth";

export type MerchantAuthState = { error?: string };

export async function authenticateMerchant(
  _prev: MerchantAuthState,
  formData: FormData,
): Promise<MerchantAuthState> {
  const intent = String(formData.get("intent") ?? "login");
  const digits = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const requested = String(formData.get("redirect") ?? "");

  if (!digits) return { error: "Enter a valid phone number." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (intent === "signup" && password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  if (roleForPhone(digits) === "admin") {
    return { error: "Admin accounts cannot be registered as merchants." };
  }

  const email = phoneEmail(digits);
  try {
    if (intent === "signup") {
      const admin = createAdminClient();
      const { data: existingProfile } = await admin
        .from("users")
        .select("id, role")
        .eq("email", email)
        .maybeSingle();

      if (existingProfile) {
        // Legacy allowlisted merchants predate password login. Let those known
        // accounts set their first password; arbitrary existing accounts cannot
        // be claimed through this flow.
        if (existingProfile.role !== "merchant" || roleForPhone(digits) !== "merchant") {
          return { error: "An account already uses this phone number. Sign in instead." };
        }
        const { error } = await admin.auth.admin.updateUserById(existingProfile.id, {
          password,
          user_metadata: { display_name: digits, phone: digits, role: "merchant" },
        });
        if (error) return { error: error.message };
      } else {
        const { error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            display_name: digits,
            phone: digits,
            role: "merchant",
          },
        });
        if (error) {
          if (/exist|registered|already/i.test(error.message)) {
            return { error: "An account already uses this phone number. Sign in instead." };
          }
          return { error: error.message };
        }
      }
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return {
        error:
          intent === "signup"
            ? "Your account was created, but sign-in failed. Try signing in."
            : "Incorrect phone number or password.",
      };
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profile?.role !== "merchant") {
      await supabase.auth.signOut();
      return { error: "This phone number is not registered as a merchant." };
    }
  } catch (error) {
    console.error("authenticateMerchant: auth failed", error);
    return { error: "Merchant sign-in is temporarily unavailable. Please try again shortly." };
  }

  redirect(safeInternalRedirect(requested, "/dashboard"));
}
