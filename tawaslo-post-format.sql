-- Tawaslo — ensure the post format column exists so scheduled Stories/Reels
-- keep their format (otherwise a scheduled Story publishes as a normal feed post).
-- Idempotent + safe to re-run. (post_type was defined in approval-setup.sql;
-- this just guarantees it's present.)

alter table public.posts add column if not exists post_type text;   -- Single | Carousel | Reel | Story
