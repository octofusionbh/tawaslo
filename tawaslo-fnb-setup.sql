-- ============================================================
-- Tawaslo — F&B Suite tables (Menu + Reservations)
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- ============================================================

-- ---------- MENU ----------
-- One menu per client (identified by slug for the public page).
create table if not exists public.menus (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.clients(id) on delete cascade,
  slug        text unique not null,
  title       text,
  currency    text default 'BHD',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.menus enable row level security;
drop policy if exists menus_all on public.menus;
create policy menus_all on public.menus for all using (true) with check (true);

create table if not exists public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  menu_id     uuid references public.menus(id) on delete cascade,
  category    text default 'General',
  name_en     text,
  name_ar     text,
  description text,
  price       numeric,
  photo_url   text,
  available   boolean default true,
  sort        int default 0,
  created_at  timestamptz default now()
);
alter table public.menu_items enable row level security;
drop policy if exists menu_items_all on public.menu_items;
create policy menu_items_all on public.menu_items for all using (true) with check (true);

-- ---------- RESERVATIONS ----------
-- Lightweight native bookings (appointments / table reservations).
create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid references public.clients(id) on delete cascade,
  customer_name text,
  customer_phone text,
  party_size    int default 1,
  service       text,                 -- e.g. table, haircut+color
  starts_at     timestamptz not null,
  status        text default 'confirmed',  -- confirmed | cancelled | seated | no_show
  source        text default 'bio',        -- bio | concierge | manual
  note          text,
  created_at    timestamptz default now()
);
alter table public.bookings enable row level security;
drop policy if exists bookings_all on public.bookings;
create policy bookings_all on public.bookings for all using (true) with check (true);

-- Availability rules per client (opening hours + slot length + capacity).
-- Minimal v1: a JSON of weekday windows; the app computes open slots from it.
create table if not exists public.booking_settings (
  client_id     uuid primary key references public.clients(id) on delete cascade,
  slot_minutes  int default 30,
  capacity      int default 1,        -- concurrent bookings per slot
  hours         jsonb default '{}'::jsonb,  -- { "0":["18:00","23:00"], ... } weekday->[open,close]
  updated_at    timestamptz default now()
);
alter table public.booking_settings enable row level security;
drop policy if exists booking_settings_all on public.booking_settings;
create policy booking_settings_all on public.booking_settings for all using (true) with check (true);

-- ============================================================
-- Run this once. The Menu builder + public menu page (built next)
-- read/write menus & menu_items; Reservations uses bookings.
-- ============================================================
