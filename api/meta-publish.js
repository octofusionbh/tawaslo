// api/meta-publish.js — Publish posts to Instagram, Facebook, LinkedIn & TikTok
// Supports: single image/video (Feed/Reel), carousel (multi-image), Story (media-only), first comment, LinkedIn text+image, TikTok video.
export default async function handler(req, res) {
  // === WhatsApp Cloud API (folded in here to stay under Vercel's 12-function limit) ===
  // Webhook verification — Meta calls this once (GET) when you set the callback URL.
  if (req.method === 'GET' && req.query && req.query['hub.mode']) {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.WA_VERIFY_TOKEN) {
      return res.status(200).send(req.query['hub.challenge']);
    }
    return res.status(403).send('Forbidden');
  }
  // Inbound message events (Meta's webhook envelope) + outbound sends (channel:'whatsapp').
  if (req.method === 'POST' && req.body && (req.body.channel === 'whatsapp' || req.body.object === 'whatsapp_business_account')) {
    return handleWhatsApp(req, res);
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { platform, accountId, accessToken, caption } = req.body;
  const imageUrl = req.body.imageUrl || null;
  const videoUrl = req.body.videoUrl || null;
  const imageUrls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls.filter(Boolean).slice(0, 10) : null;
  const altText = req.body.altText || null;
  const altTexts = Array.isArray(req.body.altTexts) ? req.body.altTexts : null; // per-slide alt text for carousels
  const firstComment = req.body.firstComment || null;
  const coverUrl = req.body.coverUrl || null; // optional custom cover for Reels
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
        // CAROUSEL: child containers -> parent container (each child keeps its own alt text)
        const childIds = [];
        for (let idx = 0; idx < imageUrls.length; idx++) {
          const childBody = { image_url: imageUrls[idx], is_carousel_item: true, access_token: accessToken };
          if (altTexts && altTexts[idx]) childBody.alt_text = altTexts[idx];
          const c = await post(`${igBase}/${accountId}/media`, childBody);
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
        if (videoUrl) { body.video_url = videoUrl; body.media_type = 'REELS'; if (coverUrl) body.cover_url = coverUrl; }
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

      let igLink = null;
      try { const pl = await fetch(`${igBase}/${published.id}?fields=permalink&access_token=${accessToken}`).then(r => r.json()); igLink = pl.permalink || null; } catch (e) { /* non-fatal */ }
      return res.status(200).json({ success: true, postId: published.id, permalink: igLink, platform: 'ig' });

    } else if (platform === 'fb') {
      let result;

      if (imageUrls && imageUrls.length > 1) {
        // FB multi-photo: upload each unpublished, then a feed post that attaches them
        const mediaFbids = [];
        for (let idx = 0; idx < imageUrls.length; idx++) {
          const photoBody = { url: imageUrls[idx], published: false, access_token: accessToken };
          if (altTexts && altTexts[idx]) photoBody.alt_text_custom = altTexts[idx];
          const ph = await post(`https://graph.facebook.com/v19.0/${accountId}/photos`, photoBody);
          if (ph.error) return res.status(400).json({ error: ph.error.message });
          mediaFbids.push({ media_fbid: ph.id });
        }
        result = await post(`https://graph.facebook.com/v19.0/${accountId}/feed`, { message: caption, attached_media: mediaFbids, access_token: accessToken });
      } else if (videoUrl) {
        result = await post(`https://graph.facebook.com/v19.0/${accountId}/videos`, { file_url: videoUrl, description: caption, access_token: accessToken });
      } else if (imageUrl || (imageUrls && imageUrls[0])) {
        const photoBody = { url: imageUrl || imageUrls[0], caption, access_token: accessToken };
        if (altText) photoBody.alt_text_custom = altText;
        result = await post(`https://graph.facebook.com/v19.0/${accountId}/photos`, photoBody);
      } else {
        result = await post(`https://graph.facebook.com/v19.0/${accountId}/feed`, { message: caption, access_token: accessToken });
      }

      if (result.error) return res.status(400).json({ error: result.error.message });

      if (firstComment && (result.id || result.post_id)) {
        try { await post(`https://graph.facebook.com/v19.0/${result.id || result.post_id}/comments`, { message: firstComment, access_token: accessToken }); } catch (e) { /* non-fatal */ }
      }

      const fbId = result.id || result.post_id;
      let fbLink = null;
      try { const pl = await fetch(`https://graph.facebook.com/v19.0/${fbId}?fields=permalink_url&access_token=${accessToken}`).then(r => r.json()); fbLink = pl.permalink_url || null; } catch (e) { /* non-fatal */ }
      return res.status(200).json({ success: true, postId: fbId, permalink: fbLink, platform: 'fb' });

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
      const liLink = postUrn ? `https://www.linkedin.com/feed/update/${postUrn}` : null;
      return res.status(200).json({ success: true, postId: postUrn, permalink: liLink, platform: 'li' });

    } else if (platform === 'tt') {
      // TikTok — Content Posting API (video). Uploads the file bytes directly (FILE_UPLOAD) so it
      // works no matter where the video is hosted (no domain verification needed). Posts are
      // SELF_ONLY until the app passes TikTok's audit (flip via the TIKTOK_PRIVACY env var).
      const ttVideo = videoUrl || null;
      if (!ttVideo) return res.status(400).json({ error: 'TikTok needs a video to post.' });
      // TikTok requires querying the creator's allowed settings before a direct post; posting with a
      // privacy level the creator doesn't allow triggers the "review our integration guidelines" error.
      const ciRes = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
        method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
      });
      const ciData = await ciRes.json().catch(() => ({}));
      if (ciData && ciData.error && ciData.error.code && ciData.error.code !== 'ok') {
        return res.status(400).json({ error: 'TikTok creator-check [' + ciData.error.code + ']: ' + (ciData.error.message || ''), details: ciData });
      }
      const ci = (ciData && ciData.data) || {};
      const privOpts = ci.privacy_level_options || [];
      const wantPriv = process.env.TIKTOK_PRIVACY || 'SELF_ONLY';
      const privacy = privOpts.includes(wantPriv) ? wantPriv : (privOpts[0] || 'SELF_ONLY');
      // Pull the video bytes server-side (keep demo clips short — Vercel functions cap at ~10s).
      const vidResp = await fetch(ttVideo);
      if (!vidResp.ok) return res.status(400).json({ error: 'Could not fetch the video file to upload.' });
      const vidBuf = Buffer.from(await vidResp.arrayBuffer());
      const videoSize = vidBuf.length;
      const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({
          post_info: { title: (caption || '').slice(0, 2200), privacy_level: privacy, disable_comment: false, disable_duet: false, disable_stitch: false },
          source_info: { source: 'FILE_UPLOAD', video_size: videoSize, chunk_size: videoSize, total_chunk_count: 1 },
        }),
      });
      const initData = await initRes.json().catch(() => ({}));
      const ttErr = initData && initData.error;
      if (!initRes.ok || (ttErr && ttErr.code && ttErr.code !== 'ok')) {
        return res.status(400).json({ error: 'TikTok publish [' + ((ttErr && ttErr.code) || '?') + ']: ' + ((ttErr && ttErr.message) || 'failed'), details: initData });
      }
      const publishId = initData.data && initData.data.publish_id;
      const uploadUrl = initData.data && initData.data.upload_url;
      if (uploadUrl) {
        const put = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'video/mp4', 'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}` },
          body: vidBuf,
        });
        if (!put.ok && put.status !== 201) return res.status(400).json({ error: 'TikTok video upload failed', status: put.status });
      }
      return res.status(200).json({ success: true, postId: publishId, permalink: null, platform: 'tt' });

    } else if (platform === 'tw') {
      // X (Twitter) — text post via API v2. PAID: ~$0.015/post ($0.20 if it contains a link).
      // Held until go-live; media upload is a follow-up (needs the v1.1 media endpoint).
      const xText = (caption || '').slice(0, 280);
      const xRes = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: xText }),
      });
      const xData = await xRes.json().catch(() => ({}));
      if (!xRes.ok) return res.status(400).json({ error: xData.title || xData.detail || 'X publish failed', details: xData });
      const tweetId = xData.data && xData.data.id;
      const xLink = tweetId ? `https://twitter.com/i/web/status/${tweetId}` : null;
      return res.status(200).json({ success: true, postId: tweetId, permalink: xLink, platform: 'tw' });
    }

    return res.status(400).json({ error: 'Unsupported platform' });
  } catch (err) {
    return res.status(500).json({ error: 'Publish failed', details: err.message });
  }
}

