-- ============================================================
-- Tawaslo — Concierge usage metering. Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- Counts concierge replies per client per month; a bump function increments atomically.
-- ============================================================

create table if not exists public.concierge_usage (
  client_id  uuid not null,
  ym         text not null,            -- 'YYYY-MM'
  used       int  default 0,
  topup      int  default 0,           -- extra chats bought this month
  updated_at timestamptz default now(),
  primary key (client_id, ym)
);

alter table public.concierge_usage enable row level security;
drop policy if exists concierge_usage_owner on public.concierge_usage;
create policy concierge_usage_owner on public.concierge_usage
  for select using (client_id in (select id from public.clients where owner_id = auth.uid()));
-- writes happen server-side (service role) via the bump function below.

-- Atomic increment, callable from the API (security definer bypasses RLS).
create or replace function public.bump_concierge(p_client uuid, p_ym text)
returns void language sql security definer set search_path = public as $$
  insert into public.concierge_usage (client_id, ym, used, updated_at)
  values (p_client, p_ym, 1, now())
  on conflict (client_id, ym) do update
    set used = public.concierge_usage.used + 1, updated_at = now();
$$;
grant execute on function public.bump_concierge(uuid, text) to anon, authenticated, service_role;
