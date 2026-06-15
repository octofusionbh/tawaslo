-- Tawaslo — team-shared Brand Voice + engagement log.
-- Run once in Supabase → SQL Editor. Moves Brand Voice and the inbox
-- engagement log off the browser and onto your account, so they're shared
-- across every device and your whole team.

-- 1) Brand voice lives on the client record (owner RLS already scopes it).
alter table public.clients add column if not exists brand_voice jsonb;

-- 2) Engagement events — append-only log behind the report.
create table if not exists public.engagement_events (
  id          bigint generated always as identity primary key,
  client_id   text,
  kind        text,
  platform    text,
  type        text,
  ai          boolean default false,
  rt          integer,
  created_at  timestamptz default now()
);
create index if not exists engagement_events_client_idx on public.engagement_events (client_id, created_at);

alter table public.engagement_events enable row level security;

-- Logged-in users can read and append engagement events (events are keyed by client_id).
drop policy if exists "eng read" on public.engagement_events;
create policy "eng read"   on public.engagement_events for select using (auth.role() = 'authenticated');
drop policy if exists "eng insert" on public.engagement_events;
create policy "eng insert" on public.engagement_events for insert with check (auth.role() = 'authenticated');
