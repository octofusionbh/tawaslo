// api/meta-publish.js — Publish posts to Instagram & Facebook
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { platform, accountId, accessToken, caption, imageUrl, videoUrl } = req.body;
  if (!platform || !accountId || !accessToken || !caption) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    if (platform === 'ig') {
      // Instagram: create media container then publish
      const mediaType = videoUrl ? 'VIDEO' : imageUrl ? 'IMAGE' : 'TEXT';

      if (mediaType === 'TEXT') {
        // Instagram doesn't support text-only posts via API
        return res.status(400).json({ error: 'Instagram requires an image or video' });
      }

      // Step 1: Create media container
      const containerBody = {
        caption,
        access_token: accessToken,
      };
      if (imageUrl) containerBody.image_url = imageUrl;
      if (videoUrl) { containerBody.video_url = videoUrl; containerBody.media_type = 'REELS'; }

      const containerRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerBody),
      });
      const container = await containerRes.json();
      if (container.error) return res.status(400).json({ error: container.error.message });

      // Step 2: Publish the container
      const publishRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
      });
      const published = await publishRes.json();
      if (published.error) return res.status(400).json({ error: published.error.message });

      return res.status(200).json({ success: true, postId: published.id, platform: 'ig' });

    } else if (platform === 'fb') {
      // Facebook Page post
      const postBody = { message: caption, access_token: accessToken };
      if (imageUrl) postBody.link = imageUrl;

      const postRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postBody),
      });
      const post = await postRes.json();
      if (post.error) return res.status(400).json({ error: post.error.message });

      return res.status(200).json({ success: true, postId: post.id, platform: 'fb' });
    }

    return res.status(400).json({ error: 'Unsupported platform' });
  } catch (err) {
    return res.status(500).json({ error: 'Publish failed', details: err.message });
  }
}
