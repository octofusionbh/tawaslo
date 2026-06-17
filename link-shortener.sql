-- Branded link shortener (tawaslo.com/s/<code>) with click tracking.
-- Run once in the Supabase SQL editor. Safe to re-run.

create table if not exists short_links (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  url text not null,
  client_id uuid,
  clicks int default 0,
  created_at timestamptz default now()
);
create index if not exists short_links_code_idx on short_links(code);
create index if not exists short_links_client_idx on short_links(client_id);

alter table short_links enable row level security;

drop policy if exists "short public read" on short_links;
create policy "short public read" on short_links for select using (true);

drop policy if exists "short auth write" on short_links;
create policy "short auth write" on short_links for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Redirect helper: increments the click counter and returns the destination URL,
-- in one call, so anonymous visitors can be forwarded + counted.
create or replace function bump_short_click(p_code text)
returns text language plpgsql security definer as $$
declare v_url text;
begin
  update short_links set clicks = clicks + 1 where code = p_code returning url into v_url;
  return v_url;
end; $$;
grant execute on function bump_short_click(text) to anon, authenticated;
