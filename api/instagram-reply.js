// api/instagram-reply.js — Post a reply to an Instagram comment
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { commentId, message, accessToken } = req.body;
  if (!commentId || !message || !accessToken) {
    return res.status(400).json({ error: 'Missing required fields: commentId, message, accessToken' });
  }

  const base = accessToken.startsWith('IGAA') || accessToken.startsWith('IGQ')
    ? 'https://graph.instagram.com/v21.0'
    : 'https://graph.facebook.com/v19.0';

  try {
    const replyRes = await fetch(
      `${base}/${commentId}/replies`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, access_token: accessToken }),
      }
    );
    const data = await replyRes.json();
    if (data.error) return res.status(400).json({ error: data.error.message, code: data.error.code });
    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Instagram reply error:', err);
    return res.status(500).json({ error: 'Failed to post reply', details: err.message });
  }
}
