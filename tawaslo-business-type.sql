-- Tawaslo — per-client business type (adapts the suite: restaurant / shop / services)
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
alter table public.clients add column if not exists business_type text default 'restaurant';
-- values: restaurant | shop | services
