-- Tawaslo — one column so a published post can keep a small picture.
-- Additive, nullable, safe to run twice. Nothing existing is changed.
--
-- The composer now uploads two copies of every image: the full one Instagram
-- fetches when publishing, and a ~30 kB thumbnail. Once a post goes live the
-- full copy is deleted from storage and image_url is pointed at the thumbnail,
-- so Planner, Calendar and reports still show the picture at a fraction of the
-- size. This column is where that thumbnail's address lives.
alter table public.posts add column if not exists thumb_url text;
