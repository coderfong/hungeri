"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { clientEnv } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { loginWithPhone, type LoginState } from "./actions";

/**
 * Login: phone number, no verification (see ./actions). Google OAuth remains as
 * an alternative. Browsing Hungeri never requires auth; saving deals does.
 */
export default function LoginPage() {
  // useSearchParams must live under a Suspense boundary for prerendering.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const supabase = createClient();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/";

  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginWithPhone,
    {},
  );

  async function signInWithGoogle() {
    const callback = `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback },
    });
  }

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      {/* warm hero wash */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[repeating-linear-gradient(135deg,#FFD9C6_0_14px,#FFE7D8_14px_28px)]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg" />
      </div>

      <div className="relative">
        <div className="mb-7 text-center">
          <span className="mx-auto mb-5 flex size-[60px] items-center justify-center rounded-[18px] bg-persimmon-500 shadow-[0_10px_24px_rgba(255,90,31,.4)]">
            <span
              className="size-6 rounded-full border-[3.5px] border-white"
              style={{ borderBottomColor: "transparent", transform: "rotate(45deg)" }}
              aria-hidden
            />
          </span>
          <h1 className="font-display text-3xl font-extrabold leading-tight">
            The good deals,
            <br />
            before they&apos;re gone
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Enter your phone number to sign in — no password, no code.
          </p>
        </div>

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="redirect" value={redirectTo} />
          <label htmlFor="phone" className="sr-only">
            Phone number
          </label>
          <div className="flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-line bg-surface px-4 focus-within:border-persimmon-500 focus-within:ring-4 focus-within:ring-persimmon-100">
            <Phone className="size-[18px] text-muted" aria-hidden />
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="e.g. 9123 4567"
              className="w-full bg-transparent py-3.5 text-[15px] outline-none"
            />
          </div>
          <Button type="submit" size="lg" disabled={pending} className="w-full">
            <Phone className="size-[18px]" aria-hidden />
            {pending ? "Signing in…" : "Continue"}
          </Button>
        </form>

        {state.error && (
          <p className="mt-3 text-center text-sm text-error">{state.error}</p>
        )}

        <div className="my-5 flex items-center gap-3 text-xs font-semibold text-muted">
          <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
        </div>

        <Button variant="outline" size="lg" onClick={signInWithGoogle} className="w-full">
          Continue with Google
        </Button>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[15px] font-bold text-persimmon-500 hover:underline"
          >
            Browse without signing in
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </main>
  );
}
