-- Tawaslo — give the post scheduler a real clock.
-- Run this ONCE in Supabase → SQL Editor.
--
-- Postgres calls the publisher every minute by itself, so a post scheduled for
-- 10 PM goes out at 10 PM whether or not anyone has the app open.
--
-- BEFORE RUNNING: replace PASTE_YOUR_CRON_SECRET_HERE below with the value of
-- CRON_SECRET from Vercel → your project → Settings → Environment Variables.
-- The publisher rejects any call without it (that is the 401 you saw).
-- The key is sent as a header, not in the URL, so it stays out of request logs.

-- 1. The scheduler, and the ability to make an HTTP call from the database.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Remove the earlier job if it is already there, so this can be re-run safely.
select cron.unschedule('tawaslo-publish-due-posts')
where exists (select 1 from cron.job where jobname = 'tawaslo-publish-due-posts');

-- 3. Call the publisher every minute, with the key.
select cron.schedule(
  'tawaslo-publish-due-posts',
  '* * * * *',
  $$
    select net.http_get(
      'https://www.tawaslo.com/api/cron',
      '{}'::jsonb,
      jsonb_build_object('x-cron-key', 'PASTE_YOUR_CRON_SECRET_HERE'),
      5000
    );
  $$
);

-- 4. Confirm it exists (should show one row, active = true).
select jobid, jobname, schedule, active from cron.job where jobname = 'tawaslo-publish-due-posts';
