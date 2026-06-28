-- ============================================================
-- Tawaslo — Agency Invoicing. Agencies bill their own clients with
-- branded invoices, tracked as draft / sent / paid, shared via a
-- login-free link (tawaslo.com/i/<token>).
-- Paste into Supabase -> SQL Editor -> Run. Safe to re-run, and safe
-- even if an "invoices" table already exists (it just adds columns).
-- ============================================================

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid()
);

-- Ensure every column exists (covers a pre-existing invoices table).
alter table public.invoices add column if not exists owner_id     uuid;
alter table public.invoices add column if not exists client_id    uuid;
alter table public.invoices add column if not exists client_name  text;
alter table public.invoices add column if not exists client_email text;
alter table public.invoices add column if not exists number       text;
alter table public.invoices add column if not exists currency     text default 'USD';
alter table public.invoices add column if not exists items        jsonb default '[]'::jsonb;
alter table public.invoices add column if not exists tax_pct      numeric default 0;
alter table public.invoices add column if not exists notes        text;
alter table public.invoices add column if not exists status       text default 'draft';
alter table public.invoices add column if not exists template     text default 'classic';
alter table public.invoices add column if not exists accent       text;
alter table public.invoices add column if not exists due_date     date;
alter table public.invoices add column if not exists issued_date  date default now();
alter table public.invoices add column if not exists token        text;
alter table public.invoices add column if not exists created_at   timestamptz default now();

create index if not exists invoices_owner_idx on public.invoices (owner_id, created_at desc);
create unique index if not exists invoices_token_uniq on public.invoices (token);

alter table public.invoices enable row level security;

-- Owner manages only their own invoices.
drop policy if exists invoices_owner on public.invoices;
create policy invoices_owner on public.invoices
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Public client view: fetch a single invoice by its unguessable token,
-- through a function so anonymous visitors can never list invoices.
create or replace function public.invoice_by_token(p_token text)
returns public.invoices
language sql security definer set search_path = public as $$
  select * from public.invoices where token = p_token limit 1;
$$;
grant execute on function public.invoice_by_token(text) to anon, authenticated;

-- ============================================================
