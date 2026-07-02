/**
 * Dev-only: mint one-click sign-in links for the seeded demo accounts.
 *
 * The demo accounts use fake @hungeri.test emails, so magic-link emails never
 * arrive. This uses the admin API to generate a token_hash and prints a local
 * URL that hits our /auth/confirm route (verifyOtp → sets the SSR session cookie).
 *
 *   npm run dev          # in one terminal (server must be running)
 *   npm run dev:link     # in another — click a printed link in your browser
 *
 * Optional arg: an email + redirect, e.g. `npm run dev:link merchant@hungeri.test /dashboard`
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const TARGETS: { email: string; redirect: string }[] = [
  { email: "consumer@hungeri.test", redirect: "/" },
  { email: "merchant@hungeri.test", redirect: "/dashboard" },
  { email: "admin@hungeri.test", redirect: "/admin" },
];

async function linkFor(email: string, redirect: string) {
  const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data?.properties) throw new Error(`${email}: ${error?.message}`);
  const { hashed_token } = data.properties;
  return `${site}/auth/confirm?token_hash=${hashed_token}&type=magiclink&redirect=${encodeURIComponent(redirect)}`;
}

async function main() {
  const argEmail = process.argv[2];
  const argRedirect = process.argv[3] ?? "/";
  const targets = argEmail ? [{ email: argEmail, redirect: argRedirect }] : TARGETS;

  console.log("\n🔑 One-click sign-in links (open in your browser; valid ~1h):\n");
  for (const t of targets) {
    try {
      const link = await linkFor(t.email, t.redirect);
      console.log(`  ${t.email}\n  → ${link}\n`);
    } catch (e) {
      console.error(`  ${t.email}: ${(e as Error).message}\n`);
    }
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
