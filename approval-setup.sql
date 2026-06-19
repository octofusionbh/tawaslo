-- ─────────────────────────────────────────────────────────────────────
-- Tawaslo · Client Approvals — database setup
-- Run this once in Supabase → SQL Editor → New query → Run.
-- It adds the columns the approval link needs to the existing posts table.
-- Safe to run more than once (uses IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────────────

alter table public.posts add column if not exists appr_token        text;
alter table public.posts add column if not exists appr_status       text default 'draft';
alter table public.posts add column if not exists appr_comment      text;
alter table public.posts add column if not exists appr_responded_at  timestamptz;
alter table public.posts add column if not exists post_type         text;      -- Single | Carousel | Reel | Story
alter table public.posts add column if not exists media_urls        jsonb;     -- array of image URLs for carousels

-- Fast lookups when a client opens tawaslo.com/a/<token>
create index if not exists posts_appr_token_idx on public.posts (appr_token);

-- No Row Level Security policy is required for the public page: the client
-- page never touches Supabase directly. It calls /api/cron, which uses the
-- service-role key (SUPABASE_SERVICE_ROLE_KEY) server-side and is guarded by
-- the unguessable token in the link. Make sure these are set in Vercel:
--   SUPABASE_URL                = your project URL
--   SUPABASE_SERVICE_ROLE_KEY   = Supabase → Settings → API → service_role
-- (cron.js already uses both for scheduled publishing, so they are likely set.)
