-- Tawaslo — store the Reel cover chosen in the composer.
-- Run once in Supabase → SQL Editor. Safe to re-run; adds one nullable column.
alter table public.posts add column if not exists cover_url text;
