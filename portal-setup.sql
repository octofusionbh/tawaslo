-- Branded client portal: a private token per client for the public portal link.
-- Run once in the Supabase SQL editor. Safe to re-run.

alter table clients add column if not exists portal_token text;
create unique index if not exists clients_portal_token_idx on clients(portal_token) where portal_token is not null;
