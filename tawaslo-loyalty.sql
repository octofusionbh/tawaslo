-- ============================================================
-- Tawaslo — Digital loyalty cards (stamps / points / tiers)
-- No app for the guest — they open a link or scan a table QR.
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- ============================================================

-- One program per restaurant. The vendor picks the type and the reward.
create table if not exists public.loyalty_programs (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid unique,
  enabled          boolean default true,
  type             text default 'stamps',      -- stamps | points | tiers
  stamp_goal       int default 8,              -- stamps needed for a reward
  reward           text,                       -- free text, e.g. "Free coffee"
  points_per_visit int default 10,             -- points earned per visit
  points_goal      int default 100,            -- points needed to redeem
  tiers            jsonb default '[]'::jsonb,  -- [{visits, name, perk}]
  updated_at       timestamptz default now()
);

-- One card per guest per restaurant (keyed by phone, like the Guests CRM).
create table if not exists public.loyalty_cards (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid,
  phone       text,
  name        text,
  stamps      int default 0,                   -- progress toward the current reward
  points      int default 0,
  visits      int default 0,                   -- lifetime visits
  redeemed    int default 0,                   -- rewards claimed
  code        text,                            -- short code shown as the card's QR
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create unique index if not exists loyalty_cards_client_phone on public.loyalty_cards (client_id, phone);
create index if not exists loyalty_cards_client_code on public.loyalty_cards (client_id, code);

alter table public.loyalty_programs enable row level security;
alter table public.loyalty_cards    enable row level security;
drop policy if exists loyalty_programs_all on public.loyalty_programs;
create policy loyalty_programs_all on public.loyalty_programs for all using (true) with check (true);
drop policy if exists loyalty_cards_all on public.loyalty_cards;
create policy loyalty_cards_all on public.loyalty_cards for all using (true) with check (true);

-- ============================================================
