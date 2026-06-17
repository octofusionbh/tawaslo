-- Campaign label / category on each post, for organising the Planner and reports.
-- Run once in the Supabase SQL editor. Safe to re-run.

alter table posts add column if not exists label text;
