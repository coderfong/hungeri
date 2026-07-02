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
