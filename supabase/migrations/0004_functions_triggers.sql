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
