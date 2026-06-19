-- Mark posts as "evergreen" so they can be recycled to refill the calendar.
-- Run once in the Supabase SQL editor. Safe to re-run.

alter table posts add column if not exists evergreen boolean default false;
