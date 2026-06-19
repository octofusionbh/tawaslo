-- Tawaslo — shareable engagement report snapshots.
-- Run once in Supabase → SQL Editor. Lets tawaslo.com/r/<token> open a saved report.
-- Writes/reads go through /api/cron with the service-role key (bypasses RLS),
-- exactly like the approval flow, so no public policies are required.

create table if not exists public.reports (
  token       text primary key,
  client_name text,
  html        text not null,
  created_at  timestamptz default now()
);

-- RLS on; only the service role (used by /api/cron) can touch it.
alter table public.reports enable row level security;
