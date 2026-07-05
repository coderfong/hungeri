-- Hungeri combined schema — generated from supabase/migrations/*.sql
-- Fresh installs: paste into the Supabase SQL Editor and Run.


-- ====================================================================
-- supabase/migrations/0001_extensions.sql
-- ====================================================================
-- 0001_extensions.sql
-- Required Postgres extensions for Hungeri.

-- PostGIS: geography type, ST_DWithin radius search, GiST indexes ("deals near me").
create extension if not exists postgis;

-- gen_random_uuid() for primary keys.
create extension if not exists pgcrypto;

-- Trigram matching for fuzzy business/dish name search (complements FTS).
create extension if not exists pg_trgm;

-- pg_cron is enabled from the Supabase dashboard (Database → Extensions) and is
-- used in M7 to schedule the deal-expiry + notification jobs. Left as a note here
-- because it must live in the `extensions`/`pg_catalog` schema on Supabase.


-- ====================================================================
-- supabase/migrations/0002_enums.sql
-- ====================================================================
-- 0002_enums.sql
-- Enumerated domains. Centralising these keeps the schema self-documenting and
-- prevents typo'd status strings. Add new values with `alter type ... add value`.

create type user_role as enum ('consumer', 'merchant', 'admin');

create type business_status as enum ('draft', 'live', 'suspended');

create type deal_type as enum (
  'percentage', 'fixed_amount', 'bogo', 'set_menu',
  'freebie', 'happy_hour', 'loyalty'
);

create type deal_channel as enum ('dine_in', 'takeaway', 'delivery');

create type redemption_method as enum ('code', 'show_screen', 'auto', 'link');

create type deal_status as enum (
  'draft', 'pending_review', 'live', 'expired', 'rejected'
);

create type deal_source as enum ('merchant', 'curated', 'partner_api', 'scraped');

create type placement_tier as enum ('featured', 'boosted', 'spotlight');

create type placement_status as enum ('active', 'scheduled', 'ended');

create type subscription_plan as enum ('free', 'pro', 'premium');

create type subscription_status as enum (
  'active', 'past_due', 'canceled', 'incomplete', 'trialing'
);

create type report_status as enum ('open', 'resolved');

create type view_source as enum ('feed', 'map', 'featured', 'search');


-- ====================================================================
-- supabase/migrations/0003_tables.sql
-- ====================================================================
-- 0003_tables.sql
-- Core schema. Money is stored as integer cents. Geo points are GENERATED from
-- lat/lng so they can never drift out of sync. Timestamps are timestamptz (UTC);
-- the app renders them in Asia/Singapore.

-- ── users ──────────────────────────────────────────────────────────────────
-- Mirrors auth.users 1:1 (id = auth.users.id). Auto-populated by a trigger on
-- signup (see 0004). Role defaults to consumer; admins promote merchants/admins.
create table public.users (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         user_role not null default 'consumer',
  email        text not null,
  display_name text,
  created_at   timestamptz not null default now()
);

-- ── consumer_profiles ────────────────────────────────────────────────────────
create table public.consumer_profiles (
  user_id            uuid primary key references public.users (id) on delete cascade,
  home_lat           double precision,
  home_lng           double precision,
  home_geog          geography(Point, 4326) generated always as (
    case when home_lat is not null and home_lng is not null
      then st_setsrid(st_makepoint(home_lng, home_lat), 4326)::geography
      else null end
  ) stored,
  preferred_cuisines text[] not null default '{}',
  notification_prefs jsonb not null default '{"new_nearby": true, "expiring_saved": true}'::jsonb,
  created_at         timestamptz not null default now()
);

-- ── businesses ───────────────────────────────────────────────────────────────
create table public.businesses (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid not null references public.users (id) on delete cascade,
  name           text not null,
  slug           text not null unique,
  description    text,
  logo_url       text,
  cover_url      text,
  cuisine_tags   text[] not null default '{}',
  price_level    smallint check (price_level between 1 and 4),
  website        text,
  socials        jsonb not null default '{}'::jsonb,
  verified       boolean not null default false,
  status         business_status not null default 'draft',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── locations (outlets) ──────────────────────────────────────────────────────
create table public.locations (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses (id) on delete cascade,
  address       text,
  city          text default 'Singapore',
  postal_code   text,
  lat           double precision not null,
  lng           double precision not null,
  geog          geography(Point, 4326) generated always as (
    st_setsrid(st_makepoint(lng, lat), 4326)::geography
  ) stored,
  phone         text,
  opening_hours jsonb,
  created_at    timestamptz not null default now()
);

-- ── deals ────────────────────────────────────────────────────────────────────
create table public.deals (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references public.businesses (id) on delete cascade,
  title               text not null,
  description         text,
  deal_type           deal_type not null,
  discount_value      numeric,                 -- meaning depends on deal_type
  terms               text,
  fine_print          text,
  image_url           text,
  channels            deal_channel[] not null default '{}',
  dietary_tags        text[] not null default '{}',
  start_at            timestamptz not null,
  end_at              timestamptz not null,
  recurring_rule      jsonb,                   -- e.g. {"freq":"weekly","byday":["MO","TU"],"start":"17:00","end":"19:00"}
  redemption_method   redemption_method not null default 'show_screen',
  redemption_code     text,
  redemption_url      text,
  status              deal_status not null default 'draft',
  source              deal_source not null default 'merchant',
  source_attribution  jsonb,                   -- {url, publisher, fetched_at} for curated/partner/scraped
  search_vector       tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint deals_window_valid check (end_at > start_at)
);

-- ── featured_placements (paid) ───────────────────────────────────────────────
create table public.featured_placements (
  id                uuid primary key default gen_random_uuid(),
  deal_id           uuid not null references public.deals (id) on delete cascade,
  tier              placement_tier not null,
  geo_scope         jsonb,                     -- {lat, lng, radius_m} or {area: "..."}
  start_at          timestamptz not null,
  end_at            timestamptz not null,
  price_cents       integer not null check (price_cents >= 0),
  stripe_payment_id text,
  status            placement_status not null default 'scheduled',
  created_at        timestamptz not null default now(),
  constraint placement_window_valid check (end_at > start_at)
);

-- ── saves (favourites) ───────────────────────────────────────────────────────
create table public.saves (
  id          uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references public.users (id) on delete cascade,
  deal_id     uuid not null references public.deals (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (consumer_id, deal_id)
);

-- ── redemptions ──────────────────────────────────────────────────────────────
create table public.redemptions (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references public.deals (id) on delete cascade,
  consumer_id uuid references public.users (id) on delete set null,
  method      redemption_method not null,
  location_id uuid references public.locations (id) on delete set null,
  redeemed_at timestamptz not null default now()
);

-- ── deal_views (analytics) ───────────────────────────────────────────────────
create table public.deal_views (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references public.deals (id) on delete cascade,
  consumer_id uuid references public.users (id) on delete set null,
  source      view_source not null default 'feed',
  created_at  timestamptz not null default now()
);

-- ── subscriptions ────────────────────────────────────────────────────────────
create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  business_id            uuid not null references public.businesses (id) on delete cascade,
  stripe_subscription_id text unique,
  plan                   subscription_plan not null default 'free',
  status                 subscription_status not null default 'active',
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (business_id)
);

-- ── reports (abuse / takedown) ────────────────────────────────────────────────
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references public.deals (id) on delete cascade,
  reporter_id uuid references public.users (id) on delete set null,
  reason      text not null,
  status      report_status not null default 'open',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);


-- ====================================================================
-- supabase/migrations/0004_functions_triggers.sql
-- ====================================================================
-- 0004_functions_triggers.sql
-- Helper functions, integrity triggers, and the deal-expiry job.

-- ── auth helpers (used by RLS policies) ──────────────────────────────────────

-- True if the current user has the admin role. SECURITY DEFINER so it can read
-- public.users without tripping that table's own RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

-- True if the current user owns the given business.
create or replace function public.owns_business(biz_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.businesses
    where id = biz_id and owner_user_id = auth.uid()
  );
$$;

-- ── new auth user → public.users row ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'consumer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── updated_at maintenance ───────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_businesses_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

create trigger trg_deals_updated_at
  before update on public.deals
  for each row execute function public.set_updated_at();

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ── integrity: a deal may only be 'live' if its end_at is in the future ──────
-- (now() is not immutable so this can't be a CHECK; enforce on write instead.)
create or replace function public.enforce_live_deal_window()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'live' and new.end_at <= now() then
    raise exception 'A live deal must have end_at in the future (got %)', new.end_at
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger trg_deals_live_window
  before insert or update on public.deals
  for each row execute function public.enforce_live_deal_window();

-- ── deal-expiry job (scheduled via pg_cron in M7) ────────────────────────────
-- Flips any live deal whose window has passed to 'expired'. Returns row count.
create or replace function public.expire_deals()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.deals
     set status = 'expired'
   where status = 'live' and end_at <= now();
  get diagnostics affected = row_count;

  update public.featured_placements
     set status = 'ended'
   where status in ('active', 'scheduled') and end_at <= now();

  return affected;
end;
$$;

-- ── geo search: live deals within radius of a point, nearest first ───────────
-- Returns deal ids + distance; the app hydrates full deal rows. Used in M3.
create or replace function public.deals_near(
  in_lat double precision,
  in_lng double precision,
  in_radius_m double precision default 5000
)
returns table (deal_id uuid, location_id uuid, distance_m double precision)
language sql
stable
set search_path = public
as $$
  select distinct on (d.id)
         d.id as deal_id,
         l.id as location_id,
         st_distance(l.geog, st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography) as distance_m
    from public.deals d
    join public.locations l on l.business_id = d.business_id
    join public.businesses b on b.id = d.business_id
   where d.status = 'live'
     and b.status = 'live'
     and st_dwithin(l.geog, st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography, in_radius_m)
   order by d.id, distance_m;
$$;


-- ====================================================================
-- supabase/migrations/0005_indexes.sql
-- ====================================================================
-- 0005_indexes.sql
-- Indexes tuned for the feed (status+expiry), geo radius, ownership, and search.

-- Feed: "live deals, soonest to expire". Partial index keeps it small.
create index idx_deals_status_end_at on public.deals (status, end_at);
create index idx_deals_live_end_at on public.deals (end_at) where status = 'live';

-- Ownership / joins.
create index idx_deals_business_id on public.deals (business_id);
create index idx_locations_business_id on public.locations (business_id);
create index idx_businesses_owner on public.businesses (owner_user_id);
create index idx_businesses_status on public.businesses (status);

-- Geo radius search (PostGIS GiST).
create index idx_locations_geog on public.locations using gist (geog);
create index idx_consumer_home_geog on public.consumer_profiles using gist (home_geog);

-- Full-text search + fuzzy name/tag matching.
create index idx_deals_search_vector on public.deals using gin (search_vector);
create index idx_deals_dietary_tags on public.deals using gin (dietary_tags);
create index idx_deals_channels on public.deals using gin (channels);
create index idx_businesses_cuisine_tags on public.businesses using gin (cuisine_tags);
create index idx_businesses_name_trgm on public.businesses using gin (name gin_trgm_ops);

-- Placements: active windows feed the ranking module.
create index idx_placements_deal on public.featured_placements (deal_id);
create index idx_placements_active on public.featured_placements (status, start_at, end_at);

-- Analytics + favourites lookups.
create index idx_saves_consumer on public.saves (consumer_id);
create index idx_saves_deal on public.saves (deal_id);
create index idx_deal_views_deal on public.deal_views (deal_id, created_at);
create index idx_redemptions_deal on public.redemptions (deal_id, redeemed_at);
create index idx_reports_status on public.reports (status);


-- ====================================================================
-- supabase/migrations/0006_rls.sql
-- ====================================================================
-- 0006_rls.sql
-- Row Level Security. The security model: consumers touch only their own rows;
-- merchants touch only rows under businesses they own; the public reads only
-- 'live' supply; admins (and the service-role key used server-side) see all.
--
-- Table privileges are granted broadly to anon/authenticated; RLS policies below
-- are what actually restrict access. The service-role key bypasses RLS entirely.

-- ── base grants (RLS still governs every row) ───────────────────────────────
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
-- Anonymous browsers may log a view but nothing else.
grant insert on public.deal_views to anon;

-- ── enable RLS everywhere ───────────────────────────────────────────────────
alter table public.users               enable row level security;
alter table public.consumer_profiles   enable row level security;
alter table public.businesses          enable row level security;
alter table public.locations           enable row level security;
alter table public.deals               enable row level security;
alter table public.featured_placements enable row level security;
alter table public.saves               enable row level security;
alter table public.redemptions         enable row level security;
alter table public.deal_views          enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.reports             enable row level security;

-- ── users ───────────────────────────────────────────────────────────────────
create policy users_select_self_or_admin on public.users
  for select using (id = auth.uid() or public.is_admin());
create policy users_update_self on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Prevent a user from promoting their own role; only admins may change it.
create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins may change a user role' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;
create trigger trg_users_no_role_escalation
  before update on public.users
  for each row execute function public.prevent_role_escalation();

-- Admin-only role change (see 0010). SECURITY DEFINER bypasses the per-row
-- users_update_self RLS; is_admin() (checked here and in the trigger above)
-- uses the caller's auth.uid(), so it must be called from an admin session.
create or replace function public.set_user_role(target uuid, new_role user_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins may change a user role' using errcode = 'insufficient_privilege';
  end if;
  update public.users set role = new_role where id = target;
end;
$$;
revoke all on function public.set_user_role(uuid, user_role) from public, anon;
grant execute on function public.set_user_role(uuid, user_role) to authenticated;

-- ── consumer_profiles ────────────────────────────────────────────────────────
create policy cp_owner_all on public.consumer_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cp_admin_select on public.consumer_profiles
  for select using (public.is_admin());

-- ── businesses ───────────────────────────────────────────────────────────────
create policy biz_public_read_live on public.businesses
  for select using (status = 'live' or owner_user_id = auth.uid() or public.is_admin());
create policy biz_owner_insert on public.businesses
  for insert with check (owner_user_id = auth.uid());
create policy biz_owner_update on public.businesses
  for update using (owner_user_id = auth.uid() or public.is_admin())
            with check (owner_user_id = auth.uid() or public.is_admin());
create policy biz_owner_delete on public.businesses
  for delete using (owner_user_id = auth.uid() or public.is_admin());

-- ── locations ────────────────────────────────────────────────────────────────
create policy loc_public_read on public.locations
  for select using (
    public.owns_business(business_id)
    or public.is_admin()
    or exists (select 1 from public.businesses b where b.id = business_id and b.status = 'live')
  );
create policy loc_owner_write on public.locations
  for all using (public.owns_business(business_id) or public.is_admin())
          with check (public.owns_business(business_id) or public.is_admin());

-- ── deals ────────────────────────────────────────────────────────────────────
create policy deals_public_read_live on public.deals
  for select using (status = 'live' or public.owns_business(business_id) or public.is_admin());
create policy deals_owner_insert on public.deals
  for insert with check (public.owns_business(business_id));
create policy deals_owner_update on public.deals
  for update using (public.owns_business(business_id) or public.is_admin())
            with check (public.owns_business(business_id) or public.is_admin());
create policy deals_owner_delete on public.deals
  for delete using (public.owns_business(business_id) or public.is_admin());

-- ── featured_placements ─────────────────────────────────────────────────────
-- Public reads active placements (to render labels/ranking). Writes happen
-- server-side via the Stripe webhook (service role) or by an admin.
create policy fp_public_read on public.featured_placements
  for select using (
    status = 'active'
    or public.is_admin()
    or exists (
      select 1 from public.deals d
      where d.id = deal_id and public.owns_business(d.business_id)
    )
  );
create policy fp_admin_write on public.featured_placements
  for all using (public.is_admin()) with check (public.is_admin());

-- ── saves ────────────────────────────────────────────────────────────────────
create policy saves_owner_all on public.saves
  for all using (consumer_id = auth.uid()) with check (consumer_id = auth.uid());

-- ── redemptions ──────────────────────────────────────────────────────────────
create policy redemptions_read on public.redemptions
  for select using (
    consumer_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.deals d where d.id = deal_id and public.owns_business(d.business_id))
  );
create policy redemptions_insert_self on public.redemptions
  for insert with check (consumer_id = auth.uid());

-- ── deal_views ───────────────────────────────────────────────────────────────
create policy dv_insert_anyone on public.deal_views
  for insert to anon, authenticated
  with check (consumer_id is null or consumer_id = auth.uid());
create policy dv_read_owner_admin on public.deal_views
  for select using (
    public.is_admin()
    or exists (select 1 from public.deals d where d.id = deal_id and public.owns_business(d.business_id))
  );

-- ── subscriptions ────────────────────────────────────────────────────────────
create policy subs_read on public.subscriptions
  for select using (public.owns_business(business_id) or public.is_admin());
create policy subs_admin_write on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

-- ── reports ──────────────────────────────────────────────────────────────────
create policy reports_insert on public.reports
  for insert with check (reporter_id = auth.uid() or reporter_id is null);
create policy reports_read on public.reports
  for select using (reporter_id = auth.uid() or public.is_admin());
create policy reports_admin_update on public.reports
  for update using (public.is_admin()) with check (public.is_admin());


-- ====================================================================
-- supabase/migrations/0007_public_read_expired_deals.sql
-- ====================================================================
-- 0007_public_read_expired_deals.sql
-- Allow the public to read EXPIRED deals (not just live ones) so shared links and
-- SEO pages can render the "Deal ended" state. Draft/pending/rejected stay hidden.

drop policy if exists deals_public_read_live on public.deals;

create policy deals_public_read_live on public.deals
  for select using (
    status in ('live', 'expired')
    or public.owns_business(business_id)
    or public.is_admin()
  );


-- ====================================================================
-- supabase/migrations/0008_storage.sql
-- ====================================================================
-- 0008_storage.sql
-- Storage buckets for merchant-uploaded imagery (deal photos, logos, covers).
-- Public read (images appear on public deal/business pages); authenticated write.

insert into storage.buckets (id, name, public)
values ('deal-images', 'deal-images', true)
on conflict (id) do nothing;

-- Public can read objects in this bucket.
create policy "deal-images public read"
  on storage.objects for select
  using (bucket_id = 'deal-images');

-- Any authenticated user (merchants) can upload/update/remove in this bucket.
-- Files are namespaced by business id in the path by the app; tightening this to
-- per-owner paths can come later.
create policy "deal-images authenticated insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'deal-images');

create policy "deal-images authenticated update"
  on storage.objects for update to authenticated
  using (bucket_id = 'deal-images');

create policy "deal-images authenticated delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'deal-images');


-- ====================================================================
-- supabase/migrations/0009_business_qr.sql
-- ====================================================================
-- 0009_business_qr.sql
-- Every shop gets a unique, STATIC QR token. The merchant prints/displays the QR
-- (encodes {SITE_URL}/r/{qr_token}); customers scan it in-app to redeem a deal,
-- which proves they're physically at the outlet. The token is stable (static QR)
-- but unguessable (uuid), so it can't be forged from the business id.

alter table public.businesses
  add column if not exists qr_token uuid not null default gen_random_uuid();

-- Volatile default backfills each existing row with a distinct uuid (PG11+).
create unique index if not exists idx_businesses_qr_token on public.businesses (qr_token);

