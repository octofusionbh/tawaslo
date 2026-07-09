-- ════════════════════════════════════════════════════════════════════════
--  TAWASLO — TEAM ACCESS (members see the agency's clients)
--  This is the "activation switch" for team seats. Until you run this,
--  team members log in and see nothing (owners are completely unaffected).
--  Run in Supabase → SQL Editor. Safe to re-run.
--
--  AFTER RUNNING: log in as the OWNER first and confirm you still see ALL
--  your clients. Then test a member login. If anything looks wrong, this file
--  is idempotent — you can re-run or tell me and I'll adjust.
-- ════════════════════════════════════════════════════════════════════════

-- Admin gate (idempotent — same as the main security file).
create or replace function public.is_tawaslo_admin()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'octofusionbh@gmail.com'
$$;

-- "Is this owner_id a workspace the current user can access?"
-- True if they ARE the owner, OR they're an active team member of that owner.
-- SECURITY DEFINER so the team_members lookup can't be blocked by its own RLS.
create or replace function public.is_my_workspace(owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select owner = auth.uid()
      or exists (
        select 1 from public.team_members tm
        where tm.owner_id = owner
          and tm.member_id = auth.uid()
          and tm.status = 'active'
      );
$$;

-- ── team_members: owner manages the team; a member can read + claim their own row ──
alter table public.team_members enable row level security;
drop policy if exists team_members_access on public.team_members;
create policy team_members_access on public.team_members for all
  using      ( owner_id = auth.uid() or member_id = auth.uid()
               or lower(email) = lower(coalesce(auth.jwt() ->> 'email','')) or public.is_tawaslo_admin() )
  with check ( owner_id = auth.uid() or member_id = auth.uid() or public.is_tawaslo_admin() );

-- ── CLIENTS: owner OR active team member of the owner ──
alter table public.clients enable row level security;
drop policy if exists clients_rw on public.clients;
create policy clients_rw on public.clients for all
  using      (public.is_my_workspace(owner_id) or public.is_tawaslo_admin())
  with check (public.is_my_workspace(owner_id) or public.is_tawaslo_admin());

-- ── ALL CLIENT-OWNED TABLES: reachable if the parent client is in your workspace ──
-- Only touches the '<table>_rw' policy, so any PUBLIC policies (guest orders,
-- public menu reads) are left intact and continue to work.
do $$
declare t text;
begin
  foreach t in array array[
    'social_accounts','posts','inbox_messages','analytics','campaigns','invoices',
    'listening_topics','media','menus','menu_items','orders','bookings',
    'booking_settings','guests','reviews','loyalty_cards','link_events',
    'dining_tables','reports','short_links','concierge_usage'
  ]
  loop
    if to_regclass('public.'||t) is not null
       and exists (select 1 from information_schema.columns
                   where table_schema='public' and table_name=t and column_name='client_id') then
      execute format('alter table public.%I enable row level security;', t);
      execute format('drop policy if exists %I on public.%I;', t||'_rw', t);
      execute format(
        'create policy %I on public.%I for all '
        || 'using (public.is_tawaslo_admin() or exists (select 1 from public.clients c where c.id = %I.client_id and public.is_my_workspace(c.owner_id))) '
        || 'with check (public.is_tawaslo_admin() or exists (select 1 from public.clients c where c.id = %I.client_id and public.is_my_workspace(c.owner_id)));',
        t||'_rw', t, t, t
      );
      raise notice 'team access enabled on %', t;
    else
      raise notice 'skipped % (missing table or no client_id column)', t;
    end if;
  end loop;
end $$;

-- Confirm RLS is on everywhere you expect.
select tablename, rowsecurity from pg_tables where schemaname='public' order by rowsecurity, tablename;
