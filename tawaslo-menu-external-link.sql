-- ============================================================
-- Tawaslo — Optional custom menu link
-- If a restaurant already has its own menu (website / Talabat / PDF),
-- the Concierge shares that link instead of the Tawaslo one.
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- ============================================================

alter table public.menus add column if not exists external_menu_url text;

-- ============================================================
