-- ============================================================
-- Tawaslo — Autopilot (per-client self-driving mode). The agency
-- flips it on, sets the rails, and Tawaslo runs the account.
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- ============================================================

alter table public.clients add column if not exists autopilot_on    boolean default false;  -- master switch per client
alter table public.clients add column if not exists autopilot_brief text;                   -- this cycle's input / themes / promos
alter table public.clients add column if not exists autopilot_freq  text default 'weekly';  -- weekly | biweekly | monthly
alter table public.clients add column if not exists autopilot_count int default 5;          -- posts per cycle

-- ============================================================
