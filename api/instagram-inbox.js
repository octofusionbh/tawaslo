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

  // Reply to a DM. Meta only allows this within 24 hours of the user's last message
  // (the "messaging window"), and needs the instagram_manage_messages permission.
  // Cold/outbound DMs to accounts that never messaged you are not possible on the API.
  if (type === 'send-dm') {
    const recipientId = req.body.recipientId;
    if (!recipientId || !message) return res.status(400).json({ error: 'Missing recipientId or message' });
    try {
      const r = await fetch(`${base}/me/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: { id: recipientId }, message: { text: message }, messaging_type: 'RESPONSE', access_token: accessToken }),
      });
      const data = await r.json();
      if (data.error) return res.status(400).json({ error: data.error.message, code: data.error.code });
      return res.status(200).json({ success: true, id: data.message_id || data.id });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to send message', details: err.message });
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

      // Instagram-login tokens are scoped to one account → read the token's own user ("me").
      // Facebook-login tokens can manage multiple IG accounts → address the specific accountId.
      const node = base.includes('graph.instagram.com') ? 'me' : accountId;
      const mediaRes = await fetch(
        `${base}/${node}/media?fields=id,caption,media_type,timestamp,like_count,comments_count&limit=25&access_token=${accessToken}`
      );
      const mediaData = await mediaRes.json();
      if (mediaData.error) return res.status(400).json({ error: mediaData.error.message, debug: { accountId, base, mediaError: mediaData.error } });

      const comments = [];
      const mediaList = (mediaData.data || []);
      // Scan a real slice of the recent feed, not just the last handful — a post
      // from three weeks ago still gets comments. The requests run together so
      // widening the window does not make the inbox slow to open.
      const toScan = mediaList.slice(0, 15);
      let commentError = null;
      const scans = await Promise.all(toScan.map(async (media) => {
        try {
          const commentsRes = await fetch(
            `${base}/${media.id}/comments?fields=id,text,username,timestamp,like_count,replies{id,text,username,timestamp}&limit=25&access_token=${accessToken}`
          );
          return { media, data: await commentsRes.json() };
        } catch (e) { return { media, data: { error: { message: e.message } } }; }
      }));
      for (const { media, data: commentsData } of scans) {
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
      const scanned = toScan.length;

      // Always include a diagnostic so an empty inbox can explain itself.
      return res.status(200).json({ data: comments, debug: { posts: mediaList.length, scanned, found: comments.length, error: commentError } });

    } else if (type === 'messages') {
      // Fetch Instagram DMs — requires instagram_manage_messages permission
      const dmNode = base.includes('graph.instagram.com') ? 'me' : accountId;
      const convsRes = await fetch(
        `${base}/${dmNode}/conversations?fields=id,participants{id,username,name},messages{id,message,from,created_time}&platform=instagram&access_token=${accessToken}`
      );
      const convsData = await convsRes.json();
      if (convsData.error) return res.status(400).json({ error: convsData.error.message });

      // Who this business account is, so it can be told apart from the person
      // writing in. A conversation's participants come back as both sides, and
      // the account's own id differs between Instagram-login and Facebook-login
      // tokens, so match on id AND username rather than on the stored id alone.
      let selfId = accountId, selfName = '';
      try {
        const meRes = await fetch(`${base}/me?fields=id,user_id,username&access_token=${accessToken}`);
        const me = await meRes.json();
        if (!me.error) { selfId = me.user_id || me.id || accountId; selfName = me.username || ''; }
      } catch (e) { /* fall back to the stored account id */ }
      const isSelf = (pp) => !pp ? false
        : String(pp.id) === String(selfId) || String(pp.id) === String(accountId)
          || (!!selfName && String(pp.username || pp.name || '').toLowerCase() === String(selfName).toLowerCase());

      const messages = [];
      for (const conv of (convsData.data || [])) {
        const latestMsg = conv.messages?.data?.[0];
        if (latestMsg) {
          // The person to reply to is the conversation participant who is NOT this business account.
          const others = (conv.participants?.data || []).filter(pp => pp.id && !isSelf(pp));
          const other = others[0] || null;
          const replyToId = (other && other.id) || (isSelf(latestMsg.from) ? null : latestMsg.from?.id) || null;
          // Show the other person, never the last sender: whenever the business
          // replied last, the last sender is the business itself.
          const fromName = (other && (other.username || other.name))
            || (!isSelf(latestMsg.from) && (latestMsg.from?.username || latestMsg.from?.name))
            || 'Instagram user';
          messages.push({
            id: conv.id,
            from: fromName,
            fromId: replyToId,
            outgoing: isSelf(latestMsg.from),
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
