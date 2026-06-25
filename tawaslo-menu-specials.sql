-- ============================================================
-- Tawaslo — Smart menu: specials, dayparts, dietary tags
-- Run AFTER tawaslo-menu-v2.sql. Paste into Supabase → SQL Editor → Run.
-- Safe to re-run.
-- ============================================================

-- Dietary / attribute tags per item (veg, vegan, halal, gluten-free, spicy…).
alter table public.menu_items add column if not exists tags jsonb default '[]'::jsonb;

-- A "Today's special" banner the owner sets per day.
alter table public.menus add column if not exists special    text;
alter table public.menus add column if not exists special_on boolean default false;

-- Time-based menu: which daypart each section belongs to + the daypart hours.
--   cat_dayparts  = { "Breakfast": "breakfast", "Mains": "all", ... }
--   daypart_hours = { "breakfast":[7,11], "lunch":[11,16], "dinner":[16,23] }
alter table public.menus add column if not exists cat_dayparts  jsonb default '{}'::jsonb;
alter table public.menus add column if not exists daypart_hours jsonb default '{}'::jsonb;

-- ============================================================
