-- ============================================================
-- Tawaslo — WhatsApp Concierge conversation memory
-- Lets the AI hold a multi-turn chat (and take bookings) over WhatsApp.
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- ============================================================

create table if not exists public.wa_threads (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid,
  wa_from     text,                         -- the guest's WhatsApp number
  messages    jsonb default '[]'::jsonb,    -- recent [{role, content}]
  updated_at  timestamptz default now()
);
create unique index if not exists wa_threads_client_from on public.wa_threads (client_id, wa_from);

alter table public.wa_threads enable row level security;
drop policy if exists wa_threads_all on public.wa_threads;
create policy wa_threads_all on public.wa_threads for all using (true) with check (true);

-- ============================================================
-- Vercel env vars needed:
--   WHATSAPP_TOKEN              (access token from Meta)
--   WHATSAPP_VERIFY_TOKEN       (any string you choose; used in webhook setup)
--   WHATSAPP_DEFAULT_CLIENT_ID  (the Tawaslo client UUID to answer for, while testing)
--   SUPABASE_SERVICE_ROLE_KEY   (already set)
-- ============================================================
