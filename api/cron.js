// api/cron.js — Scheduled-publishing engine.
// An external cron (e.g. cron-job.org) calls this every 1–2 minutes:
//   https://tawaslo.com/api/cron?key=YOUR_CRON_SECRET
// It finds posts whose scheduled time has arrived and publishes them.
//
// Required Vercel env vars:
//   CRON_SECRET                  — any random string; must match the ?key= the cron sends
//   SUPABASE_SERVICE_ROLE_KEY    — Supabase → Settings → API → service_role (server-only; bypasses RLS)
//   SUPABASE_URL  (optional)     — defaults to the project URL below
//   SITE_URL      (optional)     — defaults to https://tawaslo.com (used to call /api/meta-publish)
export const config = { maxDuration: 10 };

const SUPA = process.env.SUPABASE_URL || 'https://gtjmpmhsiyqwhykunosc.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE = process.env.SITE_URL || 'https://tawaslo.com';

// Small PostgREST helper using the service-role key (bypasses Row Level Security).
function sb(path, opts = {}) {
  return fetch(`${SUPA}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
}

export default async function handler(req, res) {
  // Auth — only the cron with the right key may trigger publishing.
  const key = (req.query && req.query.key) || req.headers['x-cron-key'];
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!SERVICE_KEY) {
    return res.status(200).json({ ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY not set in Vercel' });
  }

  const nowIso = new Date().toISOString();
  const results = [];

  try {
    // 1) Find up to 2 due posts (keeps each run under the 10s limit; cron runs often).
    const dueRes = await sb(
      `posts?status=eq.scheduled&scheduled_at=lte.${encodeURIComponent(nowIso)}&select=*&order=scheduled_at.asc&limit=2`
    );
    const due = await dueRes.json();
    if (!Array.isArray(due) || due.length === 0) {
      return res.status(200).json({ ok: true, published: 0, message: 'nothing due' });
    }

    for (const post of due) {
      try {
        // Claim the post (scheduled → publishing) so overlapping runs can't double-publish it.
        await sb(`posts?id=eq.${post.id}&status=eq.scheduled`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'publishing' }),
        });

        // Look up the connected account's token for this post.
        const accRes = await sb(
          `social_accounts?account_id=eq.${encodeURIComponent(post.account_id)}&select=access_token,platform&limit=1`
        );
        const accArr = await accRes.json();
        const acc = Array.isArray(accArr) ? accArr[0] : null;
        if (!acc || !acc.access_token) {
          await sb(`posts?id=eq.${post.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'failed' }) });
          results.push({ id: post.id, ok: false, error: 'no connected account / token' });
          continue;
        }

        const media = post.image_url || '';
        const isVideo = /\.(mp4|mov|webm|m4v)(\?|$)/i.test(media);

        // Publish through the existing publisher (handles IG/FB/LinkedIn).
        const pubRes = await fetch(`${SITE}/api/meta-publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: post.platform,
            accountId: post.account_id,
            accessToken: acc.access_token,
            caption: post.caption || '',
            imageUrl: media && !isVideo ? media : null,
            videoUrl: isVideo ? media : null,
          }),
        });
        const pub = await pubRes.json();
        const ok = !!pub.success;
        await sb(`posts?id=eq.${post.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: ok ? 'published' : 'failed' }),
        });
        results.push({ id: post.id, ok, error: ok ? undefined : (pub.error || 'publish failed') });
      } catch (e) {
        await sb(`posts?id=eq.${post.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'failed' }) });
        results.push({ id: post.id, ok: false, error: e.message });
      }
    }

    return res.status(200).json({ ok: true, published: results.filter(r => r.ok).length, results });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}
