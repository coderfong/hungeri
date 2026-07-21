-- 0014_disable_recurring_deals.sql
-- Recurring deals were exposed as a merchant toggle but had no scheduling
-- engine behind them. Remove the unsupported state and prevent it returning.

update public.deals
set recurring_rule = null
where recurring_rule is not null;

alter table public.deals
  drop constraint if exists deals_recurring_disabled;
alter table public.deals
  add constraint deals_recurring_disabled check (recurring_rule is null);
