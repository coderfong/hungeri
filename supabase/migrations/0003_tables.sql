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
