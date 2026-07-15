// api/instagram-analytics.js — Real Instagram analytics via the Instagram API
// NOTE: Meta deprecated `impressions` (Mar 2025) and `profile_views` time-series (Jan 2025).
// Requesting a deprecated metric/field makes the whole call fail, so we only request supported ones.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { accountId, accessToken } = req.body;
  if (!accountId || !accessToken) return res.status(400).json({ error: 'Missing required fields' });

  // YouTube uses the same analytics shape so the Analytics page can render it unchanged.
  if ((req.body.platform || '') === 'youtube') return youtubeAnalytics(accountId, accessToken, res);

  const base = accessToken.startsWith('IGAA') || accessToken.startsWith('IGQ')
    ? 'https://graph.instagram.com/v21.0'
    : 'https://graph.facebook.com/v19.0';

  // Fast path: fetch ONLY a fresh profile photo (+ name/username). Instagram &
  // Facebook profile-picture URLs are time-signed and expire, so a stored link
  // eventually 403s and the avatar breaks. Callers use this to refresh the URL
  // without paying for the full media/insights pull.
  if (req.body.profileOnly) {
    try {
      if ((req.body.platform || '') === 'fb') {
        const r = await fetch(`https://graph.facebook.com/v19.0/${accountId}?fields=name,picture.width(160).height(160)&access_token=${accessToken}`);
        const p = await r.json();
        if (p.error) return res.status(400).json({ error: p.error.message });
        return res.status(200).json({ profile: { name: p.name || null, picture: (p.picture && p.picture.data && p.picture.data.url) || null } });
      }
      const r = await fetch(`${base}/${accountId}?fields=id,username,name,followers_count,profile_picture_url&access_token=${accessToken}`);
      const p = await r.json();
      if (p.error) return res.status(400).json({ error: p.error.message });
      return res.status(200).json({ profile: { username: p.username || null, name: p.name || null, followers: p.followers_count || 0, picture: p.profile_picture_url || null } });
    } catch (e) { return res.status(200).json({ error: e.message }); }
  }

  try {
    // 1. Account info + follower count
    const profileRes = await fetch(
      `${base}/${accountId}?fields=id,username,name,followers_count,follows_count,media_count,profile_picture_url,biography,website&access_token=${accessToken}`
    );
    const profile = await profileRes.json();
    if (profile.error) return res.status(400).json({ error: profile.error.message });

    // 2. Account insights — only currently-supported account metrics (reach). period=day time series.
    const since = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
    const until = Math.floor(Date.now() / 1000);
    const insightsRes = await fetch(
      `${base}/${accountId}/insights?metric=reach&period=day&since=${since}&until=${until}&access_token=${accessToken}`
    );
    const insightsData = await insightsRes.json();
    // Account "views" — Meta's unified metric that replaced impressions (2025). Separate call so a
    // failure here never breaks the working reach call.
    let viewsByDay = [];
    try {
      const vRes = await fetch(`${base}/${accountId}/insights?metric=views&period=day&since=${since}&until=${until}&access_token=${accessToken}`);
      const vData = await vRes.json();
      if (vData.data && vData.data[0]) viewsByDay = vData.data[0].values || [];
    } catch (e) { /* views unsupported for this account — ignore */ }

    // 3. Recent media — valid fields only (reach/impressions/saved are NOT media fields; they live on /insights)
    const mediaRes = await fetch(
      `${base}/${accountId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,thumbnail_url,media_url,permalink&limit=12&access_token=${accessToken}`
    );
    const mediaData = await mediaRes.json();

    const insightsByMetric = {};
    if (insightsData.data) {
      for (const metric of insightsData.data) insightsByMetric[metric.name] = metric.values || [];
    }

    const posts = mediaData.data || [];
    const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);
    const totalComments = posts.reduce((s, p) => s + (p.comments_count || 0), 0);
    const totalReach = (insightsByMetric.reach || []).reduce((s, v) => s + (v.value || 0), 0);
    const totalViews = viewsByDay.reduce((s, v) => s + (v.value || 0), 0);
    const engagementRate = (profile.followers_count > 0 && posts.length > 0)
      ? (((totalLikes + totalComments) / posts.length) / profile.followers_count * 100).toFixed(2)
      : 0;

    const viewsSlice = viewsByDay.slice(-30);
    const chartData = (insightsByMetric.reach || []).slice(-30).map((v, i) => ({
      date: new Date(v.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      reach: v.value || 0,
      views: (viewsSlice[i] && viewsSlice[i].value) || 0,
      impressions: 0,
    }));

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
        totalViews,
        totalImpressions: 0, // deprecated by Meta — no longer available
        totalProfileViews: 0, // deprecated by Meta — no longer available
        totalLikes,
        totalComments,
        engagementRate: parseFloat(engagementRate),
        postsAnalyzed: posts.length,
      },
      insightsError: insightsData.error ? (insightsData.error.message || 'insights unavailable') : null,
      chartData,
      recentPosts: posts.slice(0, 9).map(p => ({
        id: p.id,
        caption: p.caption || '',
        type: p.media_type,
        timestamp: p.timestamp,
        likes: p.like_count || 0,
        comments: p.comments_count || 0,
        reach: 0,
        impressions: 0,
        saved: 0,
        thumbnail: p.thumbnail_url || p.media_url || null,
      })),
    });

  } catch (err) {
    console.error('Instagram analytics error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics', details: err.message });
  }
}

