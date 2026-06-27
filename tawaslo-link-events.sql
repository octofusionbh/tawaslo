-- ============================================================
-- Tawaslo — Link & menu open tracking. Logs every public open
-- (menu, reservation, bio, loyalty, host, short link / QR) so we
-- can show monthly counts per client. Paste into Supabase →
-- SQL Editor → Run. Safe to re-run.
-- ============================================================

create table if not exists public.link_events (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid,
  kind        text,                 -- menu | reserve | bio | loyalty | host | short | qr
  slug        text,                 -- the menu slug or short code (optional)
  created_at  timestamptz default now()
);
create index if not exists link_events_client_time on public.link_events (client_id, created_at desc);
create index if not exists link_events_kind_time   on public.link_events (kind, created_at desc);

alter table public.link_events enable row level security;
-- Public visitors (anonymous) need to insert an open event, and the agency reads counts.
drop policy if exists link_events_all on public.link_events;
create policy link_events_all on public.link_events for all using (true) with check (true);

-- Upgrade the short link click function to also log a dated event per click,
-- so short links / QR codes count toward the monthly totals (keeps the lifetime
-- clicks counter too). Safe even before short_links exists if you ran the
-- link shortener migration first.
create or replace function bump_short_click(p_code text)
returns text language plpgsql security definer as $$
declare v_url text; v_cid uuid;
begin
  update short_links set clicks = clicks + 1 where code = p_code returning url, client_id into v_url, v_cid;
  if v_url is not null then
    insert into public.link_events (client_id, kind, slug) values (v_cid, 'short', p_code);
  end if;
  return v_url;
end; $$;
grant execute on function bump_short_click(text) to anon, authenticated;

-- ============================================================
