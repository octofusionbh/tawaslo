-- ============================================================
-- Tawaslo — Pickup Ordering. Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- ============================================================

-- Menu display mode + pickup settings
alter table public.menus add column if not exists photo_mode        text default 'all';        -- all | none | per_item
alter table public.menus add column if not exists pickup_enabled    boolean default false;
alter table public.menus add column if not exists pickup_pay_mode   text default 'at_pickup';  -- online | at_pickup
alter table public.menus add column if not exists pickup_prep_min   int default 20;
alter table public.menus add column if not exists pickup_min_order  numeric default 0;
alter table public.menus add column if not exists tap_destination_id text;
alter table public.menus add column if not exists commission_pct    numeric default 0;

-- Per-item toggles
alter table public.menu_items add column if not exists show_photo boolean default true;
alter table public.menu_items add column if not exists on_pickup  boolean default false;

-- Orders
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid,
  menu_id        uuid,
  order_no       text,
  customer_name  text,
  customer_phone text,
  items          jsonb default '[]'::jsonb,
  subtotal       numeric default 0,
  fee            numeric default 0,
  total          numeric default 0,
  currency       text default 'BHD',
  status         text default 'new',       -- new | accepted | preparing | ready | picked_up | cancelled
  pay_status     text default 'unpaid',    -- unpaid | paid | refunded
  pay_ref        text,
  pickup_at      timestamptz,
  note           text,
  created_at     timestamptz default now()
);
create index if not exists orders_client_idx on public.orders (client_id, created_at desc);

alter table public.orders enable row level security;
drop policy if exists orders_owner on public.orders;
create policy orders_owner on public.orders
  for all
  using      (client_id in (select id from public.clients where owner_id = auth.uid()))
  with check (client_id in (select id from public.clients where owner_id = auth.uid()));
drop policy if exists orders_public_insert on public.orders;
create policy orders_public_insert on public.orders for insert with check (true);
