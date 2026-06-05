// api/instagram-inbox.js — Fetch real Instagram comments and DMs
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { accountId, accessToken, type } = req.body;
  if (!accountId || !accessToken) return res.status(400).json({ error: 'Missing required fields' });

  const base = accessToken.startsWith('IGAA') || accessToken.startsWith('IGQ')
    ? 'https://graph.instagram.com/v21.0'
    : 'https://graph.facebook.com/v19.0';

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
      for (const media of (mediaData.data || []).slice(0, 5)) {
        const commentsRes = await fetch(
          `${base}/${media.id}/comments?fields=id,text,username,timestamp,like_count,replies{id,text,username,timestamp}&limit=20&access_token=${accessToken}`
        );
        const commentsData = await commentsRes.json();
        console.log(`Comments for ${media.id}:`, JSON.stringify(commentsData).substring(0, 300));
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

      return res.status(200).json({ data: comments });

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

      return res.status(200).json({ data: messages });
    }

    return res.status(400).json({ error: 'Invalid type. Use "comments" or "messages"' });
  } catch (err) {
    console.error('Instagram inbox error:', err);
    return res.status(500).json({ error: 'Failed to fetch inbox', details: err.message });
  }
}
