-- ============================================================
-- Tawaslo — RLS hardening for clients + social_accounts.
-- Replaces the wide-open using(true)/with check(true) policies
-- with owner scoped rules, WITHOUT breaking public pages.
-- Paste into Supabase -> SQL Editor -> Run. Safe to re-run.
--
-- What this does:
--   social_accounts  -> fully locked to the owning agency. This table
--                       holds access tokens, so anonymous read is closed
--                       completely. Serverless publishing uses the service
--                       role, which bypasses RLS, so posting still works.
--   clients          -> writes (insert / update / delete) are restricted
--                       to the agency that owns the row. Reads stay open
--                       because the public menu, report and approval pages
--                       look up a client's name and logo by id with the
--                       anonymous key. (A follow up will move those public
--                       reads behind a narrow function so reads can close
--                       too. See the note at the bottom.)
--
-- Note on owner_id: clients.owner_id is a uuid holding the auth user id,
-- so we compare it directly against auth.uid() (also uuid) below.
-- ============================================================

-- Make sure RLS is on for both tables.
alter table public.clients         enable row level security;
alter table public.social_accounts enable row level security;

-- ── clients ─────────────────────────────────────────────────
-- Drop the old permissive policy (name may vary across earlier migrations).
drop policy if exists clients_all          on public.clients;
drop policy if exists "clients all"        on public.clients;
drop policy if exists clients_public       on public.clients;
drop policy if exists clients_owner        on public.clients;
drop policy if exists clients_read         on public.clients;
drop policy if exists clients_write        on public.clients;

-- Reads stay open (public pages need name + logo by id).
create policy clients_read on public.clients
  for select using (true);

-- Inserts: the new row must be owned by the signed in user.
create policy clients_insert on public.clients
  for insert with check (owner_id = auth.uid());

-- Updates: only the owner, and they cannot hand the row to someone else.
create policy clients_update on public.clients
  for update using (owner_id = auth.uid())
              with check (owner_id = auth.uid());

-- Deletes: only the owner.
create policy clients_delete on public.clients
  for delete using (owner_id = auth.uid());

-- ── social_accounts ─────────────────────────────────────────
-- This table stores access tokens. Lock it entirely to the agency
-- that owns the parent client. No anonymous access at all.
drop policy if exists social_accounts_all   on public.social_accounts;
drop policy if exists "social_accounts all" on public.social_accounts;
drop policy if exists social_accounts_owner on public.social_accounts;
drop policy if exists social_accounts_read  on public.social_accounts;
drop policy if exists social_accounts_write on public.social_accounts;

create policy social_accounts_owner on public.social_accounts
  for all
  using (
    client_id in (select id from public.clients where owner_id = auth.uid())
  )
  with check (
    client_id in (select id from public.clients where owner_id = auth.uid())
  );

-- ============================================================
-- FOLLOW UP (do later, needs a quick app change + a test pass):
-- To also close anonymous reads on clients, expose only the two
-- public fields through a function and switch the public menu /
-- report / approval pages to call it, then change clients_read to
--   using (owner_id = auth.uid()).
--
--   create or replace function public.client_brand(p_id uuid)
--   returns table (name text, logo_url text)
--   language sql security definer set search_path = public as $$
--     select name, logo_url from public.clients where id = p_id;
--   $$;
--   grant execute on function public.client_brand(uuid) to anon, authenticated;
-- ============================================================
