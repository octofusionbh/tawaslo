-- Loyalty card customization (banner + tagline). Idempotent — safe to re-run.
-- Everything else about the card (brand_color, theme, stamp_icon, welcome) already existed.
alter table public.loyalty_programs add column if not exists banner_url text;
alter table public.loyalty_programs add column if not exists tagline    text;
