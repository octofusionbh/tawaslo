-- Tawaslo — public menu layout choice (Grid photo-cards vs clean List).
-- Idempotent. Run in Supabase → SQL Editor.
alter table public.menus add column if not exists menu_layout text default 'grid';
