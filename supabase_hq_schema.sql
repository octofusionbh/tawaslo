-- ════════════════════════════════════════════════════════════════════════
--  TAWASLO HQ — database schema (promo codes · gift cards · support)
--  Run this in Supabase → SQL Editor → New query → paste → Run.
--  Safe to re-run: everything uses IF NOT EXISTS / OR REPLACE.
-- ════════════════════════════════════════════════════════════════════════

-- Admin gate: TRUE only when the logged-in user is the Tawaslo owner.
-- This is enforced at the DATABASE level (Row Level Security), so even if
-- someone bypassed the UI they still couldn't read HQ data.
create or replace function public.is_tawaslo_admin()
returns boolean
language sql stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'octofusionbh@gmail.com'
$$;

-- ─────────────────────────────  PROMO CODES  ─────────────────────────────
create table if not exists public.promo_codes (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  discount_type text not null default 'percent' check (discount_type in ('percent','fixed')),
  discount_value numeric not null default 0,
  applies_to    text not null default 'All plans',
  usage_limit   int  not null default 0,        -- 0 = unlimited
  uses          int  not null default 0,
  expiry        date,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
alter table public.promo_codes enable row level security;

drop policy if exists promo_admin_all on public.promo_codes;
create policy promo_admin_all on public.promo_codes
  for all using (public.is_tawaslo_admin()) with check (public.is_tawaslo_admin());

-- Anyone may READ an active, non-expired code (so checkout can validate it).
drop policy if exists promo_public_read on public.promo_codes;
create policy promo_public_read on public.promo_codes
  for select using (active and (expiry is null or expiry >= current_date));

-- ─────────────────────────────  GIFT CARDS  ──────────────────────────────
create table if not exists public.gift_cards (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  amount          numeric not null default 0,
  recipient_email text,
  message         text,
  status          text not null default 'active' check (status in ('active','redeemed','revoked')),
  created_at      timestamptz not null default now(),
  redeemed_at     timestamptz
);
alter table public.gift_cards enable row level security;

drop policy if exists gift_admin_all on public.gift_cards;
create policy gift_admin_all on public.gift_cards
  for all using (public.is_tawaslo_admin()) with check (public.is_tawaslo_admin());

-- ───────────────────────────  SUPPORT TICKETS  ───────────────────────────
create table if not exists public.support_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  client_name text,
  email       text,
  subject     text not null,
  status      text not null default 'open' check (status in ('open','resolved')),
  urgent      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.support_tickets enable row level security;

-- A client can open a ticket and see their own; the admin sees/updates all.
drop policy if exists tickets_insert on public.support_tickets;
create policy tickets_insert on public.support_tickets
  for insert with check (auth.uid() = user_id or public.is_tawaslo_admin());

drop policy if exists tickets_select on public.support_tickets;
create policy tickets_select on public.support_tickets
  for select using (auth.uid() = user_id or public.is_tawaslo_admin());

drop policy if exists tickets_update_admin on public.support_tickets;
create policy tickets_update_admin on public.support_tickets
  for update using (public.is_tawaslo_admin()) with check (public.is_tawaslo_admin());

-- ───────────────────────────  SUPPORT MESSAGES  ──────────────────────────
create table if not exists public.support_messages (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid references public.support_tickets(id) on delete cascade,
  sender     text not null default 'them' check (sender in ('them','us')),
  body       text not null,
  created_at timestamptz not null default now()
);
alter table public.support_messages enable row level security;

drop policy if exists msgs_select on public.support_messages;
create policy msgs_select on public.support_messages
  for select using (
    public.is_tawaslo_admin()
    or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );

drop policy if exists msgs_insert on public.support_messages;
create policy msgs_insert on public.support_messages
  for insert with check (
    public.is_tawaslo_admin()
    or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );

-- ──────────────────────────────  INDEXES  ────────────────────────────────
create index if not exists idx_promo_active   on public.promo_codes(active);
create index if not exists idx_gift_status     on public.gift_cards(status);
create index if not exists idx_tickets_status  on public.support_tickets(status);
create index if not exists idx_messages_ticket on public.support_messages(ticket_id);

-- ─────────────────────  optional: a few seed promo codes  ─────────────────
insert into public.promo_codes (code, discount_type, discount_value, applies_to, usage_limit, expiry)
values
  ('LAUNCH30',  'percent', 30, 'All plans',    100, '2026-12-31'),
  ('BAHRAIN10', 'fixed',   10, 'Essential',     50, '2026-12-31'),
  ('WELCOME',   'percent', 20, 'All plans',      0, null)
on conflict (code) do nothing;

-- Done ✓  HQ now has real tables, locked to the admin account.
