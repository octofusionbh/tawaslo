-- Month-over-month snapshots for the Social report. Idempotent.
-- Stores one row per client per month (followers / reach / engagement),
-- so next month the report can show ▲/▼ vs last month.
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

-- Access mirrors the rest of the app: you can read/write snapshots only for
-- clients you own. (Review against your exact RLS model if you use workspaces/teams.)
drop policy if exists social_snapshots_rw on public.social_snapshots;
create policy social_snapshots_rw on public.social_snapshots
  for all
  using      (exists (select 1 from public.clients c where c.id = social_snapshots.client_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.clients c where c.id = social_snapshots.client_id and c.owner_id = auth.uid()));
