// api/meta-publish.js — Publish posts to Instagram & Facebook
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { platform, accountId, accessToken, caption, imageUrl, videoUrl, altText } = req.body;
  if (!platform || !accountId || !accessToken || !caption) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    if (platform === 'ig') {
      // Instagram: create media container then publish
      const mediaType = videoUrl ? 'VIDEO' : imageUrl ? 'IMAGE' : 'TEXT';

      if (mediaType === 'TEXT') {
        return res.status(400).json({ error: 'Instagram requires an image or video' });
      }

      // Use graph.instagram.com for IGAA tokens (Instagram-only OAuth)
      // Use graph.facebook.com for EAA tokens (Meta/Facebook OAuth)
      const igBase = accessToken.startsWith('IGAA') || accessToken.startsWith('IGQ')
        ? 'https://graph.instagram.com/v21.0'
        : 'https://graph.facebook.com/v19.0';

      // Step 1: Create media container
      const containerBody = {
        caption,
        access_token: accessToken,
      };
      if (imageUrl && !videoUrl) containerBody.image_url = imageUrl;
      if (videoUrl) { containerBody.video_url = videoUrl; containerBody.media_type = 'REELS'; }
      if (altText) containerBody.alt_text = altText;

      const containerRes = await fetch(`${igBase}/${accountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerBody),
      });
      const container = await containerRes.json();
      console.log('IG container response:', JSON.stringify(container));
      if (container.error) return res.status(400).json({ error: container.error.message });

      // Step 2: Publish the container
      const publishRes = await fetch(`${igBase}/${accountId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
      });
      const published = await publishRes.json();
      console.log('IG publish response:', JSON.stringify(published));
      if (published.error) return res.status(400).json({ error: published.error.message });

      return res.status(200).json({ success: true, postId: published.id, platform: 'ig' });

    } else if (platform === 'fb') {
      let postRes, post;

      if (videoUrl) {
        // Facebook video post
        const videoBody = {
          file_url: videoUrl,
          description: caption,
          access_token: accessToken,
        };
        postRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/videos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(videoBody),
        });
      } else if (imageUrl) {
        // Facebook photo post
        const photoBody = {
          url: imageUrl,
          caption,
          access_token: accessToken,
        };
        postRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(photoBody),
        });
      } else {
        // Text-only post
        const textBody = { message: caption, access_token: accessToken };
        postRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(textBody),
        });
      }

      post = await postRes.json();
      if (post.error) return res.status(400).json({ error: post.error.message });

      return res.status(200).json({ success: true, postId: post.id, platform: 'fb' });
    }

    return res.status(400).json({ error: 'Unsupported platform' });
  } catch (err) {
    return res.status(500).json({ error: 'Publish failed', details: err.message });
  }
}
