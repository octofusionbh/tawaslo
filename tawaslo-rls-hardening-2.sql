-- ============================================================
-- Tawaslo — RLS hardening, round two (pre-launch security)
-- Closes the wide-open using(true)/with check(true) policies on
-- billing + guest/PII + F&B tables, WITHOUT breaking the public
-- menu / booking / review pages.
--
-- Model (matches tawaslo-rls-hardening.sql):
--   * clients.owner_id = auth.uid()  (the signed-in agency owner)
--   * child tables scope via client_id -> clients.owner_id
--   * serverless endpoints use the SERVICE ROLE, which bypasses RLS,
--     so webhooks / publishing / server writes keep working.
--   * pattern: a permissive `for select using (true)` keeps PUBLIC
--     pages readable, and a separate `for all ... owner` policy makes
--     INSERT/UPDATE/DELETE owner-only (policies are OR'd).
--
-- Paste into Supabase -> SQL Editor -> Run. Safe to re-run.
-- Test the public menu / booking / review pages after running.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1) SUBSCRIPTIONS  — CRITICAL: was world-writable via anon key
--    (anyone could grant themselves a paid plan). Lock writes to
--    the service role (the Polar webhook), scope reads to own row.
-- ════════════════════════════════════════════════════════════
alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_read  on public.subscriptions;
drop policy if exists subscriptions_write on public.subscriptions;

-- Signed-in user can read ONLY their own subscription row (by email).
create policy subscriptions_read on public.subscriptions
  for select using (email = (auth.jwt() ->> 'email'));

-- No insert/update/delete policy = no anon/authenticated writes.
-- The webhook in api/tap.js uses the service role and bypasses RLS.


-- ════════════════════════════════════════════════════════════
-- 2) GUESTS (PII) + BIRTHDAY_SENDS — close anon reads.
--    Owner gets full access; public flows may still INSERT a guest
--    (self sign-up / booking), but cannot read the guest list.
-- ════════════════════════════════════════════════════════════
alter table public.guests         enable row level security;
alter table public.birthday_sends enable row level security;

drop policy if exists guests_all on public.guests;
create policy guests_owner on public.guests
  for all
  using      (client_id in (select id from public.clients where owner_id = auth.uid()))
  with check (client_id in (select id from public.clients where owner_id = auth.uid()));
-- Allow a public page (booking / self enrol) to add a guest, not read others.
create policy guests_public_insert on public.guests
  for insert with check (true);

drop policy if exists birthday_sends_all on public.birthday_sends;
create policy birthday_sends_owner on public.birthday_sends
  for all
  using      (client_id in (select id from public.clients where owner_id = auth.uid()))
  with check (client_id in (select id from public.clients where owner_id = auth.uid()));
-- (Written by the server/service role; owner can read its own.)


-- ════════════════════════════════════════════════════════════
-- 3) BOOKINGS (PII) — guest can CREATE a booking from the public
--    page; only the owner can read / change them.
--    NOTE: if your public booking page reads existing bookings to
--    show availability via the anon key, that read will now be
--    blocked. Test it; if slots break, move the availability count
--    to a server endpoint (service role) or a security-definer fn.
-- ════════════════════════════════════════════════════════════
alter table public.bookings enable row level security;
drop policy if exists bookings_all on public.bookings;

create policy bookings_owner on public.bookings
  for all
  using      (client_id in (select id from public.clients where owner_id = auth.uid()))
  with check (client_id in (select id from public.clients where owner_id = auth.uid()));
create policy bookings_public_insert on public.bookings
  for insert with check (true);


-- ════════════════════════════════════════════════════════════
-- 4) BOOKING_SETTINGS — public page reads hours/slots; owner writes.
-- ════════════════════════════════════════════════════════════
alter table public.booking_settings enable row level security;
drop policy if exists booking_settings_all on public.booking_settings;

create policy booking_settings_read on public.booking_settings
  for select using (true);
create policy booking_settings_write on public.booking_settings
  for all
  using      (client_id in (select id from public.clients where owner_id = auth.uid()))
  with check (client_id in (select id from public.clients where owner_id = auth.uid()));


-- ════════════════════════════════════════════════════════════
-- 5) MENUS + MENU_ITEMS — public menu page reads; owner writes.
-- ════════════════════════════════════════════════════════════
alter table public.menus      enable row level security;
alter table public.menu_items enable row level security;

drop policy if exists menus_all on public.menus;
create policy menus_read on public.menus
  for select using (true);
create policy menus_write on public.menus
  for all
  using      (client_id in (select id from public.clients where owner_id = auth.uid()))
  with check (client_id in (select id from public.clients where owner_id = auth.uid()));

