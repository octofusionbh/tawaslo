// api/meta-oauth.js — Meta OAuth token exchange & account info
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, redirectUri } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const APP_ID = process.env.META_APP_ID;
  const APP_SECRET = process.env.META_APP_SECRET;

  try {
    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${APP_SECRET}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (tokenData.error) return res.status(400).json({ error: tokenData.error.message });

    const shortToken = tokenData.access_token;

    // 2. Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortToken}`
    );
    const longData = await longRes.json();
    const longToken = longData.access_token || shortToken;

    // 3. Get user's Facebook Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,picture&access_token=${longToken}`
    );
    const pagesData = await pagesRes.json();

    // 4. For each page, check if it has an Instagram Business account
    const accounts = [];

    // Add Facebook pages
    if (pagesData.data) {
      for (const page of pagesData.data) {
        accounts.push({
          platform: 'fb',
          account_id: page.id,
          account_name: page.name,
          access_token: page.access_token, // page token (never expires)
          picture: page.picture?.data?.url || null,
        });

        // Check for linked Instagram Business account
        const igRes = await fetch(
          `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account,connected_instagram_account&access_token=${page.access_token}`
        );
        const igData = await igRes.json();
        console.log(`Page ${page.name} IG data:`, JSON.stringify(igData));

        const igAccount = igData.instagram_business_account || igData.connected_instagram_account;
        if (igAccount) { igData.instagram_business_account = igAccount; }

        if (igData.instagram_business_account) {
          const igId = igData.instagram_business_account.id;
          const igInfoRes = await fetch(
            `https://graph.facebook.com/v19.0/${igId}?fields=id,name,username,profile_picture_url,followers_count,biography&access_token=${page.access_token}`
          );
          const igInfo = await igInfoRes.json();

          accounts.push({
            platform: 'ig',
            account_id: igId,
            account_name: igInfo.name || igInfo.username,
            username: igInfo.username,
            access_token: page.access_token,
            picture: igInfo.profile_picture_url || null,
            followers_count: igInfo.followers_count || 0,
          });
        }
      }
    }

    return res.status(200).json({ accounts, longToken, debug: { pageCount: pagesData.data?.length, pages: pagesData.data?.map(p => ({ id: p.id, name: p.name })) } });
  } catch (err) {
    return res.status(500).json({ error: 'OAuth failed', details: err.message });
  }
}
