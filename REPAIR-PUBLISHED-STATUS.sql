-- Tawaslo — repair posts whose status was overwritten by the calendar bug.
--
-- A post that carries an external_id was definitely published to the network.
-- The old planner save rewrote every post in a month on each save, which pushed
-- some of those live posts back to 'draft' / 'failed' / 'missed'. This sets them
-- back to 'published'. It changes nothing on the networks themselves.
--
-- Look first:
select status, count(*)
from public.posts
where external_id is not null and status <> 'published'
group by status;

-- Then repair:
-- update public.posts
--    set status = 'published'
--  where external_id is not null and status <> 'published';
