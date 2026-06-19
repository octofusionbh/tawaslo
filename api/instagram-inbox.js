// api/instagram-inbox.js — Fetch real Instagram comments and DMs, and reply to a comment.
// type: 'comments' | 'messages' | 'reply'
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { accountId, accessToken, type, commentId, message } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'Missing accessToken' });

  const base = accessToken.startsWith('IGAA') || accessToken.startsWith('IGQ')
    ? 'https://graph.instagram.com/v21.0'
    : 'https://graph.facebook.com/v19.0';

  // Reply to a comment (merged from the old instagram-reply endpoint).
  if (type === 'reply') {
    if (!commentId || !message) return res.status(400).json({ error: 'Missing commentId or message' });
    try {
      const replyRes = await fetch(`${base}/${commentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, access_token: accessToken }),
      });
      const data = await replyRes.json();
      if (data.error) return res.status(400).json({ error: data.error.message, code: data.error.code });
      return res.status(200).json({ success: true, id: data.id });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to post reply', details: err.message });
    }
  }

  // Real profile + feed for the Grid planner (photo, bio, followers, following, posts).
  if (type === 'profile') {
    try {
      const meRes = await fetch(`${base}/me?fields=user_id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url&access_token=${accessToken}`);
      const me = await meRes.json();
      if (me.error) return res.status(400).json({ error: me.error.message });
      const mediaRes = await fetch(`${base}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=24&access_token=${accessToken}`);
      const md = await mediaRes.json();
      const media = (md.data || []).map(m => ({
        id: m.id,
        url: m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : m.media_url,
        permalink: m.permalink, caption: m.caption || '', type: m.media_type,
        time: m.timestamp, likes: m.like_count || 0, comments: m.comments_count || 0,
      })).filter(m => m.url);
      return res.status(200).json({ profile: me, media });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch profile', details: err.message });
    }
  }

  if (!accountId) return res.status(400).json({ error: 'Missing accountId' });

  try {
    if (type === 'comments') {
      // Fetch recent media then get comments on each
      // Check account info first
      const meRes = await fetch(`${base}/me?fields=id,username&access_token=${accessToken}`);
      const meData = await meRes.json();
      console.log('Account:', JSON.stringify(meData));

      const mediaRes = await fetch(
        `${base}/${accountId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count&limit=10&access_token=${accessToken}`
      );
      const mediaData = await mediaRes.json();
      console.log('Media result:', JSON.stringify(mediaData).substring(0, 800));
      if (mediaData.error) return res.status(400).json({ error: mediaData.error.message, debug: { accountId, base, mediaError: mediaData.error } });

      const comments = [];
      const mediaList = (mediaData.data || []);
      let scanned = 0, commentError = null;
      for (const media of mediaList.slice(0, 5)) {
        scanned++;
        const commentsRes = await fetch(
          `${base}/${media.id}/comments?fields=id,text,username,timestamp,like_count,replies{id,text,username,timestamp}&limit=20&access_token=${accessToken}`
        );
        const commentsData = await commentsRes.json();
        if (commentsData.error && !commentError) commentError = commentsData.error.message;
        if (commentsData.data) {
          for (const comment of commentsData.data) {
            comments.push({
              id: comment.id,
              from: comment.username || 'Instagram User',
              text: comment.text,
              time: comment.timestamp,
              platform: 'ig',
              type: 'comment',
              mediaId: media.id,
              mediaCaption: media.caption?.substring(0, 50) || '',
              likeCount: comment.like_count || 0,
              replies: comment.replies?.data || [],
            });
          }
        }
      }

      // Always include a diagnostic so an empty inbox can explain itself.
      return res.status(200).json({ data: comments, debug: { posts: mediaList.length, scanned, found: comments.length, error: commentError } });

    } else if (type === 'messages') {
      // Fetch Instagram DMs — requires instagram_manage_messages permission
      const convsRes = await fetch(
        `${base}/${accountId}/conversations?fields=id,participants,messages{id,message,from,created_time}&platform=instagram&access_token=${accessToken}`
      );
      const convsData = await convsRes.json();
      if (convsData.error) return res.status(400).json({ error: convsData.error.message });

      const messages = [];
      for (const conv of (convsData.data || [])) {
        const latestMsg = conv.messages?.data?.[0];
        if (latestMsg) {
          messages.push({
            id: conv.id,
            from: latestMsg.from?.name || 'Instagram User',
            text: latestMsg.message,
            time: latestMsg.created_time,
            platform: 'ig',
            type: 'dm',
            conversationId: conv.id,
          });
        }
      }

      return res.status(200).json({ data: messages, debug: { conversations: (convsData.data || []).length } });
    }

    return res.status(400).json({ error: 'Invalid type. Use "comments" or "messages"' });
  } catch (err) {
    console.error('Instagram inbox error:', err);
    return res.status(500).json({ error: 'Failed to fetch inbox', details: err.message });
  }
}
