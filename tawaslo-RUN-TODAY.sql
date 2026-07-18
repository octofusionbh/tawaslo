-- ============================================================
-- TAWASLO — run this once in Supabase (SQL editor). Idempotent.
-- Covers every schema change from today's session.
-- ============================================================

-- 1) Loyalty card customization (banner + tagline)
alter table public.loyalty_programs add column if not exists banner_url text;
alter table public.loyalty_programs add column if not exists tagline    text;

-- 2) Month-over-month snapshots for the Social report
create table if not exists public.social_snapshots (
  client_id  uuid        not null,
  ym         text        not null,               -- 'YYYY-MM'
  followers  integer     default 0,
  reach      integer     default 0,
  engagement numeric     default 0,
  updated_at timestamptz default now(),
  primary key (client_id, ym)
);
alter table public.social_snapshots enable row level security;
drop policy if exists social_snapshots_rw on public.social_snapshots;
create policy social_snapshots_rw on public.social_snapshots
  for all
  using      (exists (select 1 from public.clients c where c.id = social_snapshots.client_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.clients c where c.id = social_snapshots.client_id and c.owner_id = auth.uid()));

-- 3) HQ page-visibility toggle (hide/unhide pages globally)
create table if not exists public.app_config (
  id         int primary key default 1,
  hidden     jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);
insert into public.app_config (id, hidden)
values (1, '{"streams":"","listening":""}'::jsonb)
on conflict (id) do nothing;
alter table public.app_config enable row level security;
drop policy if exists app_config_read on public.app_config;
create policy app_config_read on public.app_config for select using (true);
drop policy if exists app_config_write on public.app_config;
create policy app_config_write on public.app_config for all
  to authenticated using (true) with check (true);

-- 4) "AI assistant" toggle on the pickup order page
alter table public.menus add column if not exists order_ai boolean default false;

-- Note: the concierge capability toggles (Take pickup orders / Book /
-- Capture enquiries) need NO SQL — they live in booking_settings.hours (jsonb).

-- ============================================================
-- SAFETY NET — older migrations, in case any weren't applied yet.
-- All idempotent; re-running does nothing if already present.
-- ============================================================

-- Pickup ordering (hours, methods, payment, pre-order, notes)
alter table public.menus add column if not exists pickup_open        text  default '08:00';
alter table public.menus add column if not exists pickup_close       text  default '23:00';
alter table public.menus add column if not exists pickup_days_ahead  int   default 7;
alter table public.menus add column if not exists pickup_methods     jsonb default '["inside","carhop"]'::jsonb;
alter table public.menus add column if not exists pickup_pay         text  default 'cash';
alter table public.menu_items add column if not exists lead_hours int     default 0;
alter table public.menu_items add column if not exists dine_in    boolean default true;
alter table public.menu_items add column if not exists allow_note boolean default false;
alter table public.orders add column if not exists note          text;
alter table public.orders add column if not exists pickup_method text;
alter table public.orders add column if not exists car_details   text;

-- Public menu layout (grid vs list)
alter table public.menus add column if not exists menu_layout text default 'grid';

-- Scheduled post format (Story/Reel keep their type)
alter table public.posts add column if not exists post_type text;

-- Staff order-board token
alter table public.menus add column if not exists kitchen_token text;

-- WhatsApp notification engine settings + opt-in
alter table public.menus    add column if not exists notify       jsonb   default '{}'::jsonb;
alter table public.orders   add column if not exists notify_optin boolean default true;
alter table public.bookings add column if not exists notify_optin boolean default true;
alter table public.bookings add column if not exists notified     jsonb   default '{}'::jsonb;
-- ============================================================
