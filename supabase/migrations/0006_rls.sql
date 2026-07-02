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
