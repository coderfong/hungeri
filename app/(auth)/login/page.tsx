"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Phone, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";
import { loginWithPhone, type LoginState } from "./actions";

/**
 * Login: phone number, no verification (see ./actions). Browsing Hungeri never
 * requires auth; saving deals does.
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
  const params = useSearchParams();
  // Empty when no explicit target: the phone action then routes by role
  // (admin → /admin, merchant → /dashboard, consumer → /).
  const requestedRedirect = params.get("redirect") ?? "";

  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginWithPhone,
    {},
  );

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      {/* warm hero wash */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[repeating-linear-gradient(135deg,#FFD9C6_0_14px,#FFE7D8_14px_28px)]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg" />
      </div>

      <div className="relative">
        <div className="mb-7 text-center">
          <LogoMark className="mx-auto mb-5 block size-[60px] rounded-[18px] shadow-[0_10px_24px_rgba(255,90,31,.4)]" />
          <h1 className="font-display text-3xl font-extrabold leading-tight">Diner sign in</h1>
          <p className="mt-2 text-sm text-ink-500">
            Save and redeem the best food deals with just your phone number.
          </p>
        </div>

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="redirect" value={requestedRedirect} />
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
            {pending ? "Signing in…" : "Continue as diner"}
          </Button>
        </form>

        {state.error && (
          <p className="mt-3 text-center text-sm text-error">{state.error}</p>
        )}

        <div className="mt-5 border-t border-line pt-5 text-center">
          <Link
            href="/merchant-login"
            className="inline-flex items-center gap-2 rounded-btn border-[1.5px] border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink-700 hover:border-persimmon-300"
          >
            <Store className="size-4 text-persimmon-500" aria-hidden />
            Merchant sign in
          </Link>
        </div>

        <div className="mt-4 text-center">
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
