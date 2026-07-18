-- "AI assistant" on the pickup order page. Idempotent — safe to re-run.
-- When ON, the public /order/<slug> page shows an AI helper that builds the
-- guest's cart from chat and drops them at checkout (guest still reviews + pays).
alter table public.menus add column if not exists order_ai boolean default false;
