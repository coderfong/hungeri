-- Hungeri pending migrations — run in the Supabase SQL Editor.
-- Idempotent: safe to run even if some parts were applied before.
-- Covers 0007 (expired-deal read), 0008 (storage bucket), 0009 (shop QR token).

-- ── 0007: public read of expired deals ──────────────────────────────────────
drop policy if exists deals_public_read_live on public.deals;
create policy deals_public_read_live on public.deals
  for select using (
    status in ('live', 'expired')
    or public.owns_business(business_id)
    or public.is_admin()
  );

-- ── 0008: deal-images storage bucket + policies ─────────────────────────────
insert into storage.buckets (id, name, public)
values ('deal-images', 'deal-images', true)
on conflict (id) do nothing;

drop policy if exists "deal-images public read" on storage.objects;
create policy "deal-images public read"
  on storage.objects for select using (bucket_id = 'deal-images');

drop policy if exists "deal-images authenticated insert" on storage.objects;
create policy "deal-images authenticated insert"
  on storage.objects for insert to authenticated with check (bucket_id = 'deal-images');

drop policy if exists "deal-images authenticated update" on storage.objects;
create policy "deal-images authenticated update"
  on storage.objects for update to authenticated using (bucket_id = 'deal-images');

drop policy if exists "deal-images authenticated delete" on storage.objects;
create policy "deal-images authenticated delete"
  on storage.objects for delete to authenticated using (bucket_id = 'deal-images');

-- ── 0009: per-shop static QR token ──────────────────────────────────────────
alter table public.businesses
  add column if not exists qr_token uuid not null default gen_random_uuid();
create unique index if not exists idx_businesses_qr_token on public.businesses (qr_token);
