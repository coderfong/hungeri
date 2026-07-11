-- 0012_location_photos.sql
-- Per-outlet photo: each location can carry its own image (storefront, interior)
-- distinct from the business-level cover. Shown in the merchant outlets manager
-- and on the public business page's outlet list.

alter table public.locations
  add column if not exists photo_url text;
