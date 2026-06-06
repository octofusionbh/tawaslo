// api/linkedin-oauth.js — LinkedIn OAuth: GET=redirect callback, POST=token exchange + member URN
// Needs LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET in Vercel, and LinkedIn API approval for w_member_social.
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { code, error, error_description } = req.query;
    if (error) return res.redirect(`https://tawaslo.com/social?li_error=${encodeURIComponent(error_description || error)}`);
    if (!code) return res.redirect(`https://tawaslo.com/social?li_error=${encodeURIComponent('No code received')}`);
    return res.redirect(`https://tawaslo.com/social?li_code=${encodeURIComponent(code)}`);
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, redirectUri } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

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
