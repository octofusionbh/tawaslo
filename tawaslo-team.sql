-- ============================================================
-- Tawaslo — Team members / invites
-- Real team invitations: owner invites by email, invitee accepts
-- on sign-up, and gets access to the owner's workspace.
-- Paste into Supabase -> SQL Editor -> Run. Safe to re-run.
-- ============================================================

create table if not exists public.team_members (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null,               -- the workspace owner (the inviter)
  email       text not null,
  name        text,
  role        text default 'Editor',       -- Admin | Editor | Viewer
  status      text default 'pending',      -- pending | active
  token       text,                        -- accept-link token
  member_id   uuid,                         -- the invitee's auth user id once accepted
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (owner_id, email)
);
create index if not exists team_members_owner  on public.team_members (owner_id);
create index if not exists team_members_member on public.team_members (member_id);
create index if not exists team_members_email  on public.team_members (lower(email));

alter table public.team_members enable row level security;

-- The workspace owner fully manages their own team rows.
drop policy if exists team_members_owner on public.team_members;
create policy team_members_owner on public.team_members
  for all
  using      (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- An invitee can READ invites addressed to their email or already linked to them.
drop policy if exists team_members_self_read on public.team_members;
create policy team_members_self_read on public.team_members
  for select
  using (member_id = auth.uid()
         or lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- An invitee can CLAIM (accept) an invite addressed to their email:
-- they may set member_id to themselves and flip status to active.
drop policy if exists team_members_self_claim on public.team_members;
create policy team_members_self_claim on public.team_members
  for update
  using      (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (member_id = auth.uid());

-- ============================================================
-- COMMIT 2 (workspace access) adds membership to social_accounts RLS so
-- members can publish with the owner's connected accounts. That SQL ships
-- with the access change so it's tested together.
-- ============================================================
