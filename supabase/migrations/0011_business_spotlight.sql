-- 0011_business_spotlight.sql
-- Admin/super-merchant curated spotlight: a business flagged `spotlight` is
-- shown in the homepage featured carousel regardless of paid placements.
-- The app reads this via a guarded query, so it works before or after this runs.

alter table public.businesses
  add column if not exists spotlight boolean not null default false;

create index if not exists idx_businesses_spotlight
  on public.businesses (spotlight)
  where spotlight;
