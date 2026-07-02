# Hungeri 🍜

The freshest **F&B deals near you** — a deals discovery marketplace for Singapore.
Consumers browse current restaurant/café/dessert promotions in one place; merchants
post deals and pay to feature them; ops moderates and curates supply.

> **Status:** MVP in progress. **Milestone 1 (schema + auth + seed) is complete.**

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router, RSC) + TypeScript | SSR for SEO-friendly deal pages |
| UI | Tailwind CSS v4 (+ shadcn/ui from M2) | mobile-first |
| Data / Auth / Storage | Supabase (Postgres + Auth + Storage + RLS) | single provider |
| DB access | `@supabase/ssr` + `supabase-js` | respects RLS as the signed-in user (Prisma would bypass it) |
| Geo | PostGIS (`geography` + GiST + `ST_DWithin`) | "deals near me" |
| Maps | Mapbox GL JS | M3 |
| Payments | Stripe (Checkout + Portal + webhooks) | M5, test mode |
| Search | Postgres FTS (`tsvector` + GIN) | behind a `searchDeals()` module |
| Email | Resend | M7, behind a `Notifier` interface |
| Validation | Zod | inputs + env |

---

## Prerequisites

- Node 20+ (tested on Node 22) and npm
- A free [Supabase](https://supabase.com) project
- The Supabase CLI is installed locally as a dev dependency (`npx supabase …`)

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```
Fill in from your Supabase project (**Settings → API**):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, used by the seed script. **Never expose it.**

(Mapbox / Stripe / Resend keys are only needed from M3/M5/M7.)

### 3. Apply the database schema
Link the CLI to your project, then push the migrations in `supabase/migrations/`:
```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npm run db:push
```
This creates the extensions (PostGIS, pg_trgm), enums, tables, indexes, triggers,
and **all Row Level Security policies**.

> Enable **pg_cron** from the dashboard (Database → Extensions) — it schedules the
> deal-expiry + notification jobs in M7. Not required for M1.

### 4. (Optional) Regenerate typed DB types
`types/database.ts` is checked in and hand-kept in sync, but once linked you can
regenerate the canonical version:
```bash
npm run db:types
```

### 5. Seed demo data (~30 Singapore deals)
```bash
npm run db:seed
```
Creates demo accounts and 15 businesses with 30 live deals across cuisines:

| Account | Email | Role |
|---|---|---|
| Admin | `admin@hungeri.test` | admin |
| Merchant | `merchant@hungeri.test` | merchant |
| Consumer | `consumer@hungeri.test` | consumer |

To sign in as one of these, use the magic-link flow (the emails route to those
inboxes) or generate a link from the Supabase dashboard (**Authentication → Users**).

### 6. Run
```bash
npm run dev          # http://localhost:3000
```

---

## How to test Milestone 1 locally

1. `npm run dev` and open the home page — you should see the seeded live deals
   (fetched through RLS as an anonymous visitor, proving public read works).
2. Click **Sign in**, enter an email, and confirm the magic-link / Google flow
   redirects back authenticated (header switches to **Sign out**).
3. In the Supabase SQL editor, confirm RLS: as an anonymous role you can only
   `select` deals with `status = 'live'`; draft/pending deals are hidden.
4. Re-run `npm run db:seed` — it's idempotent (upserts by slug, replaces deals).

### What's stubbed / deferred
- Ranked + filterable feed, deal detail, business pages → **M2**
- Map & near-me → **M3**
- Merchant dashboard & deal CRUD → **M4**
- Stripe monetization + the ranking module → **M5**
- Admin moderation + analytics → **M6**
- Notifications, sitemap/structured data, ingestion adapters, pg_cron scheduling → **M7**

---

## Project structure

```
app/
  (consumer)/      public pages (home feed lives at app/page.tsx for now)
  (auth)/          login + auth route handlers (callback, confirm, signout)
  (merchant)/      merchant dashboard            (M4)
  (admin)/         ops console                   (M6)
lib/
  env.ts           zod-validated env (client vs server split)
  flags.ts         feature flags (scraping OFF)
  supabase/        client / server / admin / session factories
  auth.ts          server-side auth helpers
  i18n/            currency (SGD), timezone (Asia/Singapore), copy strings
  ranking/         ranking module                (M5)
  ingestion/       source-adapter interface      (M7)
  notifications/   Notifier interface            (M7)
supabase/
  migrations/      ordered SQL (extensions → enums → tables → fns → indexes → RLS)
  functions/       edge functions                (M7)
  seed.ts          demo accounts + ~30 SG deals
types/database.ts  generated/hand-kept DB types
proxy.ts           refreshes the Supabase session per request
```

---

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | start dev server |
| `npm run build` / `start` | production build / serve |
| `npm run lint` | ESLint |
| `npm run db:push` | apply migrations to the linked project |
| `npm run db:reset` | reset the linked DB to migrations |
| `npm run db:types` | regenerate `types/database.ts` |
| `npm run db:seed` | seed demo accounts + deals |

---

## Deployment

Target is **Vercel** + Supabase cloud. Add all `.env.local` values as Vercel
environment variables. (Detailed deploy steps land with M7.)
