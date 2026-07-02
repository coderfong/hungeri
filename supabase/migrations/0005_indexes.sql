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
