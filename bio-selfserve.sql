-- Public self-serve bio pages: anyone can claim a page (no agency login) via a
-- secret edit-token. Run once in the Supabase SQL editor. Safe to re-run.

alter table bio_pages add column if not exists owner_email text;
alter table bio_pages add column if not exists edit_token text;
create unique index if not exists bio_pages_edit_token_idx on bio_pages(edit_token) where edit_token is not null;

-- Slug availability (also blocks reserved words).
create or replace function bio_slug_taken(p_slug text)
returns boolean language sql stable as $$
  select exists(select 1 from bio_pages where slug = lower(p_slug))
      or lower(p_slug) = any(array[
        'admin','app','api','login','signin','signup','create','bio','portal','a','r','me',
        'dashboard','tawaslo','www','support','help','about','pricing','contact','terms','privacy','assets','static'
      ]);
$$;
grant execute on function bio_slug_taken(text) to anon, authenticated;

-- Create a self-serve page; returns the secret edit token (or null if slug invalid/taken).
create or replace function create_bio_page(p_slug text, p_email text, p_data jsonb)
returns text language plpgsql security definer as $$
declare v_token text; v_slug text;
begin
  v_slug := lower(regexp_replace(coalesce(p_slug,''), '[^a-z0-9_-]', '', 'g'));
  if length(v_slug) < 3 or bio_slug_taken(v_slug) then return null; end if;
  v_token := md5(random()::text || clock_timestamp()::text || v_slug);
  insert into bio_pages (slug, owner_email, edit_token, title, bio, avatar_url, accent, show_posts, links, hub)
  values (v_slug, p_email, v_token,
    coalesce(p_data->>'title',''), coalesce(p_data->>'bio',''), coalesce(p_data->>'avatar_url',''),
    coalesce(p_data->>'accent','#7C83FF'), coalesce((p_data->>'show_posts')::boolean, false),
    coalesce(p_data->'links','[]'::jsonb), coalesce(p_data->'hub','{}'::jsonb));
  return v_token;
end; $$;
grant execute on function create_bio_page(text, text, jsonb) to anon, authenticated;

-- Update a self-serve page by its edit token.
create or replace function update_bio_page(p_token text, p_data jsonb)
returns boolean language plpgsql security definer as $$
begin
  update bio_pages set
    title = coalesce(p_data->>'title', title),
    bio = coalesce(p_data->>'bio', bio),
    avatar_url = coalesce(p_data->>'avatar_url', avatar_url),
    accent = coalesce(p_data->>'accent', accent),
    links = coalesce(p_data->'links', links),
    hub = coalesce(p_data->'hub', hub),
    updated_at = now()
  where edit_token = p_token;
  return found;
end; $$;
grant execute on function update_bio_page(text, jsonb) to anon, authenticated;
