"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, LockKeyhole, Phone, Store, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";
import { authenticateMerchant, type MerchantAuthState } from "./actions";

export default function MerchantLoginPage() {
  return (
    <Suspense>
      <MerchantLoginForm />
    </Suspense>
  );
}

function MerchantLoginForm() {
  const params = useSearchParams();
  const intent = params.get("mode") === "signup" ? "signup" : "login";
  const requestedRedirect = params.get("redirect") ?? "";
  const redirectQuery = requestedRedirect
    ? `&redirect=${encodeURIComponent(requestedRedirect)}`
    : "";
  const loginHref = requestedRedirect
    ? `/merchant-login?redirect=${encodeURIComponent(requestedRedirect)}`
    : "/merchant-login";
  const signupHref = `/merchant-login?mode=signup${redirectQuery}`;
  const [state, formAction, pending] = useActionState<MerchantAuthState, FormData>(
    authenticateMerchant,
    {},
  );

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[repeating-linear-gradient(135deg,#FFD9C6_0_14px,#FFE7D8_14px_28px)]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg" />
      </div>

      <div className="relative">
        <div className="mb-7 text-center">
          <LogoMark className="mx-auto mb-5 block size-[60px] rounded-[18px] shadow-[0_10px_24px_rgba(255,90,31,.4)]" />
          <h1 className="font-display text-3xl font-extrabold leading-tight">
            {intent === "signup" ? "Create a merchant account" : "Merchant sign in"}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {intent === "signup"
              ? "Set up your account, then add your business and outlets."
              : "Your merchant portal is protected by your account password."}
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-btn bg-line-soft p-1">
          <Link
            href={loginHref}
            className={`rounded-[9px] px-3 py-2 text-sm font-bold ${intent === "login" ? "bg-surface text-ink-900 shadow-e1" : "text-muted"}`}
          >
            Sign in
          </Link>
          <Link
            href={signupHref}
            className={`rounded-[9px] px-3 py-2 text-sm font-bold ${intent === "signup" ? "bg-surface text-ink-900 shadow-e1" : "text-muted"}`}
          >
            Create account
          </Link>
        </div>

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="intent" value={intent} />
          <input type="hidden" name="redirect" value={requestedRedirect} />
          <label htmlFor="merchant-phone" className="sr-only">Phone number</label>
          <div className="flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-line bg-surface px-4 focus-within:border-persimmon-500 focus-within:ring-4 focus-within:ring-persimmon-100">
            <Phone className="size-[18px] text-muted" aria-hidden />
            <input
              id="merchant-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="e.g. 9123 4567"
              className="w-full bg-transparent py-3.5 text-[15px] outline-none"
            />
          </div>
          <label htmlFor="merchant-password" className="sr-only">Password</label>
          <div className="flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-line bg-surface px-4 focus-within:border-persimmon-500 focus-within:ring-4 focus-within:ring-persimmon-100">
            <LockKeyhole className="size-[18px] text-muted" aria-hidden />
            <input
              id="merchant-password"
              name="password"
              type="password"
              autoComplete={intent === "signup" ? "new-password" : "current-password"}
              minLength={8}
              required
              placeholder="Password (8+ characters)"
              className="w-full bg-transparent py-3.5 text-[15px] outline-none"
            />
          </div>
          {intent === "signup" ? (
            <>
              <label htmlFor="merchant-confirm-password" className="sr-only">Confirm password</label>
              <div className="flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-line bg-surface px-4 focus-within:border-persimmon-500 focus-within:ring-4 focus-within:ring-persimmon-100">
                <LockKeyhole className="size-[18px] text-muted" aria-hidden />
                <input
                  id="merchant-confirm-password"
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  placeholder="Confirm password"
                  className="w-full bg-transparent py-3.5 text-[15px] outline-none"
                />
              </div>
            </>
          ) : null}
          <Button type="submit" size="lg" disabled={pending} className="w-full">
            {intent === "signup" ? (
              <UserPlus className="size-[18px]" aria-hidden />
            ) : (
              <Store className="size-[18px]" aria-hidden />
            )}
            {pending
              ? intent === "signup" ? "Creating account…" : "Signing in…"
              : intent === "signup" ? "Create account & onboard" : "Open merchant dashboard"}
          </Button>
        </form>

        {state.error ? (
          <p className="mt-3 text-center text-sm font-semibold text-error" aria-live="polite">
            {state.error}
          </p>
        ) : null}

        <div className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[15px] font-bold text-persimmon-500 hover:underline">
            Diner sign in
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </main>
  );
}
