-- Tawaslo HQ — persistent error / crash logging.
-- Captures every client crash (agencies AND public menu/order guests) so the
-- founder can see what's breaking from the HQ "Errors" page.
-- Reuses the existing is_tawaslo_admin() helper (supabase_hq_schema.sql).
-- Paste into Supabase -> SQL Editor -> Run. Safe to re-run.

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  message text,
  stack text,
  component_stack text,
  kind text default 'crash',        -- crash | promise | window | manual
  page text,                        -- location.pathname at time of crash
  url text,                         -- full location.href
  user_id uuid,                     -- null for guests
  user_email text,                  -- null/'' for guests
  user_agent text,
  resolved boolean not null default false,
  resolved_at timestamptz
);

create index if not exists error_logs_created_idx  on public.error_logs (created_at desc);
create index if not exists error_logs_resolved_idx on public.error_logs (resolved);

alter table public.error_logs enable row level security;

-- Anyone (incl. anon guests on public menu/order pages) may INSERT a crash.
drop policy if exists error_logs_insert on public.error_logs;
create policy error_logs_insert on public.error_logs
  for insert to anon, authenticated
  with check (true);

-- Only the Tawaslo admin can read / update / delete.
drop policy if exists error_logs_admin_select on public.error_logs;
create policy error_logs_admin_select on public.error_logs
  for select using (public.is_tawaslo_admin());

drop policy if exists error_logs_admin_update on public.error_logs;
create policy error_logs_admin_update on public.error_logs
  for update using (public.is_tawaslo_admin()) with check (public.is_tawaslo_admin());

drop policy if exists error_logs_admin_delete on public.error_logs;
create policy error_logs_admin_delete on public.error_logs
  for delete using (public.is_tawaslo_admin());
