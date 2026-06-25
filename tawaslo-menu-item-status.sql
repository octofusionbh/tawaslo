-- ============================================================
-- Tawaslo — Menu item status (Sold out vs Hidden)
-- Run AFTER tawaslo-menu-v2.sql. Paste into Supabase → SQL Editor → Run.
-- Safe to re-run.
-- ============================================================

-- "Hidden" = don't show on the public menu at all (distinct from "Sold out").
--   available = false  → still shown, greyed out, "Sold out" badge.
--   hidden    = true   → not rendered on the public menu or read by the AI.
alter table public.menu_items add column if not exists hidden boolean default false;

-- ============================================================
