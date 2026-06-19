-- ════════════════════════════════════════════════════════════════════════
--  TAWASLO — store each published post's platform ID, permalink & publish time.
--  This is the groundwork for "View post ↗" links and per-post insight reports.
--  Run in Supabase → SQL Editor. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════

alter table public.posts add column if not exists external_id   text;        -- the platform's post/media id (used to fetch insights later)
alter table public.posts add column if not exists permalink     text;        -- public link to the live post
alter table public.posts add column if not exists published_at  timestamptz; -- when it actually went out

-- (optional) speed up "show me this client's published posts"
create index if not exists idx_posts_published on public.posts (client_id, published_at desc);

-- Done ✓
