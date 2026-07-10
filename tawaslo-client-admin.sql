-- Tawaslo HQ — make admin actions on customers persist.
-- Adds two flags to profiles so the founder can suspend or archive a customer
-- account from the "All Clients" page and have it stick (and actually block a
-- suspended user at login). Neither flag touches billing / Polar.
-- Paste into Supabase -> SQL Editor -> Run. Safe to re-run.

alter table public.profiles add column if not exists suspended boolean not null default false;
alter table public.profiles add column if not exists archived  boolean not null default false;

-- (profiles already has an admin-writable RLS policy: profiles_rw in
--  supabase_security_rls.sql, which allows public.is_tawaslo_admin() full access.)
