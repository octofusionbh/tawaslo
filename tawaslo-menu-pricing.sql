-- ============================================================
-- Tawaslo — Menu pricing options (per-item price visibility + currencies)
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- ============================================================

-- Per-item: hide the price on specific dishes (default = show).
alter table public.menu_items add column if not exists show_price boolean default true;

-- Menu-level master switch: hide ALL prices on this menu.
alter table public.menus add column if not exists hide_prices boolean default false;

-- (menus.currency already exists — the builder now offers all world currencies.)
-- ============================================================
