-- Tawaslo — run this once in the Supabase SQL editor. Safe to re-run.
-- Adds the two columns the newest features need:
--   • label     → campaign labels / categories on posts (Planner filter + chips)
--   • evergreen → marks posts as recyclable for "Refill calendar"

alter table posts add column if not exists label text;
alter table posts add column if not exists evergreen boolean default false;
