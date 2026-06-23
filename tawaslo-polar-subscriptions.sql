-- ============================================================
-- Tawaslo — Polar subscriptions table (round two)
-- The Polar webhook (api/tap.js) keeps this in sync so the app
-- knows each customer's plan + status without asking Polar live.
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- ============================================================

create table if not exists public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  email                 text,
  customer_id           text,                 -- Polar customer id (for the portal session)
  polar_subscription_id text unique,          -- one row per Polar subscription
  plan                  text,                 -- Essential | Professional | Enterprise
  interval              text,                 -- month | year
  status                text default 'active',-- active | canceled | past_due | revoked
  current_period_end    timestamptz,
  updated_at            timestamptz default now()
);
create index if not exists subscriptions_email_idx on public.subscriptions (email);

alter table public.subscriptions enable row level security;
-- Read is permissive (the app reads the signed-in user's row by email);
-- writes happen server-side via the service role from the webhook.
drop policy if exists subscriptions_read on public.subscriptions;
create policy subscriptions_read on public.subscriptions for select using (true);
drop policy if exists subscriptions_write on public.subscriptions;
create policy subscriptions_write on public.subscriptions for all using (true) with check (true);

-- ============================================================
-- After running this, in Vercel add:  POLAR_API_TOKEN, POLAR_WEBHOOK_SECRET
-- and in Polar add a webhook → https://tawaslo.com/api/tap
-- (events: subscription.created/active/updated/canceled/revoked, order.paid)
-- ============================================================
