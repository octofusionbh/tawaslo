// api/meta-publish.js — Publish posts to Instagram, Facebook & LinkedIn
// Supports: single image/video (Feed/Reel), carousel (multi-image), Story (media-only), first comment, LinkedIn text+image.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { platform, accountId, accessToken, caption } = req.body;
  const imageUrl = req.body.imageUrl || null;
  const videoUrl = req.body.videoUrl || null;
  const imageUrls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls.filter(Boolean).slice(0, 10) : null;
  const altText = req.body.altText || null;
  const firstComment = req.body.firstComment || null;
  const igFormat = (req.body.igFormat || 'feed').toLowerCase(); // feed | reel | story

  if (!platform || !accountId || !accessToken || !caption) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const igBase = (accessToken.startsWith('IGAA') || accessToken.startsWith('IGQ'))
    ? 'https://graph.instagram.com/v21.0'
    : 'https://graph.facebook.com/v19.0';

  const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());

  // Poll a container until FINISHED (used for video/story/carousel parent).
  const waitReady = async (id, tries = 12) => {
    for (let i = 0; i < tries; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const st = await fetch(`${igBase}/${id}?fields=status_code&access_token=${accessToken}`).then(r => r.json());
      if (st.status_code === 'FINISHED') return true;
      if (st.status_code === 'ERROR') return false;
    }
    return true; // assume ready after timeout
  };

  try {
    if (platform === 'ig') {
      let creationId;

      if (imageUrls && imageUrls.length > 1) {
        // CAROUSEL: child containers -> parent container
        const childIds = [];
        for (const url of imageUrls) {
          const c = await post(`${igBase}/${accountId}/media`, { image_url: url, is_carousel_item: true, access_token: accessToken });
          if (c.error) return res.status(400).json({ error: c.error.message });
          childIds.push(c.id);
        }
        const parent = await post(`${igBase}/${accountId}/media`, { media_type: 'CAROUSEL', children: childIds, caption, access_token: accessToken });
        if (parent.error) return res.status(400).json({ error: parent.error.message });
        await waitReady(parent.id);
        creationId = parent.id;

      } else if (igFormat === 'story') {
        // STORY (media only — no caption/stickers via API)
        const body = { media_type: 'STORIES', access_token: accessToken };
        if (videoUrl) body.video_url = videoUrl;
        else if (imageUrl || (imageUrls && imageUrls[0])) body.image_url = imageUrl || imageUrls[0];
        else return res.status(400).json({ error: 'A Story needs an image or video.' });
        const c = await post(`${igBase}/${accountId}/media`, body);
        if (c.error) return res.status(400).json({ error: c.error.message });
        if (videoUrl) await waitReady(c.id);
        creationId = c.id;

      } else {
        // SINGLE image (Feed) or video (Reel)
        const single = imageUrl || (imageUrls && imageUrls[0]) || null;
        if (!single && !videoUrl) return res.status(400).json({ error: 'Instagram requires an image or video.' });
        const body = { caption, access_token: accessToken };
        if (videoUrl) { body.video_url = videoUrl; body.media_type = 'REELS'; }
        else { body.image_url = single; if (altText) body.alt_text = altText; }
        const c = await post(`${igBase}/${accountId}/media`, body);
        if (c.error) return res.status(400).json({ error: c.error.message });
        if (videoUrl) await waitReady(c.id); else await new Promise(r => setTimeout(r, 3000));
        creationId = c.id;
      }

      const published = await post(`${igBase}/${accountId}/media_publish`, { creation_id: creationId, access_token: accessToken });
      if (published.error) return res.status(400).json({ error: published.error.message });

      if (firstComment && published.id) {
        try { await post(`${igBase}/${published.id}/comments`, { message: firstComment, access_token: accessToken }); } catch (e) { /* non-fatal */ }
      }

      return res.status(200).json({ success: true, postId: published.id, platform: 'ig' });

    } else if (platform === 'fb') {
      let result;

      if (imageUrls && imageUrls.length > 1) {
        // FB multi-photo: upload each unpublished, then a feed post that attaches them
        const mediaFbids = [];
        for (const url of imageUrls) {
          const ph = await post(`https://graph.facebook.com/v19.0/${accountId}/photos`, { url, published: false, access_token: accessToken });
          if (ph.error) return res.status(400).json({ error: ph.error.message });
          mediaFbids.push({ media_fbid: ph.id });
        }
        result = await post(`https://graph.facebook.com/v19.0/${accountId}/feed`, { message: caption, attached_media: mediaFbids, access_token: accessToken });
      } else if (videoUrl) {
        result = await post(`https://graph.facebook.com/v19.0/${accountId}/videos`, { file_url: videoUrl, description: caption, access_token: accessToken });
      } else if (imageUrl || (imageUrls && imageUrls[0])) {
        result = await post(`https://graph.facebook.com/v19.0/${accountId}/photos`, { url: imageUrl || imageUrls[0], caption, access_token: accessToken });
      } else {
        result = await post(`https://graph.facebook.com/v19.0/${accountId}/feed`, { message: caption, access_token: accessToken });
      }

      if (result.error) return res.status(400).json({ error: result.error.message });

      if (firstComment && (result.id || result.post_id)) {
        try { await post(`https://graph.facebook.com/v19.0/${result.id || result.post_id}/comments`, { message: firstComment, access_token: accessToken }); } catch (e) { /* non-fatal */ }
      }

      return res.status(200).json({ success: true, postId: result.id || result.post_id, platform: 'fb' });

    } else if (platform === 'li') {
      // LinkedIn — text + optional single image via REST Posts API. Requires a connected token + API approval.
      const version = process.env.LINKEDIN_API_VERSION || '202401';
      const author = String(accountId).startsWith('urn:') ? accountId : `urn:li:person:${accountId}`;
      const liHeaders = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': version,
      };
      const singleImg = imageUrl || (imageUrls && imageUrls[0]) || null;
      let mediaContent = null;

      if (singleImg) {
        // 1) initialize an image upload -> get upload URL + image URN
        const init = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
          method: 'POST', headers: liHeaders,
          body: JSON.stringify({ initializeUploadRequest: { owner: author } }),
        }).then(r => r.json());
        const uploadUrl = init && init.value && init.value.uploadUrl;
        const imageUrn = init && init.value && init.value.image;
        if (!uploadUrl || !imageUrn) return res.status(400).json({ error: 'LinkedIn image init failed', details: init });
        // 2) fetch bytes and upload
        const bytes = await fetch(singleImg).then(r => r.arrayBuffer());
        const up = await fetch(uploadUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` }, body: Buffer.from(bytes) });
        if (!up.ok && up.status !== 201) return res.status(400).json({ error: 'LinkedIn image upload failed', status: up.status });
        mediaContent = { media: { title: (altText || caption || 'image').slice(0, 100), id: imageUrn } };
      }

      const liBody = {
        author,
        commentary: caption,
        visibility: 'PUBLIC',
        distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      };
      if (mediaContent) liBody.content = mediaContent;

      const liRes = await fetch('https://api.linkedin.com/rest/posts', { method: 'POST', headers: liHeaders, body: JSON.stringify(liBody) });
      if (!liRes.ok) { const err = await liRes.json().catch(() => ({})); return res.status(400).json({ error: err.message || 'LinkedIn publish failed', details: err }); }
      const postUrn = liRes.headers.get('x-restli-id') || liRes.headers.get('x-linkedin-id');
      return res.status(200).json({ success: true, postId: postUrn, platform: 'li' });
    }

    return res.status(400).json({ error: 'Unsupported platform' });
  } catch (err) {
    return res.status(500).json({ error: 'Publish failed', details: err.message });
  }
}
