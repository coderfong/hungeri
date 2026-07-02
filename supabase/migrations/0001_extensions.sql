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
