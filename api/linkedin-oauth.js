// api/linkedin-oauth.js — Social OAuth: GET=redirect callback, POST=token exchange.
// Handles LinkedIn (member URN + org Pages) AND TikTok (folded in to stay under Vercel's 12-function cap).
// LinkedIn needs LINKEDIN_CLIENT_ID/SECRET + w_member_social approval; TikTok needs TIKTOK_CLIENT_KEY/SECRET + Content Posting approval.
export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Callbacks are routed by the `state` prefix: tt=TikTok, tw=X, else LinkedIn.
    const { code, error, error_description, state } = req.query;
    const s = String(state || '');
    const pre = s.startsWith('tt') ? 'tt' : s.startsWith('tw') ? 'tw' : s.startsWith('gb') ? 'gb' : s.startsWith('yt') ? 'yt' : 'li';
    const codeParam = `${pre}_code`;
    const errParam = `${pre}_error`;
    if (error) return res.redirect(`https://tawaslo.com/social?${errParam}=${encodeURIComponent(error_description || error)}`);
    if (!code) return res.redirect(`https://tawaslo.com/social?${errParam}=${encodeURIComponent('No code received')}`);
    return res.redirect(`https://tawaslo.com/social?${codeParam}=${encodeURIComponent(code)}`);
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, redirectUri, provider } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  // ── TikTok token exchange + user info ──
  if (provider === 'tiktok') {
    const TK = process.env.TIKTOK_CLIENT_KEY;
    const TS = process.env.TIKTOK_CLIENT_SECRET;
    if (!TK || !TS) return res.status(400).json({ error: 'TikTok not configured. Add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET in Vercel.' });
    try {
      const form = new URLSearchParams({ client_key: TK, client_secret: TS, code, grant_type: 'authorization_code', redirect_uri: redirectUri });
      const tk = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form,
      }).then(r => r.json());
      if (tk.error) return res.status(400).json({ error: tk.error_description || tk.error });
      const token = tk.access_token;
      const info = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,follower_count', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).catch(() => ({}));
      const u = (info && info.data && info.data.user) || {};
      const account = {
        platform: 'tt', kind: 'personal',
        account_id: u.open_id || tk.open_id || 'tiktok',
        account_name: u.display_name || 'TikTok',
        username: u.display_name || null,
        access_token: token,
        picture: u.avatar_url || null,
        followers_count: u.follower_count || 0,
      };
      return res.status(200).json({ account });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // ── YouTube (Google) token exchange + channel info ──
  if (provider === 'youtube') {
    const YID = process.env.YOUTUBE_CLIENT_ID;
    const YS = process.env.YOUTUBE_CLIENT_SECRET;
    if (!YID || !YS) return res.status(400).json({ error: 'YouTube not configured. Add YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in Vercel.' });
    try {
      const form = new URLSearchParams({ code, client_id: YID, client_secret: YS, redirect_uri: redirectUri, grant_type: 'authorization_code' });
      const tk = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form,
      }).then(r => r.json());
      if (tk.error) return res.status(400).json({ error: tk.error_description || tk.error });
      const token = tk.access_token;
      const ch = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());
      if (ch.error) return res.status(400).json({ error: (ch.error && ch.error.message) || 'Could not read YouTube channel.' });
      const c = (ch.items && ch.items[0]) || {};
      const sn = c.snippet || {}; const st = c.statistics || {};
      const thumb = (sn.thumbnails && (sn.thumbnails.medium || sn.thumbnails.default)) || {};
      const account = {
        platform: 'yt', kind: 'channel',
        account_id: c.id || 'youtube',
        account_name: sn.title || 'YouTube',
        username: sn.customUrl || sn.title || null,
        access_token: token,
        refresh_token: tk.refresh_token || null,
        picture: thumb.url || null,
        followers_count: parseInt(st.subscriberCount || '0', 10) || 0,
      };
      return res.status(200).json({ account });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // ── Google Business Profile token exchange + the account that owns the locations ──
  if (provider === 'gbp') {
    const GID = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
    const GS = process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;
    if (!GID || !GS) return res.status(400).json({ error: 'Google Business not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel.' });
    try {
      const form = new URLSearchParams({ code, client_id: GID, client_secret: GS, redirect_uri: redirectUri, grant_type: 'authorization_code' });
      const tk = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form }).then(r => r.json());
      if (tk.error) return res.status(400).json({ error: tk.error_description || tk.error });
      const token = tk.access_token;
      const acc = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      const a = (acc.accounts && acc.accounts[0]) || {};
      const account = {
        platform: 'gb', kind: 'business',
        account_id: a.name || 'accounts/me',
        account_name: a.accountName || 'Google Business',
        username: a.accountName || null,
        access_token: token,
        refresh_token: tk.refresh_token || null,
        picture: null,
        followers_count: 0,
      };
      return res.status(200).json({ account, accounts: acc.accounts || [], errorInfo: acc.error || null });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // ── Authenticated Google proxy — powers the whole Business Profile page (locations, reviews, hours, links,
  //    attributes, posts, Q&A, insights, photos). The browser passes the stored token + the exact Google API
  //    URL/method/body; we only forward to allowlisted Google Business hosts so the token can't be misused. ──
  if (provider === 'google_proxy') {
    const { accessToken, url, method, body: gbody } = req.body;
    if (!accessToken || !url) return res.status(400).json({ error: 'accessToken and url are required' });
    const ALLOW = ['mybusiness.googleapis.com', 'mybusinessbusinessinformation.googleapis.com', 'mybusinessaccountmanagement.googleapis.com', 'mybusinessplaceactions.googleapis.com', 'mybusinessqanda.googleapis.com', 'mybusinessverifications.googleapis.com', 'businessprofileperformance.googleapis.com'];
    try {
      const host = new URL(url).host;
      if (!ALLOW.includes(host)) return res.status(400).json({ error: 'Host not allowed' });
      const r = await fetch(url, {
        method: method || 'GET',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: gbody ? JSON.stringify(gbody) : undefined,
      });
      const text = await r.text();
      let data; try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
      return res.status(r.ok ? 200 : (r.status || 400)).json(data);
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // ── X (Twitter) token exchange — OAuth 2.0 + PKCE. PAID API; held until go-live. ──
  if (provider === 'x') {
    const XID = process.env.X_CLIENT_ID;
    const XS = process.env.X_CLIENT_SECRET; // optional (confidential client)
    if (!XID) return res.status(400).json({ error: 'X not configured. Add X_CLIENT_ID (and X_CLIENT_SECRET) in Vercel.' });
    try {
      const form = new URLSearchParams({ code, grant_type: 'authorization_code', client_id: XID, redirect_uri: redirectUri, code_verifier: req.body.codeVerifier || '' });
      const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      if (XS) headers['Authorization'] = 'Basic ' + Buffer.from(`${XID}:${XS}`).toString('base64');
      const tk = await fetch('https://api.twitter.com/2/oauth2/token', { method: 'POST', headers, body: form }).then(r => r.json());
      if (tk.error) return res.status(400).json({ error: tk.error_description || tk.error });
      const token = tk.access_token;
      const me = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics,username,name', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).catch(() => ({}));
      const u = (me && me.data) || {};
      const account = {
        platform: 'tw', kind: 'personal',
        account_id: u.id || 'x',
        account_name: u.name || u.username || 'X',
        username: u.username || null,
        access_token: token,
        refresh_token: tk.refresh_token || null,
        picture: u.profile_image_url || null,
        followers_count: (u.public_metrics && u.public_metrics.followers_count) || 0,
      };
      return res.status(200).json({ account });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  const CID = process.env.LINKEDIN_CLIENT_ID;
  const CS = process.env.LINKEDIN_CLIENT_SECRET;
  if (!CID || !CS) return res.status(400).json({ error: 'LinkedIn not configured. Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in Vercel.' });

  try {
    const params = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: CID, client_secret: CS });
    const tk = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params,
    }).then(r => r.json());
    if (tk.error) return res.status(400).json({ error: tk.error_description || tk.error });
    const token = tk.access_token;

    const me = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
    if (!me.sub) return res.status(400).json({ error: 'Could not read LinkedIn profile (check scopes).' });

    const member = {
      platform: 'li', kind: 'personal',
      account_id: `urn:li:person:${me.sub}`,
      account_name: me.name || 'LinkedIn',
      username: me.name || null,
      access_token: token,
      picture: me.picture || null,
      followers_count: 0,
    };

    // Company Pages the user administers (needs r_organization_admin + Community Management API approval)
    const organizations = [];
    try {
      const version = process.env.LINKEDIN_API_VERSION || '202401';
      const liHeaders = { Authorization: `Bearer ${token}`, 'LinkedIn-Version': version, 'X-Restli-Protocol-Version': '2.0.0' };
      const acl = await fetch('https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED', { headers: liHeaders }).then(r => r.json());
      for (const el of (acl.elements || []).slice(0, 12)) {
        const orgUrn = el.organization;
        if (!orgUrn) continue;
        const id = String(orgUrn).split(':').pop();
        let name = orgUrn;
        try { const od = await fetch(`https://api.linkedin.com/rest/organizations/${id}`, { headers: liHeaders }).then(r => r.json()); name = od.localizedName || od.vanityName || name; } catch (e) { /* ignore */ }
        organizations.push({ platform: 'li', kind: 'organization', account_id: orgUrn, account_name: name, username: name, access_token: token, picture: null, followers_count: 0 });
      }
    } catch (e) { /* org scope not granted yet — personal still works */ }

    return res.status(200).json({ member, organizations });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
