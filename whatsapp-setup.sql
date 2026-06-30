-- ============================================================
-- Tawaslo — WhatsApp inbound message log (wa_messages)
-- Required by api/meta-publish.js -> handleWhatsApp() webhook logging.
-- Without this table, inbound WhatsApp messages are received and
-- silently dropped (the webhook swallows the insert error so Meta
-- never retries). Run this in Supabase -> SQL Editor. Safe to re-run.
-- ============================================================

create table if not exists public.wa_messages (
  id             uuid primary key default gen_random_uuid(),
  wa_message_id  text,                    -- Meta's message id (used for de-dup)
  direction      text,                    -- 'in' (inbound) | 'out' (outbound)
  from_number    text,                    -- sender's WhatsApp number
  body           text,                    -- message text / button / list reply title
  msg_type       text,                    -- text | button | interactive | image | ...
  received_at    timestamptz,             -- message timestamp from Meta
  created_at     timestamptz default now()
);

-- Unique index so Prefer: resolution=ignore-duplicates actually de-dups
-- (the webhook can fire the same message id more than once).
create unique index if not exists wa_messages_wa_message_id
  on public.wa_messages (wa_message_id);

create index if not exists wa_messages_from_number on public.wa_messages (from_number);
create index if not exists wa_messages_received_at on public.wa_messages (received_at desc);

alter table public.wa_messages enable row level security;
drop policy if exists wa_messages_all on public.wa_messages;
create policy wa_messages_all on public.wa_messages for all using (true) with check (true);

-- ============================================================
-- Vercel env vars the WhatsApp code ACTUALLY reads (api/meta-publish.js):
--   WA_TOKEN                 (access token from Meta)
--   WA_PHONE_ID              (the phone number ID from WhatsApp Manager)
--   WA_VERIFY_TOKEN          (any string you choose; must match the webhook setup)
--   SUPABASE_URL
--   SUPABASE_SERVICE_KEY     (or SUPABASE_SERVICE_ROLE_KEY — code accepts either)
-- NOTE: ignore the WHATSAPP_* names in tawaslo-whatsapp.sql — those are stale.
-- ============================================================
