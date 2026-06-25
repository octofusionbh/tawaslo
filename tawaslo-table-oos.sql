-- ============================================================
-- Tawaslo — Tables "out of service" + host-stand editing
-- Run AFTER tawaslo-fnb-floor-crm.sql. Paste into Supabase → SQL Editor → Run.
-- Safe to re-run.
-- ============================================================

-- A table can be taken "out of service" (broken, reserved for private event,
-- being cleaned). It stays on the floor, greyed out, and can't be seated.
alter table public.dining_tables add column if not exists out_of_service boolean default false;

-- ============================================================