// ── YouTube analytics — channel stats + recent videos (Data API) + 30-day views/watch-time (Analytics API).
// Returns the SAME shape as Instagram so the Analytics page renders it with no changes.
async function youtubeAnalytics(channelId, accessToken, res) {
  try {
    const yt = (url) => fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json());

    // 1. Channel snippet + statistics + uploads playlist
    const ch = await yt(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}`);
    if (ch.error) return res.status(400).json({ error: ch.error.message });
    const c = (ch.items && ch.items[0]) || {};
    const sn = c.snippet || {}; const st = c.statistics || {};
    const uploads = c.contentDetails && c.contentDetails.relatedPlaylists && c.contentDetails.relatedPlaylists.uploads;

    // 2. Recent uploads → video stats (views/likes/comments)
    let videoIds = [];
    if (uploads) {
      const pl = await yt(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=12&playlistId=${uploads}`);
      videoIds = (pl.items || []).map(i => i.contentDetails && i.contentDetails.videoId).filter(Boolean);
    }
    let videos = [];
    if (videoIds.length) {
      const vd = await yt(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(',')}`);
      videos = vd.items || [];
    }

    const subs = parseInt(st.subscriberCount || '0', 10) || 0;
    const totalViews = parseInt(st.viewCount || '0', 10) || 0;
    const num = (v, k) => parseInt(((v.statistics || {})[k]) || '0', 10) || 0;
    const recentLikes = videos.reduce((s, v) => s + num(v, 'likeCount'), 0);
    const recentComments = videos.reduce((s, v) => s + num(v, 'commentCount'), 0);

    // 3. 30-day views + estimated watch time via the YouTube Analytics API.
    // Needs the yt-analytics.readonly scope; if not granted we fall back to channel totals only.
    let chartData = []; let watchMinutes = 0;
    try {
      const end = new Date().toISOString().slice(0, 10);
      const start = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const rep = await yt(`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel%3D%3D${channelId}&startDate=${start}&endDate=${end}&metrics=views,estimatedMinutesWatched&dimensions=day&sort=day`);
      if (rep.rows) {
        chartData = rep.rows.slice(-30).map(row => ({
          date: new Date(row[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          reach: row[1] || 0, impressions: 0,
        }));
        watchMinutes = rep.rows.reduce((s, row) => s + (row[2] || 0), 0);
      }
    } catch (e) { /* analytics scope not granted — channel stats still work */ }

    const engagementRate = (subs > 0 && videos.length > 0)
      ? (((recentLikes + recentComments) / videos.length) / subs * 100).toFixed(2) : 0;
    const thumbOf = (o) => (o && o.thumbnails && (o.thumbnails.medium || o.thumbnails.default) || {}).url || null;

    return res.status(200).json({
      profile: {
        username: sn.customUrl || sn.title, name: sn.title, followers: subs, following: 0,
        mediaCount: parseInt(st.videoCount || '0', 10) || 0, picture: thumbOf(sn),
        bio: sn.description || '', website: '',
      },
      summary: {
        totalReach: totalViews, totalImpressions: 0, totalProfileViews: 0,
        totalLikes: recentLikes, totalComments: recentComments,
        engagementRate: parseFloat(engagementRate), postsAnalyzed: videos.length,
        watchMinutes,
      },
      insightsError: null,
      chartData,
      recentPosts: videos.slice(0, 9).map(v => ({
        id: v.id, caption: (v.snippet || {}).title || '', type: 'VIDEO',
        timestamp: (v.snippet || {}).publishedAt,
        likes: num(v, 'likeCount'), comments: num(v, 'commentCount'), reach: num(v, 'viewCount'),
        impressions: 0, saved: 0, thumbnail: thumbOf(v.snippet),
      })),
    });
  } catch (err) {
    console.error('YouTube analytics error:', err);
    return res.status(500).json({ error: 'Failed to fetch YouTube analytics', details: err.message });
  }
}
