// api/instagram-analytics.js — Real Instagram analytics via Graph API
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { accountId, accessToken } = req.body;
  if (!accountId || !accessToken) return res.status(400).json({ error: 'Missing required fields' });

  const base = accessToken.startsWith('IGAA') || accessToken.startsWith('IGQ')
    ? 'https://graph.instagram.com/v21.0'
    : 'https://graph.facebook.com/v19.0';

  try {
    // 1. Account info + follower count
    const profileRes = await fetch(
      `${base}/${accountId}?fields=id,username,name,followers_count,follows_count,media_count,profile_picture_url,biography,website&access_token=${accessToken}`
    );
    const profile = await profileRes.json();
    if (profile.error) return res.status(400).json({ error: profile.error.message });

    // 2. Account insights — reach, impressions, profile views (requires instagram_manage_insights)
    const insightsRes = await fetch(
      `${base}/${accountId}/insights?metric=reach,impressions,profile_views,follower_count&period=day&since=${Math.floor(Date.now()/1000) - 30*24*3600}&until=${Math.floor(Date.now()/1000)}&access_token=${accessToken}`
    );
    const insightsData = await insightsRes.json();

    // 3. Recent media with engagement
    const mediaRes = await fetch(
      `${base}/${accountId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,reach,impressions,saved,thumbnail_url,media_url&limit=12&access_token=${accessToken}`
    );
    const mediaData = await mediaRes.json();

    // Process insights into daily data
    const insightsByMetric = {};
    if (insightsData.data) {
      for (const metric of insightsData.data) {
        insightsByMetric[metric.name] = metric.values || [];
      }
    }

    // Calculate totals from recent posts
    const posts = mediaData.data || [];
    const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);
    const totalComments = posts.reduce((s, p) => s + (p.comments_count || 0), 0);
    const totalReach = insightsByMetric.reach?.reduce((s, v) => s + (v.value || 0), 0) || 0;
    const totalImpressions = insightsByMetric.impressions?.reduce((s, v) => s + (v.value || 0), 0) || 0;
    const totalProfileViews = insightsByMetric.profile_views?.reduce((s, v) => s + (v.value || 0), 0) || 0;
    const engagementRate = profile.followers_count > 0
      ? (((totalLikes + totalComments) / posts.length) / profile.followers_count * 100).toFixed(2)
      : 0;

    // Daily reach chart data (last 30 days)
    const chartData = (insightsByMetric.reach || []).slice(-30).map(v => ({
      date: new Date(v.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      reach: v.value || 0,
      impressions: 0,
    }));

    // Merge impressions into chart
    const impressionsData = insightsByMetric.impressions || [];
    chartData.forEach((d, i) => {
      d.impressions = impressionsData[i]?.value || 0;
    });

    return res.status(200).json({
      profile: {
        username: profile.username,
        name: profile.name,
        followers: profile.followers_count || 0,
        following: profile.follows_count || 0,
        mediaCount: profile.media_count || 0,
        picture: profile.profile_picture_url || null,
        bio: profile.biography || '',
        website: profile.website || '',
      },
      summary: {
        totalReach,
        totalImpressions,
        totalProfileViews,
        totalLikes,
        totalComments,
        engagementRate: parseFloat(engagementRate),
        postsAnalyzed: posts.length,
      },
      chartData,
      recentPosts: posts.slice(0, 9).map(p => ({
        id: p.id,
        caption: p.caption?.substring(0, 80) || '',
        type: p.media_type,
        timestamp: p.timestamp,
        likes: p.like_count || 0,
        comments: p.comments_count || 0,
        reach: p.reach || 0,
        impressions: p.impressions || 0,
        saved: p.saved || 0,
        thumbnail: p.thumbnail_url || p.media_url || null,
      })),
    });

  } catch (err) {
    console.error('Instagram analytics error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics', details: err.message });
  }
}
