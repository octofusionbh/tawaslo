-- Tawaslo — staff order-board link token (login-free live orders for the restaurant).
alter table public.menus add column if not exists kitchen_token text;
