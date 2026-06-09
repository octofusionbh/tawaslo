-- ════════════════════════════════════════════════════════════════════════
--  TAWASLO — Campaigns table
--  Lets users group posts into named campaigns and track them against a goal.
--  The Campaigns page works without this (it shows sample campaigns and lets
--  you create them in-session); running this makes created campaigns persist.
--  Run in Supabase -> SQL Editor. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.clients(id) on delete cascade,
  name        text not null,
  goal        text,
  status      text default 'active',          -- active | scheduled | completed
  platform    text default 'all',
  start_date  date,
  end_date    date,
  post_count  int default 0,
  reach       int default 0,
  engagement  numeric default 0,
  created_at  timestamptz default now()
);

create index if not exists idx_campaigns_client on public.campaigns (client_id, created_at desc);

alter table public.campaigns enable row level security;

-- Owner of the client (or the Tawaslo admin) can manage that client's campaigns.
drop policy if exists "campaigns owner access" on public.campaigns;
create policy "campaigns owner access" on public.campaigns
  for all
  using (
    client_id in (select id from public.clients where owner_id = auth.uid())
    or (auth.jwt() ->> 'email') = 'octofusionbh@gmail.com'
  )
  with check (
    client_id in (select id from public.clients where owner_id = auth.uid())
    or (auth.jwt() ->> 'email') = 'octofusionbh@gmail.com'
  );

-- Done.
