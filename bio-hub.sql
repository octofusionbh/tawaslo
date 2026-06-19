-- Social-hub data for link-in-bio pages: socials, location and hours.
-- Run once in the Supabase SQL editor. Safe to re-run.

alter table bio_pages add column if not exists hub jsonb default '{}'::jsonb;
