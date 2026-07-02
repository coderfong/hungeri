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
