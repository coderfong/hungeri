import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";
import { runScheduledJobs } from "@/lib/notifications/jobs";

/**
 * Scheduled jobs endpoint. Protect with CRON_SECRET (sent as `Authorization:
 * Bearer <secret>` — Vercel Cron does this automatically when CRON_SECRET is
 * set, or call it from pg_cron via pg_net). If no secret is configured, only
 * runnable in development.
 */
export const dynamic = "force-dynamic";

async function handle(request: NextRequest) {
  const env = getServerEnv();
  const auth = request.headers.get("authorization");

  if (env.CRON_SECRET) {
    if (auth !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 401 });
  }

  try {
    const result = await runScheduledJobs();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "cron_failed" },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
