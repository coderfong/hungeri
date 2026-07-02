import { clientEnv } from "@/lib/env";

/**
 * Minimal, env-gated error-tracking hook. No-ops (console only) unless a Sentry
 * DSN is configured, so observability is opt-in and adds no cost/dep by default.
 * To wire real Sentry, install @sentry/nextjs and forward from here.
 */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (clientEnv.NEXT_PUBLIC_SENTRY_DSN) {
    // e.g. Sentry.captureException(error, { extra: context })
  }
  console.error("[error]", error, context ?? "");
}
