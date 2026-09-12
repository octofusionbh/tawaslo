-- ════════════════════════════════════════════════════════════════════════
--  TAWASLO — Let active team members manage the agency's client social
--  accounts + posts (not just the workspace owner).
--
--  WHY: a later hardening pass locked `social_accounts` (and can lock `posts`)
--  to `owner_id = auth.uid()` — OWNER ONLY. So a team member (e.g. a second
--  founder login) could SEE a client but could not connect an Instagram
--  account to it or load its planner. This restores the intended team-seat
--  behaviour using the existing is_my_workspace() helper, which only grants
--  ACTIVE team members of that specific owner.
--
--  Run in Supabase → SQL Editor. Idempotent (safe to re-run).
--  AFTER RUNNING: log in as the OWNER (octofusionbh) and confirm you still
--  see everything, THEN test the team-member login.
-- ════════════════════════════════════════════════════════════════════════

-- Safety: make sure the workspace helper exists (defined in tawaslo-team-access.sql).
-- If this errors, run tawaslo-team-access.sql first.
-- select public.is_my_workspace(auth.uid());  -- sanity check

-- ── social_accounts: owner OR active team member of the owner ──
alter table public.social_accounts enable row level security;
drop policy if exists social_accounts_all    on public.social_accounts;
drop policy if exists "social_accounts all"  on public.social_accounts;
drop policy if exists social_accounts_owner  on public.social_accounts;
drop policy if exists social_accounts_read   on public.social_accounts;
drop policy if exists social_accounts_write  on public.social_accounts;
drop policy if exists social_accounts_rw     on public.social_accounts;

create policy social_accounts_rw on public.social_accounts
  for all
  using (
    client_id in (select id from public.clients where public.is_my_workspace(owner_id))
    or public.is_tawaslo_admin()
  )
  with check (
    client_id in (select id from public.clients where public.is_my_workspace(owner_id))
    or public.is_tawaslo_admin()
  );

-- ── posts: owner OR active team member of the owner ──
-- (approval links keep their own token-based public policy; this only touches _rw.)
alter table public.posts enable row level security;
drop policy if exists posts_owner on public.posts;
drop policy if exists posts_rw    on public.posts;

create policy posts_rw on public.posts
  for all
  using (
    client_id in (select id from public.clients where public.is_my_workspace(owner_id))
    or public.is_tawaslo_admin()
  )
  with check (
    client_id in (select id from public.clients where public.is_my_workspace(owner_id))
    or public.is_tawaslo_admin()
  );

select 'team social + posts access restored' as status;
