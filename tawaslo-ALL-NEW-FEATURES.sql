-- ============================================================
-- Tawaslo — ALL new features in one run.
-- Covers: Desktop menu redesign · Guest Memory + Goodbye message
--         · Guest CRM + Birthday Club · Living Menu · Fill My Tables
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- ============================================================

-- ---------- 1) Desktop menu redesign (theme + cover banner) ----------
alter table public.menus add column if not exists theme     text default 'dark';   -- dark | light
alter table public.menus add column if not exists cover_url text;

-- ---------- 2) Living Menu (weather + popularity + margin) ----------
alter table public.menus      add column if not exists living_on       boolean default false;
alter table public.menus      add column if not exists city            text;
alter table public.menu_items add column if not exists margin_priority int default 0;

create table if not exists public.menu_item_views (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid,
  menu_id     uuid,
  item_id     uuid,
  created_at  timestamptz default now()
);
create index if not exists menu_item_views_recent on public.menu_item_views (menu_id, created_at desc);
alter table public.menu_item_views enable row level security;
drop policy if exists menu_item_views_all on public.menu_item_views;
create policy menu_item_views_all on public.menu_item_views for all using (true) with check (true);

-- ---------- 3) Guest CRM (Guest Memory + Birthday Club + Fill My Tables) ----------
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
alter table public.guests add column if not exists email           text;
alter table public.guests add column if not exists birthday        date;
alter table public.guests add column if not exists allergies       text;
alter table public.guests add column if not exists fav_item        text;
alter table public.guests add column if not exists visits          int     default 0;
alter table public.guests add column if not exists last_visit      timestamptz;
alter table public.guests add column if not exists email_optin     boolean default true;
alter table public.guests add column if not exists wa_optin        boolean default false;
alter table public.guests add column if not exists marketing_optin boolean default false;
alter table public.guests add column if not exists source          text default 'host';
create index if not exists guests_client_email on public.guests (client_id, email);
create index if not exists guests_client_bday  on public.guests (client_id, birthday);

create table if not exists public.birthday_sends (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid,
  guest_id    uuid,
  channel     text,
  year        int,
  sent_at     timestamptz default now()
);
create unique index if not exists birthday_sends_once on public.birthday_sends (guest_id, year, channel);

alter table public.guests         enable row level security;
alter table public.birthday_sends enable row level security;
drop policy if exists guests_all on public.guests;
create policy guests_all on public.guests for all using (true) with check (true);
drop policy if exists birthday_sends_all on public.birthday_sends;
create policy birthday_sends_all on public.birthday_sends for all using (true) with check (true);

-- ---------- 4) Goodbye message (thank + Google review on table clear) ----------
alter table public.review_settings add column if not exists goodbye_on boolean default false;

-- ============================================================
-- Done. All five features are now backed by the database.
-- ============================================================
