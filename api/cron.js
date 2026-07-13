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

// ── Monthly client report email (sent via Resend) ─────────────────────────
async function resendSend({ from, to, subject, html, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: 'RESEND_API_KEY not set' };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, id: d.id, error: r.ok ? undefined : (d.message || 'send failed') };
}

function fmtNum(n) { if (n == null || isNaN(n)) return '—'; n = Number(n); return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(Math.round(n)); }
function platName(p) { return ({ ig: 'Instagram', fb: 'Facebook', tt: 'TikTok', tiktok: 'TikTok', li: 'LinkedIn', x: 'X', tw: 'X', yt: 'YouTube', gbp: 'Google' })[p] || (p || 'Other'); }
function esc(s) { return String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// One comprehensive report document — used both as the email body and as the
// saved page behind "View full report" (tawaslo.com/r/<token>). Pass ctaUrl to
// include the button (email); omit it for the saved page.
function buildReport({ brand, clientName, month, m, platforms, topPosts, opens, ctaUrl, wl }) {
  const ac = '#' + (brand.accent || '6E8CAB');
  const logo = brand.logo
    ? `<img src="${brand.logo}" width="34" height="34" alt="" style="display:inline-block;vertical-align:middle;border-radius:7px;"/>`
    : `<span style="display:inline-block;width:30px;height:30px;border-radius:7px;background:${ac};"></span>`;
  const stat = (v, l) => `<td align="center" style="padding:10px 6px;"><div style="font-size:25px;font-weight:800;color:${ac};">${v}</div><div style="font-size:10px;color:#7A8BA8;margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">${l}</div></td>`;
  const platRow = (p) => {
    const w = Math.max(5, Math.min(100, Math.round(p.pct)));
    return `<tr><td style="padding:9px 0;border-bottom:1px solid #161D29;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font-size:12.5px;color:#E8EFF8;font-weight:600;width:96px;">${esc(p.name)}</td>
        <td><table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2230;border-radius:6px;"><tr><td style="background:${ac};height:9px;border-radius:6px;width:${w}%;font-size:0;line-height:0;">&nbsp;</td><td style="font-size:0;line-height:0;">&nbsp;</td></tr></table></td>
        <td align="right" style="font-size:12.5px;color:#9FB0C8;font-weight:700;width:64px;padding-left:10px;">${fmtNum(p.followers)}</td>
      </tr></table></td></tr>`;
  };
  const postRow = (p, i) => {
    const thumb = p.thumbnail
      ? `<img src="${p.thumbnail}" width="58" height="58" alt="" style="display:block;border-radius:9px;object-fit:cover;"/>`
      : `<div style="width:58px;height:58px;border-radius:9px;background:#1a2230;"></div>`;
    return `<tr><td style="padding:10px 0;border-bottom:1px solid #161D29;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="58" valign="top">${thumb}</td>
        <td width="12"></td>
        <td valign="top">
          <div style="font-size:10px;color:${ac};font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;">#${i + 1} top post</div>
          <div style="font-size:12px;color:#C2CEDE;line-height:1.5;max-height:36px;overflow:hidden;">${esc((p.caption || '').slice(0, 90))}</div>
          <div style="font-size:11px;color:#7A8BA8;margin-top:5px;">♥ ${fmtNum(p.likes)} &nbsp;·&nbsp; 💬 ${fmtNum(p.comments)}${p.reach ? ' &nbsp;·&nbsp; ' + fmtNum(p.reach) + ' reach' : ''}</div>
        </td>
      </tr></table></td></tr>`;
  };
  const section = (title) => `<tr><td style="padding:24px 32px 8px;"><div style="font-size:11px;letter-spacing:1.5px;color:#6B7C99;font-weight:700;text-transform:uppercase;">${title}</div></td></tr>`;
  const opensBlock = opens && (opens.menu || opens.short) ? `
    ${section('Reach beyond the feed')}
    <tr><td style="padding:4px 24px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid #1E2838;border-radius:12px;"><tr>
      ${stat(fmtNum(opens.menu), 'Menu views')}${stat(fmtNum(opens.short), 'Link / QR taps')}${stat(fmtNum((opens.menu || 0) + (opens.short || 0)), 'Total opens')}
    </tr></table></td></tr>` : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;background:#080B11;font-family:-apple-system,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#080B11;padding:30px 14px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0F141C;border:1px solid #1E2838;border-radius:16px;overflow:hidden;">

  <tr><td style="background:#060810;padding:24px 32px;border-bottom:1px solid #1E2838;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><table cellpadding="0" cellspacing="0"><tr><td style="padding-right:10px;">${logo}</td><td style="font-size:16px;font-weight:800;color:#E8EFF8;vertical-align:middle;">${esc(brand.name)}</td></tr></table></td>
      <td align="right" style="font-size:11px;color:#5A6B86;">Monthly report</td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:28px 32px 6px;">
    <h1 style="font-size:24px;font-weight:800;color:#E8EFF8;margin:0 0 4px;">${esc(clientName)}</h1>
    <div style="font-size:13px;color:#7A8BA8;">${month} · social performance &amp; insights</div>
  </td></tr>

  <tr><td style="padding:18px 32px 2px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#10202e,#0c1622);background-color:#102233;border:1px solid #1E2838;border-radius:14px;"><tr><td style="padding:22px 24px;">
      <div style="font-size:40px;font-weight:800;color:#E8EFF8;line-height:1;">${fmtNum(m.reach)}</div>
      <div style="font-size:12px;color:#9FB0C8;margin-top:6px;">people reached this month${m.reachDelta != null ? ` &nbsp;<span style="color:#7FC9A8;font-weight:700;">▲ ${m.reachDelta}%</span>` : ''}</div>
    </td></tr></table>
  </td></tr>

  <tr><td style="padding:12px 24px 2px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid #1E2838;border-radius:12px;"><tr>
      ${stat(fmtNum(m.followers), 'Followers')}${stat((m.engRate != null ? m.engRate + '%' : '—'), 'Engagement')}${stat(fmtNum(m.likes), 'Likes')}${stat(fmtNum(m.posts), 'Posts')}
    </tr></table>
  </td></tr>

  ${platforms && platforms.length ? section('Where your audience lives') + `<tr><td style="padding:2px 32px 4px;"><table width="100%" cellpadding="0" cellspacing="0">${platforms.map(platRow).join('')}</table></td></tr>` : ''}

  ${topPosts && topPosts.length ? section('Top performing content') + `<tr><td style="padding:2px 32px 4px;"><table width="100%" cellpadding="0" cellspacing="0">${topPosts.map(postRow).join('')}</table></td></tr>` : ''}

  ${opensBlock}

  <tr><td style="padding:22px 32px 28px;">
    <p style="font-size:13.5px;color:#A8B9CE;line-height:1.7;margin:0 0 ${ctaUrl ? '18' : '4'}px;">This is how ${esc(clientName)} performed across social this month — reach, audience, and the posts that worked hardest. ${ctaUrl ? 'Open the full report for the complete breakdown and a downloadable PDF.' : ''}</p>
    ${ctaUrl ? `<a href="${ctaUrl}" style="display:inline-block;background:${ac};color:#fff;font-size:14px;font-weight:700;padding:13px 30px;border-radius:10px;text-decoration:none;">View full report</a>` : ''}
  </td></tr>

  <tr><td style="background:#060810;padding:18px 32px;border-top:1px solid #1E2838;text-align:center;">
    <div style="font-size:11px;color:#3D5068;">${wl ? 'Prepared by ' + esc(brand.name) : 'Powered by Tawaslo'}</div>
  </td></tr>

</table></td></tr></table></body></html>`;
}

async function runMonthlyReports(res) {
  const started = Date.now();
  const month = new Date(Date.now() - 15 * 86400000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthStart = (() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString(); })();
  let sent = 0, skipped = 0; const errors = [];
  const cr = await sb('clients?select=*');
  const clients = cr.ok ? await cr.json() : [];
  for (const c of clients) {
    if (Date.now() - started > 8000) break;
    if (!c.auto_report || !c.report_email) { skipped++; continue; }
    try {
      // Default = Tawaslo branding. Only a white-label (enabled) agency swaps it out.
      let brand = { name: 'Tawaslo', accent: '6E8CAB', logo: 'https://tawaslo.com/logo-transparent.png' };
      let wl = false;
      try {
        const br = await sb(`agency_branding?owner_id=eq.${encodeURIComponent(c.owner_id)}&select=*&limit=1`);
        const ba = br.ok ? await br.json() : [];
        if (ba[0] && ba[0].enabled) { wl = true; brand = { name: ba[0].brand_name || ba[0].name || 'Your agency', accent: String(ba[0].accent || '#6E8CAB').replace('#', ''), logo: ba[0].logo_url || ba[0].logo || null }; }
      } catch (e) {}

      // Accounts → platform breakdown
      let platforms = [], ig = null;
      try {
        const ar = await sb(`social_accounts?client_id=eq.${c.id}&select=account_name,platform,followers_count,account_id,access_token`);
        const accs = ar.ok ? await ar.json() : [];
        ig = accs.find(a => a.platform === 'ig');
        const byP = {}; accs.forEach(a => { const k = a.platform || 'other'; byP[k] = (byP[k] || 0) + (a.followers_count || 0); });
        const maxP = Math.max(1, ...Object.values(byP));
        platforms = Object.entries(byP).map(([k, v]) => ({ platform: k, name: platName(k), followers: v, pct: v / maxP * 100 })).sort((a, b) => b.followers - a.followers);
      } catch (e) {}

      // Analytics from IG
      const m = { followers: platforms.reduce((s, p) => s + p.followers, 0) || null, reach: null, engRate: null, likes: null, posts: null };
      let topPosts = [];
      try {
        if (ig) {
          const an = await fetch(`${SITE}/api/instagram-analytics`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: ig.account_id, accessToken: ig.access_token }) });
          const j = await an.json().catch(() => ({}));
          const sum = j.summary || {};
          m.reach = sum.totalReach != null ? sum.totalReach : (j.reach || null);
          m.followers = sum.totalFollowers != null ? sum.totalFollowers : (j.followers || m.followers);
          m.likes = sum.totalLikes != null ? sum.totalLikes : null;
          m.engRate = sum.engagementRate != null ? sum.engagementRate : null;
          const rp = j.recentPosts || [];
          m.posts = rp.length || null;
          topPosts = [...rp].sort((a, b) => ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0))).slice(0, 3);
        }
      } catch (e) {}

      // Opens (menu / QR / link) this month
      let opens = null;
      try {
        const le = await sb(`link_events?client_id=eq.${c.id}&created_at=gte.${encodeURIComponent(monthStart)}&select=kind`);
        const evs = le.ok ? await le.json() : [];
        if (evs.length) { opens = { menu: 0, short: 0 }; evs.forEach(e => { if (e.kind === 'menu') opens.menu++; else opens.short++; }); }
      } catch (e) {}

      // Save the full report page, then email a copy with a link to it.
      const token = (globalThis.crypto && globalThis.crypto.randomUUID ? globalThis.crypto.randomUUID() : 'r' + Date.now() + Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 24);
      const pageHtml = buildReport({ brand, clientName: c.name || 'Your brand', month, m, platforms, topPosts, opens, wl });
      try { await sb('reports', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ token, client_name: c.name || null, html: pageHtml, created_at: new Date().toISOString() }) }); } catch (e) {}
      const emailHtml = buildReport({ brand, clientName: c.name || 'Your brand', month, m, platforms, topPosts, opens, wl, ctaUrl: `${SITE}/r/${token}` });
      const r = await resendSend({ from: `${brand.name} <reports@tawaslo.com>`, to: c.report_email, subject: `${c.name || 'Your'} — ${month} performance report`, html: emailHtml });
      if (r.ok) sent++; else errors.push({ client: c.name, error: r.error });
    } catch (e) { errors.push({ client: c.name, error: e.message }); }
  }
  return res.status(200).json({ ok: true, sent, skipped, errors });
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
        let rows = r.ok ? await r.json() : [];
        let readonly = false, shareMode = 'approve', shareClientId = null;
        if (!rows.length) {
          try {
            const sr = await sb(`calendar_shares?token=eq.${encodeURIComponent(token)}&select=client_id,ym,mode&limit=1`);
            const share = (sr.ok ? await sr.json() : [])[0];
            if (share) {
              shareMode = share.mode || 'view'; readonly = shareMode === 'view'; shareClientId = share.client_id;
              let q = `posts?client_id=eq.${encodeURIComponent(share.client_id)}&select=*&order=scheduled_at.asc`;
              if (share.ym) { const pp = String(share.ym).split('-'); const yy = Number(pp[0]), mm = Number(pp[1]); if (yy && mm) { const st = new Date(Date.UTC(yy, mm-1, 1)).toISOString(); const en = new Date(Date.UTC(yy, mm, 1)).toISOString(); q += `&scheduled_at=gte.${st}&scheduled_at=lt.${en}`; } }
              const pr = await sb(q);
              rows = pr.ok ? await pr.json() : [];
            }
          } catch (e) {}
        }
        const posts = (rows || []).map((row) => {
          const d = row.scheduled_at ? new Date(row.scheduled_at) : new Date();
          let media = [];
          try { if (Array.isArray(row.media_urls)) media = row.media_urls; else if (typeof row.media_urls === 'string' && row.media_urls) media = JSON.parse(row.media_urls); } catch (e) { media = []; }
          if (!media.length && row.image_url) media = [row.image_url];
          return {
            id: row.id, caption: row.caption || '', platform: row.platform || 'ig',
            type: row.post_type || 'Single', media,
            status: row.status === 'published' ? 'approved' : (row.appr_status || (readonly ? 'scheduled' : 'pending')), comment: row.appr_comment || '',
            date: d.getDate(), day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          };
        });
        // White-label: resolve the owning agency's brand so the client page can wear it.
        let agency = null, client = null, brand = null;
        try {
          const cid = (rows[0] && rows[0].client_id) || shareClientId;
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
        return res.status(200).json({ posts, readonly, mode: shareMode, agency, client, brand, month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), expires: 7, firstDow: new Date(now.getFullYear(), now.getMonth(), 1).getDay(), days: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() });
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

  // ── Monthly client reports — call /api/cron?key=SECRET&task=monthly_reports
  //    on the 1st of each month. Independent of the publishing gate below.
  if (req.query && req.query.task === 'monthly_reports') {
    try { return await runMonthlyReports(res); }
    catch (e) { return res.status(200).json({ ok: false, error: e.message }); }
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
