-- ============================================================
-- Tawaslo — Loyalty card branding (per-restaurant look)
-- Run AFTER tawaslo-loyalty.sql. Paste into Supabase → SQL Editor → Run.
-- Safe to re-run.
-- ============================================================

-- Each restaurant brands its own card: colour, stamp icon, theme, welcome line.
alter table public.loyalty_programs add column if not exists brand_color text default '#6E8CAB';
alter table public.loyalty_programs add column if not exists stamp_icon  text default 'check';   -- check | star | heart | coffee | gift
alter table public.loyalty_programs add column if not exists theme       text default 'dark';    -- dark | light
alter table public.loyalty_programs add column if not exists welcome     text;                   -- custom line on the card

-- ============================================================
