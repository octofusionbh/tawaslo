-- ════════════════════════════════════════════════════════════════════════
--  TAWASLO — TEAM TASKS
--  Assign work to teammates, track accept → done, and drive notifications.
--  Depends on public.is_my_workspace(owner) + public.is_tawaslo_admin()
--  (already created by tawaslo-team-access.sql). Run in Supabase → SQL Editor.
--  Idempotent — safe to re-run.
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.tasks (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null,                 -- the workspace (agency) owner
  title             text not null,
  details           text,
  client_id         uuid,                          -- optional: task about a client
  assigned_to       text,                          -- teammate email
  assigned_to_name  text,
  assigned_by       text,                          -- who assigned it (email)
  assigned_by_name  text,
  status            text not null default 'assigned',  -- assigned | accepted | in_progress | done
  due_at            timestamptz,
  accepted_at       timestamptz,
  done_at           timestamptz,
  created_at        timestamptz default now()
);

create index if not exists tasks_owner_idx    on public.tasks(owner_id);
create index if not exists tasks_assignee_idx on public.tasks(lower(assigned_to));
create index if not exists tasks_status_idx   on public.tasks(status);

-- RLS: anyone in the workspace (owner or active team member) can read/write its tasks.
alter table public.tasks enable row level security;
drop policy if exists tasks_rw on public.tasks;
create policy tasks_rw on public.tasks for all
  using      (public.is_my_workspace(owner_id) or public.is_tawaslo_admin())
  with check (public.is_my_workspace(owner_id) or public.is_tawaslo_admin());

select 'tasks table ready' as status;
