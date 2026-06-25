-- ============================================================
-- Tawaslo — Menu v2 (descriptions, multiple photos, section order)
-- Run AFTER tawaslo-menu-pricing.sql. Paste into Supabase → SQL Editor → Run.
-- Safe to re-run.
-- ============================================================

-- Bilingual description (English already exists as menu_items.description; add Arabic).
alter table public.menu_items add column if not exists description_ar text;

-- Multiple photos per item — array of image URLs (first = thumbnail). Pan/zoom
-- to frame is applied at upload time, so each stored URL is already framed.
alter table public.menu_items add column if not exists photos jsonb default '[]'::jsonb;

-- Section order — the order categories appear on the menu (drag-to-reorder).
alter table public.menus add column if not exists cat_order jsonb default '[]'::jsonb;

-- The two display languages this menu shows (any language, not just EN/AR).
-- name_en / description hold the PRIMARY language; name_ar / description_ar the SECONDARY.
-- RTL is auto-applied when the secondary is an RTL script (ar, he, fa, ur).
alter table public.menus add column if not exists lang1 text default 'en';
alter table public.menus add column if not exists lang2 text default 'ar';

-- ============================================================
-- (menu_items.description, show_price, available + menus.currency, hide_prices
--  already exist from earlier setup.)
-- ============================================================
