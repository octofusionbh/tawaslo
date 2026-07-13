-- Tawaslo — "Share to client" view-only links.
-- A calendar_shares row maps a random token -> a client + month + mode.
-- The client's link (tawaslo.com/a/<token>) loads that month READ-ONLY without
-- touching your posts' status or the auto-publisher. (Approval links keep using
-- the existing appr_token flow — unchanged.)
-- Paste into Supabase -> SQL Editor -> Run. Safe to re-run.

create table if not exists public.calendar_shares (
  token       text primary key,
  client_id   uuid not null,
  ym          text,                 -- 'YYYY-MM' month shared (null = all)
  mode        text not null default 'view',   -- 'view' | 'approve'
  created_at  timestamptz not null default now()
);
create index if not exists calendar_shares_client_idx on public.calendar_shares (client_id);

alter table public.calendar_shares enable row level security;

-- Agency owner (or their workspace members / the admin) can manage their shares.
drop policy if exists calendar_shares_rw on public.calendar_shares;
create policy calendar_shares_rw on public.calendar_shares for all to authenticated
  using ( exists (select 1 from public.clients c where c.id = calendar_shares.client_id and (c.owner_id = auth.uid() or public.is_my_workspace(c.owner_id))) or public.is_tawaslo_admin() )
  with check ( exists (select 1 from public.clients c where c.id = calendar_shares.client_id and (c.owner_id = auth.uid() or public.is_my_workspace(c.owner_id))) or public.is_tawaslo_admin() );
-- (The public client link reads this table server-side via the service role, which bypasses RLS.)
