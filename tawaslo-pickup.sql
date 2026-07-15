-- ════════════════════════════════════════════════════════════════════════
--  TAWASLO — PICKUP ORDERING (hours, methods, payment, pre-order, notes)
--  Run in Supabase → SQL Editor. Idempotent — safe to run/re-run anytime.
-- ════════════════════════════════════════════════════════════════════════

-- Menu-level pickup settings
alter table public.menus add column if not exists pickup_open        text    default '08:00';   -- opening time (HH:MM)
alter table public.menus add column if not exists pickup_close       text    default '23:00';   -- closing time (HH:MM)
alter table public.menus add column if not exists pickup_days_ahead  int     default 7;         -- how many days ahead customers can order
alter table public.menus add column if not exists pickup_methods     jsonb   default '["inside","carhop"]'::jsonb;  -- offered methods
alter table public.menus add column if not exists pickup_pay         text    default 'cash';    -- 'cash' | 'online' | 'both'

-- Per-item controls
alter table public.menu_items add column if not exists lead_hours int     default 0;      -- advance notice (0 = same-day, 24/48 = pre-order)
alter table public.menu_items add column if not exists dine_in    boolean default true;   -- show on the dine-in / browse menu
alter table public.menu_items add column if not exists allow_note boolean default false;  -- customer can add a per-item note

-- Order details
alter table public.orders add column if not exists note          text;   -- kitchen note from the customer
alter table public.orders add column if not exists pickup_method text;   -- 'inside' | 'carhop'
alter table public.orders add column if not exists car_details   text;   -- car colour + model + plate (Car Hop)
-- (orders.pickup_at already exists from the earlier pickup work.)
