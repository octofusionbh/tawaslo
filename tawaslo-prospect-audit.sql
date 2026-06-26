-- ============================================================
-- Tawaslo — Pitch in a Click (Prospect Audit) storage + share link.
-- Backs the saved audits list and the public /pitch/<slug> page.
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- ============================================================

create table if not exists public.prospect_audits (
  id          uuid primary key default gen_random_uuid(),
  owner_id    text,                          -- the agency user who made it
  handle      text,                          -- prospect handle (no @)
  platform    text default 'instagram',      -- instagram | tiktok
  mode        text default 'price',          -- price | noprice | deep
  data        jsonb default '{}'::jsonb,      -- audit payload (metrics, findings, fixes, roadmap)
  brand       jsonb default '{}'::jsonb,      -- agency_name, logo_url, accent, package, price, cta
  slug        text unique,                   -- public share link id
  created_at  timestamptz default now()
);
create index if not exists prospect_audits_owner on public.prospect_audits (owner_id, created_at desc);

alter table public.prospect_audits enable row level security;
drop policy if exists prospect_audits_all on public.prospect_audits;
create policy prospect_audits_all on public.prospect_audits for all using (true) with check (true);

-- ============================================================
