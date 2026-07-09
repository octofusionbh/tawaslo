-- Tawaslo — menu tax (added on top at checkout) + per-item pickup flag persistence.
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
alter table public.menus  add column if not exists tax_enabled boolean default false;
alter table public.menus  add column if not exists tax_pct     numeric default 0;   -- e.g. 10 for 10%
alter table public.orders add column if not exists tax         numeric default 0;   -- tax amount added at checkout