drop policy if exists menu_items_all on public.menu_items;
create policy menu_items_read on public.menu_items
  for select using (true);
create policy menu_items_write on public.menu_items
  for all
  using (menu_id in (
    select m.id from public.menus m
    join public.clients c on c.id = m.client_id
    where c.owner_id = auth.uid()))
  with check (menu_id in (
    select m.id from public.menus m
    join public.clients c on c.id = m.client_id
    where c.owner_id = auth.uid()));


-- ════════════════════════════════════════════════════════════
-- 6) REVIEWS + REVIEW_SETTINGS — guest can LEAVE a review (insert);
--    review list stays private to the owner. Settings are public-
--    readable (the review page needs google_url / threshold).
-- ════════════════════════════════════════════════════════════
alter table public.reviews         enable row level security;
alter table public.review_settings enable row level security;

drop policy if exists reviews_all on public.reviews;
create policy reviews_owner on public.reviews
  for all
  using      (client_id in (select id from public.clients where owner_id = auth.uid()))
  with check (client_id in (select id from public.clients where owner_id = auth.uid()));
create policy reviews_public_insert on public.reviews
  for insert with check (true);

drop policy if exists review_settings_all on public.review_settings;
create policy review_settings_read on public.review_settings
  for select using (true);
create policy review_settings_write on public.review_settings
  for all
  using      (client_id in (select id from public.clients where owner_id = auth.uid()))
  with check (client_id in (select id from public.clients where owner_id = auth.uid()));


-- ════════════════════════════════════════════════════════════
-- 7) LOYALTY_PROGRAMS — public guest card page reads the program;
--    owner writes. (loyalty_cards is intentionally left as-is for
--    now — see the FOLLOW-UP note; the guest card page reads/updates
--    cards with the anon key, so closing it needs a server fn first.)
-- ════════════════════════════════════════════════════════════
alter table public.loyalty_programs enable row level security;
drop policy if exists loyalty_programs_all on public.loyalty_programs;
create policy loyalty_programs_read on public.loyalty_programs
  for select using (true);
create policy loyalty_programs_write on public.loyalty_programs
  for all
  using      (client_id in (select id from public.clients where owner_id = auth.uid()))
  with check (client_id in (select id from public.clients where owner_id = auth.uid()));


-- ════════════════════════════════════════════════════════════
-- 8) WHATSAPP TABLES — WhatsApp is not live yet, so safe to lock now.
--    Server webhook (service role) writes; owner reads its own threads.
--    (Tables created here too, so this runs in any order — even if you
--    haven't run whatsapp-setup.sql / tawaslo-whatsapp.sql yet.)
-- ════════════════════════════════════════════════════════════
create table if not exists public.wa_threads (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid,
  wa_from     text,
  messages    jsonb default '[]'::jsonb,
  updated_at  timestamptz default now()
);
create table if not exists public.wa_messages (
  id             uuid primary key default gen_random_uuid(),
  wa_message_id  text,
  direction      text,
  from_number    text,
  body           text,
  msg_type       text,
  received_at    timestamptz,
  created_at     timestamptz default now()
);
create unique index if not exists wa_messages_wa_message_id
  on public.wa_messages (wa_message_id);

alter table public.wa_threads  enable row level security;
alter table public.wa_messages enable row level security;

drop policy if exists wa_threads_all on public.wa_threads;
create policy wa_threads_owner on public.wa_threads
  for all
  using      (client_id in (select id from public.clients where owner_id = auth.uid()))
  with check (client_id in (select id from public.clients where owner_id = auth.uid()));

-- wa_messages has no client_id column, so it cannot be owner-scoped by
-- join. It is written by the webhook (service role) only. Lock out anon
-- + authenticated entirely; the inbox must read it via a service-role
-- endpoint. (Zero impact today — no WhatsApp data exists yet.)
drop policy if exists wa_messages_all on public.wa_messages;
create policy wa_messages_none on public.wa_messages
  for all using (false) with check (false);


-- ════════════════════════════════════════════════════════════
-- STILL OPEN ON PURPOSE (low sensitivity / needs app change first):
--   * loyalty_cards     — guest-facing card page reads/updates by code
--                         with the anon key. Needs a security-definer
--                         function before it can be closed.
--   * link_events / menu_item_views — anonymous analytics counters,
--                         no PII; fine to leave open for now.
--   * prospect_audits / agency_branding — not touched here (schema not
--                         verified in this pass); harden in round three.
-- ════════════════════════════════════════════════════════════
