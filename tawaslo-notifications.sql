-- Tawaslo — WhatsApp notification engine settings + opt-in.
-- menus.notify holds per-venue config: { events:{}, contact, host_phone, review_link, rebook_link, lang }
alter table public.menus  add column if not exists notify       jsonb   default '{}'::jsonb;
alter table public.orders add column if not exists notify_optin boolean default true;
alter table public.bookings add column if not exists notify_optin boolean default true;

-- cron dedup flag for timed reservation notifications
alter table public.bookings add column if not exists notified jsonb default '{}'::jsonb;
