-- ============================================================
-- Tawaslo — White-label (Studio tier). Per-agency branding applied
-- to every client-facing surface. Level 2 (custom domain) fields
-- are here too but stay hidden in the UI until enabled.
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- ============================================================

create table if not exists public.agency_branding (
  owner_id     text primary key,        -- the agency user id
  enabled      boolean default false,   -- white-label on/off (Studio tier)
  brand_name   text,                    -- e.g. "Octo Studio"
  logo_url     text,
  accent       text default '#4F6B8C',
  accent2      text,                    -- optional secondary color
  font         text default 'Plus Jakarta Sans',
  footer_text  text,                    -- replaces "Powered by Tawaslo"
  contact      text,                    -- support email / phone shown to clients
  hide_tawaslo boolean default true,    -- hide all Tawaslo branding
  domain       text,                    -- Level 2: custom domain (e.g. links.octostudio.com)
  domain_on    boolean default false,   -- Level 2: custom domain active
  updated_at   timestamptz default now()
);

alter table public.agency_branding enable row level security;
-- Public client-facing pages need to read an agency's branding; the agency writes its own.
drop policy if exists agency_branding_all on public.agency_branding;
create policy agency_branding_all on public.agency_branding for all using (true) with check (true);

-- ============================================================
