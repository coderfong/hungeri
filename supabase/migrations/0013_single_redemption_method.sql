-- 0013_single_redemption_method.sql
-- Hungeri now has one redemption flow: scan the store QR and show the
-- confirmation screen to staff. Keep the historical enum intact for safe
-- migration, but normalise rows and enforce the single supported value.

update public.deals
set redemption_method = 'show_screen',
    redemption_code = null,
    redemption_url = null
where redemption_method <> 'show_screen'
   or redemption_code is not null
   or redemption_url is not null;

update public.redemptions
set method = 'show_screen'
where method <> 'show_screen';

alter table public.deals
  drop constraint if exists deals_single_redemption_method;
alter table public.deals
  add constraint deals_single_redemption_method
  check (
    redemption_method = 'show_screen'
    and redemption_code is null
    and redemption_url is null
  );

alter table public.redemptions
  drop constraint if exists redemptions_single_method;
alter table public.redemptions
  add constraint redemptions_single_method check (method = 'show_screen');
