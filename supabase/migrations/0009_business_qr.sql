-- 0009_business_qr.sql
-- Every shop gets a unique, STATIC QR token. The merchant prints/displays the QR
-- (encodes {SITE_URL}/r/{qr_token}); customers scan it in-app to redeem a deal,
-- which proves they're physically at the outlet. The token is stable (static QR)
-- but unguessable (uuid), so it can't be forged from the business id.

alter table public.businesses
  add column if not exists qr_token uuid not null default gen_random_uuid();

-- Volatile default backfills each existing row with a distinct uuid (PG11+).
create unique index if not exists idx_businesses_qr_token on public.businesses (qr_token);
