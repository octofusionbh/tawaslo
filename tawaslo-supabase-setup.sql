-- ============================================================
-- Tawaslo — Supabase setup for Campaigns, Short links, Bio pages
-- Paste this whole file into  Supabase → SQL Editor → Run.
-- Safe to re-run: everything uses "if not exists" / "or replace".
-- ============================================================

-- ---------- 1) CAMPAIGNS ----------
create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.clients(id) on delete cascade,
  name        text not null,
  goal        text,
  status      text default 'active',          -- active | scheduled | completed
  start_date  date,
  end_date    date,
  platform    text,                            -- comma-separated platforms
  post_count  int     default 0,
  reach       int     default 0,
  engagement  numeric default 0,
  created_at  timestamptz default now()
);
alter table public.campaigns enable row level security;
drop policy if exists campaigns_all on public.campaigns;
create policy campaigns_all on public.campaigns for all using (true) with check (true);


-- ---------- 2) SHORT LINKS (tawaslo.com/s/<code>) ----------
create table if not exists public.short_links (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  url         text not null,
  client_id   uuid references public.clients(id) on delete set null,
  clicks      int default 0,
  created_at  timestamptz default now()
);
alter table public.short_links enable row level security;
drop policy if exists short_links_all on public.short_links;
create policy short_links_all on public.short_links for all using (true) with check (true);

-- Click counter used by the /s/<code> redirect: increments clicks and returns the URL.
create or replace function public.bump_short_click(p_code text)
returns text
language plpgsql
security definer
as $$
declare v_url text;
begin
  update public.short_links
     set clicks = clicks + 1
   where code = p_code
   returning url into v_url;
  return v_url;   -- null if the code doesn't exist
end;
$$;
grant execute on function public.bump_short_click(text) to anon, authenticated;


-- ---------- 3) BIO PAGES (Link in bio) ----------
create table if not exists public.bio_pages (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.clients(id) on delete cascade,
  slug        text unique not null,
  title       text,
  bio         text,
  avatar_url  text,
  accent      text,
  show_posts  boolean default true,
  links       jsonb default '[]'::jsonb,
  hub         jsonb default '{}'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.bio_pages enable row level security;
drop policy if exists bio_pages_all on public.bio_pages;
create policy bio_pages_all on public.bio_pages for all using (true) with check (true);

-- ============================================================
-- NOTE ON SECURITY: the policies above are permissive (anyone with the
-- anon key can read/write), matching a single-tenant setup. If you later
-- want per-account isolation, replace the "using (true)" policies with
-- ones scoped to auth.uid() / client ownership.
-- ============================================================
