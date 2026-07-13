-- ============================================================
-- Tawaslo — all database migrations from today's session.
-- Run this ONCE in Supabase -> SQL Editor. Every statement is
-- idempotent (if not exists / add column if not exists), so it's
-- safe to run even if you already ran one of these earlier.
-- ============================================================


-- ─────────────────────────────────────────────────────────
-- tawaslo-error-logs.sql
-- ─────────────────────────────────────────────────────────
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


-- ─────────────────────────────────────────────────────────
-- tawaslo-client-admin.sql
-- ─────────────────────────────────────────────────────────
-- Tawaslo HQ — make admin actions on customers persist.
-- Adds two flags to profiles so the founder can suspend or archive a customer
-- account from the "All Clients" page and have it stick (and actually block a
-- suspended user at login). Neither flag touches billing / Polar.
-- Paste into Supabase -> SQL Editor -> Run. Safe to re-run.

alter table public.profiles add column if not exists suspended boolean not null default false;
alter table public.profiles add column if not exists archived  boolean not null default false;

-- (profiles already has an admin-writable RLS policy: profiles_rw in
--  supabase_security_rls.sql, which allows public.is_tawaslo_admin() full access.)


-- ─────────────────────────────────────────────────────────
-- tawaslo-hq-staff.sql
-- ─────────────────────────────────────────────────────────
-- Tawaslo HQ — let invited staff into the admin console.
-- Adds an 'hq' flag to team_members. When the founder invites someone from the
-- HQ Team page, hq=true, which lets that person enter the admin console (owner
-- mode) with their role. Regular agency invites stay hq=false. Neither touches billing.
-- Paste into Supabase -> SQL Editor -> Run. Safe to re-run.

alter table public.team_members add column if not exists hq boolean not null default false;


-- ─────────────────────────────────────────────────────────
-- tawaslo-menu-payments.sql
-- ─────────────────────────────────────────────────────────
-- Tawaslo — menu online payments via Tap marketplace (split payments).
-- Each restaurant is a Tap "Business" (destination). On a paid order, Tap splits:
-- the restaurant's destination gets (total - your commission); the remainder is
-- your marketplace commission; Tap settles to the restaurant on your chosen
-- frequency (set to daily in your Tap marketplace settings). No IBAN is stored
-- here — the restaurant gives their IBAN to Tap during business onboarding.
-- Paste into Supabase -> SQL Editor -> Run. Safe to re-run.

alter table public.menus  add column if not exists online_pay_enabled boolean not null default false;
alter table public.menus  add column if not exists tap_destination_id  text;                       -- from Tap business onboarding
alter table public.menus  add column if not exists commission_pct      numeric not null default 0; -- Tawaslo's % per order (0 = off)
alter table public.menus  add column if not exists pay_currency        text default 'BHD';

alter table public.orders add column if not exists charge_id    text;
alter table public.orders add column if not exists commission   numeric default 0;
alter table public.orders add column if not exists net_to_host  numeric;
alter table public.orders add column if not exists paid_at      timestamptz;
-- orders.pay_status already exists (values: unpaid | paid | failed).


-- ─────────────────────────────────────────────────────────
-- tawaslo-calendar-shares.sql
-- ─────────────────────────────────────────────────────────
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

