-- ════════════════════════════════════════════════════════════════════════
--  TAWASLO — SECURITY PASS (Row Level Security)
--  Locks every client's data to that client. Your admin account
--  (octofusionbh@gmail.com) keeps full access for HQ.
--  Run in Supabase → SQL Editor. Safe to re-run.
--  NOTE: run the HQ schema first (it defines is_tawaslo_admin()). This file
--  also (re)creates it, so running this alone is fine too.
-- ════════════════════════════════════════════════════════════════════════

-- Admin gate (idempotent).
create or replace function public.is_tawaslo_admin()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'octofusionbh@gmail.com'
$$;

-- ── 1) CLIENTS — a user owns rows where owner_id = their id ────────────────
alter table public.clients enable row level security;
drop policy if exists clients_rw on public.clients;
create policy clients_rw on public.clients for all
  using      (owner_id = auth.uid() or public.is_tawaslo_admin())
  with check (owner_id = auth.uid() or public.is_tawaslo_admin());

-- ── 2) PROFILES — a user owns the row whose id = their id ──────────────────
alter table public.profiles enable row level security;
drop policy if exists profiles_rw on public.profiles;
create policy profiles_rw on public.profiles for all
  using      (id = auth.uid() or public.is_tawaslo_admin())
  with check (id = auth.uid() or public.is_tawaslo_admin());

-- ── 3) ALL CLIENT-OWNED TABLES ─────────────────────────────────────────────
-- Any table with a client_id column is reachable only if the parent client
-- belongs to the logged-in user (or the user is the admin). Applied
-- dynamically so it only touches tables/columns that actually exist.
do $$
declare t text;
begin
  foreach t in array array[
    'social_accounts','posts','inbox_messages','analytics',
    'campaigns','invoices','listening_topics','media'
  ]
  loop
    if to_regclass('public.'||t) is not null
       and exists (
         select 1 from information_schema.columns
         where table_schema='public' and table_name=t and column_name='client_id'
       ) then
      execute format('alter table public.%I enable row level security;', t);
      execute format('drop policy if exists %I on public.%I;', t||'_rw', t);
      execute format(
        'create policy %I on public.%I for all '
        || 'using (public.is_tawaslo_admin() or exists (select 1 from public.clients c where c.id = %I.client_id and c.owner_id = auth.uid())) '
        || 'with check (public.is_tawaslo_admin() or exists (select 1 from public.clients c where c.id = %I.client_id and c.owner_id = auth.uid()));',
        t||'_rw', t, t, t
      );
      raise notice 'RLS enabled on %', t;
    else
      raise notice 'skipped % (missing table or no client_id column)', t;
    end if;
  end loop;
end $$;

-- ── 4) Check what is now protected ─────────────────────────────────────────
-- Run this SELECT after the above to confirm rowsecurity = true everywhere
-- you expect. Anything still "false" is open and should be reviewed.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by rowsecurity, tablename;

-- ── NOTES ──────────────────────────────────────────────────────────────────
-- • If the check above shows a user-data table still false, tell me its name
--   and columns and I'll add a tailored policy.
-- • MEDIA FILES live in Supabase Storage (not a normal table). Storage has its
--   own RLS under Storage → Policies. Files are pathed `${userId}/...`, so a
--   storage policy of  (storage.foldername(name))[1] = auth.uid()::text
--   restricts each user to their own folder. Set that in the Storage UI.
