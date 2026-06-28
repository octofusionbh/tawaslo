-- ============================================================
-- Tawaslo — Auto Monthly Report (per-client opt-in).
-- Adds two columns so the monthly cron knows who to email and where.
-- Paste into Supabase -> SQL Editor -> Run. Safe to re-run.
-- ============================================================

alter table public.clients add column if not exists auto_report  boolean default false;
alter table public.clients add column if not exists report_email text;

-- That's it. Enable per client from Reports -> "Email automatically each month".
-- The cron at /api/cron?key=CRON_SECRET&task=monthly_reports sends them on the 1st.
-- ============================================================
