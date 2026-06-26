-- ============================================================
-- Tawaslo — Living Menu (the menu that tunes itself to the
-- moment: weather, daypart, popularity, margin). Paste into
-- Supabase → SQL Editor → Run. Safe to re-run.
-- ============================================================

-- Owner controls, on the menu.
alter table public.menus add column if not exists living_on boolean default false;  -- master switch
alter table public.menus add column if not exists city      text;                   -- for the free weather signal

-- Owner can push high-margin / hero dishes higher. 0 = normal, higher = pushed.
alter table public.menu_items add column if not exists margin_priority int default 0;

-- Lightweight popularity signal: one row per dish view (detail open).
-- We read counts over the last ~48h to find what's trending right now.
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

-- ============================================================
