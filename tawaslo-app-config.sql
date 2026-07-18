-- Global app config for the HQ "Page visibility" admin toggle. Idempotent.
-- Single row (id=1). `hidden` maps a page key -> ISO timestamp of when it was hidden.
-- The app reads this on load to hide/show pages for EVERYONE; the HQ panel writes it.
create table if not exists public.app_config (
  id         int primary key default 1,
  hidden     jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Seed the single row with the current defaults (Streams + Trending hidden).
insert into public.app_config (id, hidden)
values (1, '{"streams":"","listening":""}'::jsonb)
on conflict (id) do nothing;

alter table public.app_config enable row level security;

-- Everyone can READ the hidden list (it's not sensitive; the app needs it to render the nav).
drop policy if exists app_config_read on public.app_config;
create policy app_config_read on public.app_config for select using (true);

-- Writes limited to signed-in users (the panel itself is HQ/owner-only in the UI).
-- Tighten to your admin uid/email later if you want belt-and-suspenders.
drop policy if exists app_config_write on public.app_config;
create policy app_config_write on public.app_config for all
  to authenticated using (true) with check (true);
