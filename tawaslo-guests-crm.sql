-- ============================================================
-- Tawaslo — Guest CRM upgrade (backbone for Guest Memory,
-- Birthday Club, and Fill My Tables). Extends the existing
-- public.guests table with contact + birthday + opt-in fields.
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- ============================================================

-- Base table (for fresh installs; existing installs already have it).
create table if not exists public.guests (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid references public.clients(id) on delete cascade,
  phone        text,
  name         text,
  vip          boolean default false,
  tags         jsonb default '[]'::jsonb,
  preferences  text,
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (client_id, phone)
);

-- New CRM / Birthday Club fields (added to existing tables too).
alter table public.guests add column if not exists email           text;
alter table public.guests add column if not exists birthday        date;     -- for the Birthday Club
alter table public.guests add column if not exists allergies       text;     -- e.g. "nuts, shellfish"
alter table public.guests add column if not exists fav_item        text;     -- usual order (host-set or learned)
alter table public.guests add column if not exists visits          int     default 0;
alter table public.guests add column if not exists last_visit      timestamptz;
alter table public.guests add column if not exists email_optin     boolean default true;   -- ok to email
alter table public.guests add column if not exists wa_optin        boolean default false;  -- ok to WhatsApp
alter table public.guests add column if not exists marketing_optin boolean default false;  -- ok for Fill-My-Tables offers
alter table public.guests add column if not exists source          text default 'host';    -- host | self | booking | loyalty

create index if not exists guests_client_email on public.guests (client_id, email);
create index if not exists guests_client_bday  on public.guests (client_id, birthday);

-- Log of birthday wishes already sent, so nobody gets two in one year.
create table if not exists public.birthday_sends (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid,
  guest_id    uuid,
  channel     text,                            -- email | whatsapp
  year        int,                             -- the birthday year it covered
  sent_at     timestamptz default now()
);
create unique index if not exists birthday_sends_once on public.birthday_sends (guest_id, year, channel);

-- Host-stand goodbye: thank the guest + ask for a Google review on table clear.
alter table public.review_settings add column if not exists goodbye_on boolean default false;

alter table public.guests         enable row level security;
alter table public.birthday_sends enable row level security;
drop policy if exists guests_all on public.guests;
create policy guests_all on public.guests for all using (true) with check (true);
drop policy if exists birthday_sends_all on public.birthday_sends;
create policy birthday_sends_all on public.birthday_sends for all using (true) with check (true);

-- ============================================================