// WhatsApp Cloud API handler — inbound webhook logging + outbound send/template/interactive.
// Outbound calls pass { channel:'whatsapp', action, to, ... }. A per-client token/phoneId can
// be supplied in the body; otherwise the account-level WA_TOKEN / WA_PHONE_ID env vars are used.
async function handleWhatsApp(req, res) {
  const b = req.body || {};

  // --- Inbound webhook from Meta: log best-effort, then always 200 (never make Meta retry). ---
  if (b.object === 'whatsapp_business_account') {
    try {
      const SB = process.env.SUPABASE_URL;
      const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (SB && KEY) {
        const rows = [];
        for (const entry of (b.entry || [])) {
          for (const ch of (entry.changes || [])) {
            const v = (ch && ch.value) || {};
            for (const m of (v.messages || [])) {
              const text = (m.text && m.text.body)
                || (m.button && m.button.text)
                || (m.interactive && m.interactive.list_reply && m.interactive.list_reply.title)
                || (m.interactive && m.interactive.button_reply && m.interactive.button_reply.title)
                || '';
              rows.push({
                wa_message_id: m.id,
                direction: 'in',
                from_number: m.from,
                body: text,
                msg_type: m.type,
                received_at: new Date(Number(m.timestamp || (Date.now() / 1000)) * 1000).toISOString(),
              });
            }
          }
        }
        if (rows.length) {
          await fetch(`${SB}/rest/v1/wa_messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'resolution=ignore-duplicates' },
            body: JSON.stringify(rows),
          }).catch(() => {});
        }
      }
    } catch (e) { /* webhook must never fail */ }
    return res.status(200).json({ received: true });
  }

  // --- Outbound: send a message / template / interactive on behalf of a business. ---
  const token = b.token || process.env.WA_TOKEN;
  const phoneId = b.phoneId || process.env.WA_PHONE_ID;
  if (!token || !phoneId) {
    return res.status(200).json({ ok: false, configured: false, message: 'WhatsApp is not connected yet. Add WA_TOKEN and WA_PHONE_ID (or connect a number) to start sending.' });
  }

  const GRAPH = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
  const to = String(b.to || '').replace(/[^0-9]/g, '');
  const action = b.action || 'send';
  let payload;
  if (action === 'read') {
    payload = { messaging_product: 'whatsapp', status: 'read', message_id: b.messageId };
  } else if (action === 'template') {
    payload = { messaging_product: 'whatsapp', to, type: 'template', template: { name: b.template, language: { code: b.lang || 'en_US' }, ...(b.components ? { components: b.components } : {}) } };
  } else if (action === 'interactive') {
    payload = { messaging_product: 'whatsapp', to, type: 'interactive', interactive: b.interactive };
  } else {
    payload = { messaging_product: 'whatsapp', to, type: 'text', text: { body: b.body || '' } };
  }
  if (!to && action !== 'read') return res.status(400).json({ error: 'Missing recipient number (to).' });

  try {
    const r = await fetch(GRAPH, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    const data = await r.json();
    if (data.error) return res.status(400).json({ error: data.error.message, code: data.error.code });
    return res.status(200).json({ success: true, id: (data.messages && data.messages[0] && data.messages[0].id) || null, data });
  } catch (e) {
    return res.status(500).json({ error: 'WhatsApp send failed', details: e.message });
  }
}
