-- ============================================================
-- Tawaslo — Menu theme + cover banner (desktop redesign)
-- Run AFTER tawaslo-menu-v2.sql. Paste into Supabase → SQL Editor → Run.
-- Safe to re-run.
-- ============================================================

-- Each restaurant picks dark or light for its public menu.
alter table public.menus add column if not exists theme text default 'dark';   -- dark | light

-- Optional cover-banner image shown on the desktop intro screen.
alter table public.menus add column if not exists cover_url text;

-- ============================================================
