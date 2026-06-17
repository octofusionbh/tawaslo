-- Store each client's products/keywords so "Upcoming occasions" can match niche
-- national days (coffee, bagels, spa, hotel…) and so it syncs across the team.
-- Run once in the Supabase SQL editor. Safe to re-run.

alter table clients add column if not exists products text;
