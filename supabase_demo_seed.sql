-- ════════════════════════════════════════════════════════════════════════
--  TAWASLO — DEMO ACCOUNT SEED  (for the investor demo)
--  Fills the demo login with 3 flagship client brands + connected accounts
--  + scheduled & published posts, all with consistent, believable numbers.
--  Your real account is NOT touched.
--
--  STEP 1 (do this first, in the Supabase dashboard):
--    Authentication → Users → "Add user" →
--      email:    demo@tawaslo.com
--      password: TawasloDemo2026!
--      ✅ tick "Auto Confirm User"
--    Create.
--
--  STEP 2: run this whole file in SQL Editor.  Safe to re-run (it resets
--          the demo data each time, never touching other accounts).
-- ════════════════════════════════════════════════════════════════════════

-- ── SCHEMA REPAIR ─────────────────────────────────────────────────────────
-- Ensure every column the app writes actually exists. This fixes the demo seed
-- AND repairs real production: missing columns were silently breaking profile
-- creation on signup and post creation/scheduling.
alter table public.profiles add column if not exists account_type text;
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists plan         text;
alter table public.profiles add column if not exists role         text;
alter table public.profiles add column if not exists website      text;

alter table public.clients  add column if not exists account_type text;
alter table public.clients  add column if not exists is_free      boolean default false;

alter table public.posts    add column if not exists account_id   text;
alter table public.posts    add column if not exists image_url    text;
alter table public.posts    add column if not exists external_id  text;
alter table public.posts    add column if not exists permalink    text;
alter table public.posts    add column if not exists published_at timestamptz;

do $$
declare
  uid uuid;
  c1 uuid; c2 uuid; c3 uuid;
begin
  select id into uid from auth.users where email = 'demo@tawaslo.com' limit 1;
  if uid is null then
    raise notice 'No demo@tawaslo.com user found — create it in Authentication → Users first, then re-run.';
    return;
  end if;

  -- Profile (so it loads as an Agency workspace)
  insert into public.profiles (id, name, email, plan, role, account_type, company_name)
  values (uid, 'Tawaslo Demo', 'demo@tawaslo.com', 'professional', 'owner', 'agency', 'Tawaslo Agency')
  on conflict (id) do update set account_type = 'agency', name = 'Tawaslo Demo', company_name = 'Tawaslo Agency';

  -- Clean any previous demo seed (scoped to this demo user only)
  delete from public.posts          where client_id in (select id from public.clients where owner_id = uid);
  delete from public.social_accounts where client_id in (select id from public.clients where owner_id = uid);
  delete from public.clients         where owner_id = uid;

  -- 3 flagship client brands
  insert into public.clients (owner_id, name, plan, status, is_free) values (uid, 'Marina Café & Bistro', 'Professional', 'active', false) returning id into c1;
  insert into public.clients (owner_id, name, plan, status, is_free) values (uid, 'Lumière Fashion',      'Enterprise',   'active', false) returning id into c2;
  insert into public.clients (owner_id, name, plan, status, is_free) values (uid, 'Gulf Auto Group',      'Professional', 'active', false) returning id into c3;

  -- Connected accounts — followers sum to ~77K across the agency
  insert into public.social_accounts (client_id, platform, account_name, username, followers_count, is_active, account_id, access_token) values
    (c1, 'ig', 'Marina Café & Bistro', 'marinacafe',       18420, true, 'demo_ig_1', 'demo'),
    (c1, 'fb', 'Marina Café & Bistro', 'marinacafe',        9230, true, 'demo_fb_1', 'demo'),
    (c2, 'ig', 'Lumière Fashion',      'lumiere.fashion',  22140, true, 'demo_ig_2', 'demo'),
    (c2, 'tt', 'Lumière Fashion',      'lumiere',          14800, true, 'demo_tt_2', 'demo'),
    (c3, 'ig', 'Gulf Auto Group',      'gulfauto.bh',       7860, true, 'demo_ig_3', 'demo'),
    (c3, 'fb', 'Gulf Auto Group',      'gulfautogroup',     5120, true, 'demo_fb_3', 'demo');

  -- Upcoming (scheduled) posts — populate the Planner
  insert into public.posts (client_id, platform, account_id, caption, status, scheduled_at) values
    (c1, 'ig', 'demo_ig_1', 'New summer menu just dropped ☀️ Come taste the season.',  'scheduled', now() + interval '3 hours'),
    (c1, 'fb', 'demo_fb_1', 'Weekend brunch is back — book your table now.',           'scheduled', now() + interval '1 day'),
    (c2, 'ig', 'demo_ig_2', 'The new collection is here. Bold, effortless, you.',       'scheduled', now() + interval '5 hours'),
    (c2, 'tt', 'demo_tt_2', 'Behind the seams of our latest drop 🧵',                  'scheduled', now() + interval '2 days'),
    (c3, 'ig', 'demo_ig_3', 'The 2026 lineup has arrived. Book a test drive today.',    'scheduled', now() + interval '6 hours'),
    (c3, 'fb', 'demo_fb_3', 'Customer spotlight: meet the all-new GT.',                 'scheduled', now() + interval '3 days');

  -- Recently published posts — populate history & post counts
  insert into public.posts (client_id, platform, account_id, caption, status, published_at) values
    (c1, 'ig', 'demo_ig_1', 'Sunday vibes at Marina ☕',                    'published', now() - interval '2 days'),
    (c1, 'fb', 'demo_fb_1', 'Thank you for an amazing weekend! ❤️',          'published', now() - interval '3 days'),
    (c2, 'ig', 'demo_ig_2', 'Campaign shoot day 📸 swipe for BTS.',          'published', now() - interval '4 days'),
    (c2, 'tt', 'demo_tt_2', 'Styling one piece three ways ✨',               'published', now() - interval '5 days'),
    (c3, 'ig', 'demo_ig_3', 'Customer spotlight: meet the new GT.',          'published', now() - interval '6 days'),
    (c3, 'fb', 'demo_fb_3', 'Service month — free check-up all June.',       'published', now() - interval '8 days');

  raise notice 'Demo seeded ✓ for % — 3 brands, 6 accounts, 12 posts', uid;
end $$;

-- Verify
select c.name as client, count(distinct s.id) as accounts, sum(s.followers_count) as followers
from public.clients c
left join public.social_accounts s on s.client_id = c.id
where c.owner_id = (select id from auth.users where email = 'demo@tawaslo.com')
group by c.name order by followers desc nulls last;
