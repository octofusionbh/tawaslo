-- First-comment scheduling: store the auto-first-comment on scheduled posts so the
-- cron can post it when the post goes live. Run once in Supabase. Safe to re-run.
-- (Immediate "Publish now" posts work without this; it's only needed for SCHEDULED posts.)

alter table posts add column if not exists first_comment text;
