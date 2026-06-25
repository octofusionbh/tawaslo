-- ============================================================
-- Tawaslo — Menu item sizes / options (variants)
-- Run AFTER tawaslo-menu-v2.sql. Paste into Supabase → SQL Editor → Run.
-- Safe to re-run.
-- ============================================================

-- Optional per item. Each entry: { "name": "Large", "price": 2.500 }.
-- The restaurant names its own sizes (any number). When present, the menu
-- shows "from <lowest>" and the detail sheet lists every size + price.
alter table public.menu_items add column if not exists variants jsonb default '[]'::jsonb;

-- ============================================================
