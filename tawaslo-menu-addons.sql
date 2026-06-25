-- ============================================================
-- Tawaslo — Menu item add-ons / extras
-- Run AFTER tawaslo-menu-v2.sql. Paste into Supabase → SQL Editor → Run.
-- Safe to re-run.
-- ============================================================

-- Optional paid extras per item. Each entry: { "name": "Extra cheese", "price": 0.500 }.
-- Shown on the item detail sheet under the sizes.
alter table public.menu_items add column if not exists addons jsonb default '[]'::jsonb;

-- ============================================================
