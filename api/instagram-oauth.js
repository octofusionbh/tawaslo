// api/instagram-oauth.js — Instagram Business OAuth token exchange
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, redirectUri } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const IG_APP_ID = process.env.IG_APP_ID;
  const IG_APP_SECRET = process.env.IG_APP_SECRET;

  try {
    // 1. Exchange code for short-lived token
    const params = new URLSearchParams();
    params.append('client_id', IG_APP_ID);
    params.append('client_secret', IG_APP_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirectUri);
    params.append('code', code);

    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: params,
    });
    const tokenData = await tokenRes.json();
    console.log('IG token response:', JSON.stringify(tokenData));
    if (tokenData.error_type || tokenData.error) {
      return res.status(400).json({ error: tokenData.error_message || tokenData.error });
    }

    const shortToken = tokenData.access_token;
    const igUserId = tokenData.user_id;

    // 2. Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_id=${IG_APP_ID}&client_secret=${IG_APP_SECRET}&access_token=${shortToken}`
    );
    const longData = await longRes.json();
    const longToken = longData.access_token || shortToken;

    // 3. Get Instagram account info
    const infoRes = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=id,name,username,profile_picture_url,followers_count,biography&access_token=${longToken}`
    );
    const igInfo = await infoRes.json();
    console.log('IG info:', JSON.stringify(igInfo));

    if (igInfo.error) {
      console.error('IG info error:', igInfo.error);
      // Try fetching just the basics with the user ID as fallback
      const fallbackRes = await fetch(
        `https://graph.instagram.com/${igUserId}?fields=id,username,name&access_token=${longToken}`
      );
      const fallbackData = await fallbackRes.json();
      console.log('IG fallback info:', JSON.stringify(fallbackData));
      if (!fallbackData.error) {
        Object.assign(igInfo, fallbackData);
      }
    }

    const resolvedUsername = igInfo.username || null;
    const resolvedName = igInfo.name || resolvedUsername || null;

    const account = {
      platform: 'ig',
      account_id: String(igInfo.id || igUserId),
      account_name: resolvedUsername || resolvedName || `ig_${igUserId}`,
      username: resolvedUsername,
      access_token: longToken,
      picture: igInfo.profile_picture_url || null,
      followers_count: igInfo.followers_count || 0,
    };

    return res.status(200).json({ account });
  } catch (err) {
    console.error('Instagram OAuth error:', err);
    return res.status(500).json({ error: 'Instagram OAuth failed', details: err.message });
  }
}
