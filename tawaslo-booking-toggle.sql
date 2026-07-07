-- Tawaslo — per-restaurant "takes reservations" toggle.
-- When false, the public menu chat shows "Chat with us" (no booking) and the
-- concierge (web + WhatsApp) will not offer or take table reservations.
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
alter table public.menus add column if not exists booking_enabled boolean default true;
