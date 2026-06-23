-- ============================================================
-- Tawaslo — F&B Suite: Floor plan (host/seating) + Guest CRM
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- Requires the earlier tawaslo-fnb-setup.sql (bookings, etc.).
-- ============================================================

-- ---------- ROOMS (areas: Main Hall, Terrace, …) ----------
create table if not exists public.dining_rooms (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.clients(id) on delete cascade,
  name        text not null default 'Main',
  sort        int default 0,
  created_at  timestamptz default now()
);
alter table public.dining_rooms enable row level security;
drop policy if exists dining_rooms_all on public.dining_rooms;
create policy dining_rooms_all on public.dining_rooms for all using (true) with check (true);

-- ---------- TABLES (the floor plan; x/y for drag-and-drop) ----------
create table if not exists public.dining_tables (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.clients(id) on delete cascade,
  room_id     uuid references public.dining_rooms(id) on delete cascade,
  name        text not null,
  seats       int default 2,
  shape       text default 'square',   -- square | round | rect
  pos_x       int default 40,
  pos_y       int default 40,
  created_at  timestamptz default now()
);
alter table public.dining_tables enable row level security;
drop policy if exists dining_tables_all on public.dining_tables;
create policy dining_tables_all on public.dining_tables for all using (true) with check (true);

-- ---------- GUESTS (CRM overlay; stats are computed from bookings) ----------
-- One row per customer per client. Tags / notes / preferences / VIP persist here;
-- visits, covers, no-shows and last-visit are derived live from the bookings table.
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
alter table public.guests enable row level security;
drop policy if exists guests_all on public.guests;
create policy guests_all on public.guests for all using (true) with check (true);

-- ---------- Link a booking to the table it was seated at ----------
alter table public.bookings add column if not exists table_id   uuid;
alter table public.bookings add column if not exists seated_at   timestamptz;

-- ============================================================
-- Run once. The Reservations page gains two tabs:
--   • Floor  — arrange tables (drag-and-drop) + seat guests live
--   • Guests — auto-built CRM profile per customer
-- ============================================================
