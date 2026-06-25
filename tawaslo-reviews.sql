-- ============================================================
-- Tawaslo — Review funnel (private feedback + Google review push)
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- ============================================================

-- One settings row per restaurant.
create table if not exists public.review_settings (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid unique,
  enabled     boolean default true,
  google_url  text,                       -- where happy guests are sent
  threshold   int default 4,              -- >= this rating → Google, below → private
  headline    text,                       -- custom prompt, e.g. "How was your visit?"
  updated_at  timestamptz default now()
);

-- Every rating left by a guest. High ratings route to Google (route='google');
-- low ratings stay private with a comment (route='private') — never public.
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid,
  rating      int,
  name        text,
  phone       text,
  comment     text,
  route       text,                       -- google | private
  created_at  timestamptz default now()
);
create index if not exists reviews_client_idx on public.reviews (client_id, created_at desc);

alter table public.review_settings enable row level security;
alter table public.reviews         enable row level security;
drop policy if exists review_settings_all on public.review_settings;
create policy review_settings_all on public.review_settings for all using (true) with check (true);
drop policy if exists reviews_all on public.reviews;
create policy reviews_all on public.reviews for all using (true) with check (true);

-- ============================================================
