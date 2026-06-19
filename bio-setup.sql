-- Link-in-bio storage + public click tracking.
-- Run once in the Supabase SQL editor.

create table if not exists bio_pages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  slug text unique not null,
  title text,
  bio text,
  avatar_url text,
  accent text default '#7C83FF',
  show_posts boolean default true,
  links jsonb default '[]'::jsonb,
  views int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists bio_pages_client_idx on bio_pages(client_id);

alter table bio_pages enable row level security;

-- Public can READ bio pages (they are public landing pages).
drop policy if exists "bio public read" on bio_pages;
create policy "bio public read" on bio_pages for select using (true);

-- Signed-in agency users manage rows. (Tighten to your ownership model if needed.)
drop policy if exists "bio owner write" on bio_pages;
create policy "bio owner write" on bio_pages for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Click tracking: anonymous visitors bump a link's counter via this function only
-- (SECURITY DEFINER lets it update without granting public write on the table).
create or replace function bump_bio_click(p_slug text, p_link_id text)
returns void language plpgsql security definer as $$
begin
  update bio_pages
  set links = (
    select coalesce(jsonb_agg(
      case when (l->>'id') = p_link_id
        then jsonb_set(l, '{clicks}', to_jsonb(coalesce((l->>'clicks')::int, 0) + 1))
        else l end
    ), '[]'::jsonb)
    from jsonb_array_elements(links) l
  )
  where slug = p_slug;
end; $$;

grant execute on function bump_bio_click(text, text) to anon, authenticated;
