-- Tawaslo — store the YouTube (Google) refresh token so we can publish later than ~1h after connect.
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
alter table public.social_accounts add column if not exists refresh_token text;
