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
  // ── Public client approval endpoint (no cron key needed) ──────────────
  // The login-free client page (tawaslo.com/a/<token>) posts here to load a
  // batch of posts for a token and to record approve / request-changes
  // decisions. Guarded by the unguessable token, not the cron secret.
  if (req.method === 'POST' && req.body && req.body.action) {
    if (!SERVICE_KEY) return res.status(200).json({ unconfigured: true, posts: [] });
    const { action, token } = req.body;
    if (!token) return res.status(400).json({ error: 'token required' });
    try {
      if (action === 'load') {
        const r = await sb(`posts?appr_token=eq.${encodeURIComponent(token)}&select=*&order=scheduled_at.asc`);
        const rows = r.ok ? await r.json() : [];
        const posts = (rows || []).map((row) => {
          const d = row.scheduled_at ? new Date(row.scheduled_at) : new Date();
          let media = [];
          try { if (Array.isArray(row.media_urls)) media = row.media_urls; else if (typeof row.media_urls === 'string' && row.media_urls) media = JSON.parse(row.media_urls); } catch (e) { media = []; }
          if (!media.length && row.image_url) media = [row.image_url];
          return {
            id: row.id, caption: row.caption || '', platform: row.platform || 'ig',
            type: row.post_type || 'Single', media,
            status: row.appr_status || 'pending', comment: row.appr_comment || '',
            date: d.getDate(), day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          };
        });
        // White-label: resolve the owning agency's brand so the client page can wear it.
        let agency = null, client = null, brand = null;
        try {
          const cid = rows[0] && rows[0].client_id;
          if (cid) {
            const cr = await sb(`clients?id=eq.${encodeURIComponent(cid)}&select=name,owner_id,logo_url&limit=1`);
            const c = (cr.ok ? await cr.json() : [])[0];
            if (c) {
              client = { name: c.name };
              if (c.owner_id) {
                const pr = await sb(`profiles?id=eq.${encodeURIComponent(c.owner_id)}&select=name,company_name&limit=1`);
                const prof = (pr.ok ? await pr.json() : [])[0] || {};
                const br = await sb(`agency_branding?owner_id=eq.${encodeURIComponent(c.owner_id)}&select=*&limit=1`);
                const b = (br.ok ? await br.json() : [])[0];
                if (b && b.enabled) {
                  brand = b;
                  agency = { name: b.brand_name || prof.company_name || prof.name || 'Your agency', logo: b.logo_url || null };
                } else {
                  agency = { name: prof.company_name || prof.name || 'Your agency', logo: c.logo_url || null };
                }
              }
            }
          }
        } catch (e) { /* branding is best-effort */ }
        const now = new Date();
        return res.status(200).json({ posts, agency, client, brand, month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), expires: 7, firstDow: new Date(now.getFullYear(), now.getMonth(), 1).getDay(), days: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() });
      }
      if (action === 'respond') {
        const { postId, decision, comment } = req.body;
        await sb(`posts?id=eq.${encodeURIComponent(postId)}&appr_token=eq.${encodeURIComponent(token)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ appr_status: decision, appr_comment: comment || null, appr_responded_at: new Date().toISOString() }) });
        return res.status(200).json({ ok: true });
      }
      if (action === 'respondAll') {
        const { decision, comment } = req.body;
        const patch = { appr_status: decision, appr_responded_at: new Date().toISOString() };
        if (comment) patch.appr_comment = comment;
        await sb(`posts?appr_token=eq.${encodeURIComponent(token)}&appr_status=in.(pending,revised)`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(patch) });
        return res.status(200).json({ ok: true });
      }
      // ── Shareable engagement report (tawaslo.com/r/<token>) ──────────────
      if (action === 'report-save') {
        const { html, clientName } = req.body;
        if (!html) return res.status(400).json({ error: 'html required' });
        await sb('reports', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ token, client_name: clientName || null, html, created_at: new Date().toISOString() }) });
        return res.status(200).json({ ok: true, token });
      }
      if (action === 'report-load') {
        const r = await sb(`reports?token=eq.${encodeURIComponent(token)}&select=html,client_name&limit=1`);
        const rows = r.ok ? await r.json() : [];
        if (!rows.length) return res.status(200).json({ notfound: true });
        return res.status(200).json({ html: rows[0].html, clientName: rows[0].client_name });
      }
      return res.status(400).json({ error: 'unknown action' });
    } catch (e) { return res.status(200).json({ error: e.message, posts: [] }); }
  }

  // Auth — only the cron with the right key may trigger publishing.
  const key = (req.query && req.query.key) || req.headers['x-cron-key'];
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!SERVICE_KEY) {
    return res.status(200).json({ ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY not set in Vercel' });
  }

  // ── SAFETY GATE ──────────────────────────────────────────────────────
  // Auto-publishing stays OFF until you explicitly enable it (set PUBLISH_ENABLED=1
  // in Vercel). This guarantees no approved/scheduled test post can ever go live by
  // accident during setup. Flip it on only when you're truly ready to publish for real.
  if (process.env.PUBLISH_ENABLED !== '1') {
    return res.status(200).json({ ok: true, published: 0, message: 'auto-publishing disabled — set PUBLISH_ENABLED=1 in Vercel to enable' });
  }

  const nowIso = new Date().toISOString();
  const results = [];

  try {
    // 1) Find up to 2 due posts (keeps each run under the 10s limit; cron runs often).
    //    Approval gate: only publish posts that were never sent for approval
    //    (no token) OR have been approved by the client. Anything still pending
    //    or with changes requested is held back until it's approved.
    const dueRes = await sb(
      `posts?status=eq.scheduled&scheduled_at=lte.${encodeURIComponent(nowIso)}&or=(appr_token.is.null,appr_status.eq.approved)&select=*&order=scheduled_at.asc&limit=2`
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
            firstComment: post.first_comment || null,
          }),
        });
        const pub = await pubRes.json();
        const ok = !!pub.success;
        // Always update status (works even before the link columns exist).
        await sb(`posts?id=eq.${post.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: ok ? 'published' : 'failed' }),
        });
        // Then record the live link + platform id (no-ops harmlessly if columns not added yet).
        if (ok) {
          await sb(`posts?id=eq.${post.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ external_id: pub.postId || null, permalink: pub.permalink || null, published_at: new Date().toISOString() }),
          });
        }
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
