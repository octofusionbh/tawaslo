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
