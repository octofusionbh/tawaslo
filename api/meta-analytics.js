// api/meta-analytics.js — Fetch analytics for connected accounts
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { platform, accountId, accessToken } = req.body;
  if (!platform || !accountId || !accessToken) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    if (platform === 'ig') {
      // Instagram Business insights
      const metrics = 'impressions,reach,profile_views,follower_count,accounts_engaged';
      const period = 'day';
      const since = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60; // 30 days ago
      const until = Math.floor(Date.now() / 1000);

      const insightsRes = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}/insights?metric=${metrics}&period=${period}&since=${since}&until=${until}&access_token=${accessToken}`
      );
      const insights = await insightsRes.json();

      // Also get recent posts with engagement
      const postsRes = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,impressions,reach&limit=10&access_token=${accessToken}`
      );
      const posts = await postsRes.json();

      // Get profile info
      const profileRes = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}?fields=followers_count,media_count,name,username&access_token=${accessToken}`
      );
      const profile = await profileRes.json();

      return res.status(200).json({
        platform: 'ig',
        profile,
        insights: insights.data || [],
        recentPosts: posts.data || [],
      });

    } else if (platform === 'fb') {
      // Facebook Page insights
      const metrics = 'page_impressions,page_reach,page_engaged_users,page_fans,page_post_engagements';
      const since = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
      const until = Math.floor(Date.now() / 1000);

      const insightsRes = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}/insights?metric=${metrics}&period=day&since=${since}&until=${until}&access_token=${accessToken}`
      );
      const insights = await insightsRes.json();

      // Recent posts
      const postsRes = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}/posts?fields=id,message,created_time,likes.summary(true),comments.summary(true),shares&limit=10&access_token=${accessToken}`
      );
      const posts = await postsRes.json();

      // Page info
      const pageRes = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}?fields=fan_count,name,about&access_token=${accessToken}`
      );
      const page = await pageRes.json();

      return res.status(200).json({
        platform: 'fb',
        profile: page,
        insights: insights.data || [],
        recentPosts: posts.data || [],
      });
    }

    return res.status(400).json({ error: 'Unsupported platform' });
  } catch (err) {
    return res.status(500).json({ error: 'Analytics fetch failed', details: err.message });
  }
}
