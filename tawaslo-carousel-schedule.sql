-- Carry full carousel + per-slide captions on SCHEDULED posts so the cron publishes them correctly.
alter table public.posts add column if not exists image_urls    jsonb;
alter table public.posts add column if not exists slide_captions jsonb;
alter table public.posts add column if not exists alt_texts      jsonb;
select 'carousel schedule columns ready' as status;
