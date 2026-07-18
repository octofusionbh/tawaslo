// Templated campaign — used if the AI call is unavailable. Returns up to `count`.
function campaignFallback(topic, plats, count) {
  const t = topic || 'our seasonal special';
  const p0 = plats[0] || 'Instagram'; const p1 = plats[1] || p0;
  const all = [
    { format: 'reel', caption: `A quick look at ${t}. Fifteen seconds of the good stuff 🎬`, platform: p0, dayOffset: 0, time: '18:00' },
    { format: 'carousel', caption: `Swipe through everything you need to know about ${t}.`, platform: p0, dayOffset: 1, time: '13:00' },
    { format: 'story_poll', caption: `Quick one for you. Are you into ${t}? Tap to vote 🗳️`, platform: p0, dayOffset: 2, time: '11:00' },
    { format: 'quote', caption: `Good things are worth sharing. ${t}, made with love.`, platform: p1, dayOffset: 3, time: '17:00' },
    { format: 'tip', caption: `A little tip from us on getting the most out of ${t}.`, platform: p0, dayOffset: 4, time: '10:00' },
    { format: 'ugc_repost', caption: `Reshare a happy customer moment with a warm thank you 💛`, platform: p0, dayOffset: 5, time: '12:00' },
    { format: 'behind_scenes', caption: `A peek behind the scenes as we get ${t} just right ✨`, platform: p0, dayOffset: 6, time: '14:00' },
  ];
  return all.slice(0, Math.min(7, Math.max(3, count || 5)));
}

export default async function handler(req, res) {
  // ── WhatsApp Cloud API webhook (folded in here to stay under Vercel's function cap) ──
  if (req.method === 'GET' && req.query && req.query['hub.mode']) {
    const vt = process.env.WHATSAPP_VERIFY_TOKEN || process.env.WA_VERIFY_TOKEN || 'tawaslo_wa_verify';
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === vt) return res.status(200).send(req.query['hub.challenge']);
    return res.status(403).send('Forbidden');
  }
  if (req.method === 'POST' && req.body && req.body.object === 'whatsapp_business_account') {
    try { await handleWhatsApp(req.body); } catch (e) { /* never fail the webhook — Meta retries */ }
    return res.status(200).json({ received: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, platform, tone, lang, audience, details, brand, mode, count, imageUrl, dialect } = req.body;

  // Arabic dialect control — a real differentiator for the GCC/MENA market.
  const DIALECTS = {
    gulf: 'Write the Arabic in natural Gulf (Khaleeji) dialect, as spoken in Bahrain, Saudi, UAE, Kuwait, Qatar and Oman.',
    saudi: 'Write the Arabic in natural Saudi dialect.',
    egyptian: 'Write the Arabic in natural Egyptian dialect.',
    levantine: 'Write the Arabic in natural Levantine (Shami) dialect.',
    msa: 'Write the Arabic in clean Modern Standard Arabic (fusha).',
  };
  const dialectInstruction = (dialect && DIALECTS[dialect]) ? ' ' + DIALECTS[dialect] : '';

  const platformNames = {
    ig: 'Instagram', fb: 'Facebook', tw: 'Twitter/X',
    li: 'LinkedIn', tt: 'TikTok', yt: 'YouTube',
  };

  const platformName = platform ? platformNames[platform] || platform : 'social media';
  const toneText = tone || 'engaging and professional';
  const language = (lang || 'both').toLowerCase(); // 'en' | 'ar' | 'both'
  const theMode = (mode || 'caption').toLowerCase(); // 'caption' | 'ideas' | 'hashtags' | 'vision' | 'alt' | 'image' | 'image-edit'

  // ── HQ Support Copilot: founder/team troubleshooting with screenshots + live context. ──
  // ── AI Menu Importer (chat): reads a PDF/image/spreadsheet menu, asks if unsure, returns items. ──
  if (theMode === 'menu_import') {
    if (!process.env.ANTHROPIC_API_KEY) return res.status(200).json({ error: 'menu_import_unconfigured', message: 'Add ANTHROPIC_API_KEY in Vercel to turn on menu import.' });
    const inMsgs = Array.isArray(req.body.messages) ? req.body.messages.slice(-14) : null;
    const sys = `You are a friendly menu-import assistant for a restaurant platform. The user gives you their existing menu (a PDF, a photo, or a spreadsheet/text export) and you turn it into structured items.

Behaviour:
- Read the menu carefully. If something is genuinely ambiguous — the currency is not clear, prices are missing, you cannot tell if a line is a category or an item, or the text is garbled — ask ONE short specific question and wait.
- Do not ask about things you can reasonably infer. Prefer proceeding.
- When you have what you need (or the user says go ahead), reply with a one-line summary (e.g. "Done — 24 items across 5 categories. Review and edit below.") followed by the final menu as JSON inside <menu></menu> tags.
- The JSON shape MUST be exactly: {"categories":[{"name":"","items":[{"name_en":"","name_ar":"","description":"","price":0}]}]}
- name_en = Latin/English name; name_ar = Arabic name if present else ""; description short or ""; price a number (0 if none, ignore currency symbols). Keep original order; never invent or drop items.
- Keep chat replies short. Reply in the user's language.`;
    const toContent = (m) => {
      const blocks = [];
      if (m.fileBase64 && m.mediaType) {
        const mt = String(m.mediaType); const data = String(m.fileBase64).replace(/^data:[^;]+;base64,/, '');
        if (data) { if (mt === 'application/pdf') blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } }); else blocks.push({ type: 'image', source: { type: 'base64', media_type: mt, data } }); }
      }
      blocks.push({ type: 'text', text: String(m.text || '').slice(0, 40000) || '(see attached menu)' });
      return blocks;
    };
    let aMsgs;
    if (inMsgs && inMsgs.length) { aMsgs = inMsgs.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: toContent(m) })); }
    else {
      const m = {};
      if (req.body.fileBase64) { m.fileBase64 = req.body.fileBase64; m.mediaType = req.body.mediaType; m.text = 'Import this menu.'; }
      else if (req.body.text) { m.text = 'Import this menu (spreadsheet/text export):\n\n' + req.body.text; }
      else return res.status(400).json({ error: 'No file, text or messages provided' });
      aMsgs = [{ role: 'user', content: toContent(m) }];
    }
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 6000, system: sys, messages: aMsgs }) });
      const j = await r.json();
      if (!r.ok) return res.status(200).json({ error: 'parse_failed', message: (j && j.error && j.error.message) || 'Could not read the menu.' });
      let reply = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
      let categories = null;
      const mm = reply.match(/<menu>([\s\S]*?)<\/menu>/i);
      if (mm) {
        let jsonTxt = mm[1].replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
        try { const p = JSON.parse(jsonTxt); if (p && Array.isArray(p.categories)) categories = p.categories; } catch (e) {}
        reply = reply.replace(/<menu>[\s\S]*?<\/menu>/i, '').trim();
      }
      return res.status(200).json({ reply: reply || (categories ? 'Here is your menu — review and edit below.' : 'Sorry, I could not read that.'), categories });
    } catch (e) { return res.status(200).json({ error: 'parse_failed', message: e.message }); }
  }

  if (theMode === 'copilot') {
    if (!process.env.ANTHROPIC_API_KEY) return res.status(200).json({ error: 'copilot_unconfigured', message: 'Add ANTHROPIC_API_KEY in Vercel to turn on the Support Copilot.' });
    const inMsgs = Array.isArray(req.body.messages) ? req.body.messages.slice(-16) : [];
    if (!inMsgs.length) return res.status(400).json({ error: 'A message is required.' });
    const cx = req.body.context || {};
    const errs = Array.isArray(cx.errors) ? cx.errors.slice(0, 25) : [];
    const tix = Array.isArray(cx.tickets) ? cx.tickets.slice(0, 25) : [];
    let ctxBlock = '';
    if (errs.length) {
      ctxBlock += '\n\nRECENT ERROR LOGS (most recent first):\n' + errs.map((e, i) => `${i + 1}. [${e.kind || 'error'}] "${String(e.message || '').slice(0, 200)}" on ${e.page || '?'} - user ${e.user_email || 'guest'} - ${e.count ? e.count + 'x, ' : ''}${e.created_at || ''}${e.resolved ? ' (resolved)' : ''}`).join('\n');
    }
    if (tix.length) {
      ctxBlock += '\n\nOPEN SUPPORT TICKETS:\n' + tix.map((t, i) => `${i + 1}. ${t.subject || '(no subject)'} - from ${t.who || t.email || '?'} - status ${t.status || 'open'}${t.urgent ? ' (URGENT)' : ''}`).join('\n');
    }
    const sys = `You are the Tawaslo HQ Support Copilot - an expert engineer and product guide for Tawaslo, an Arabic-first social media management and restaurant (F&B) SaaS. You help the founder and their team diagnose errors, understand what is breaking for their clients, and answer support tickets.

How to help:
- Be concrete and practical. When shown an error or a screenshot, explain in plain language what is likely wrong and the most probable cause, then give clear step-by-step guidance to fix or investigate it.
- When asked to answer a client, draft a warm, professional reply the team can copy, edit and send. Never claim to have sent anything.
- You can see screenshots the user attaches - read them carefully (UI state, error text, console output) and reference exactly what you see.
- You are a copilot, not an autopilot: you suggest and guide, you do not change code, settings, or send messages yourself. If a fix needs a code or database change, describe exactly what to change and where.
- Keep answers focused and skimmable. Reply in the user's language (English or Arabic).${ctxBlock ? '\n\nHere is live context from the Tawaslo workspace you may reference when relevant:' + ctxBlock : ''}`;

    const toContent = (m) => {
      const blocks = [];
      const imgs = Array.isArray(m.images) ? m.images.slice(0, 4) : [];
      imgs.forEach((d) => {
        try {
          const mt = (String(d).match(/^data:(image\/[\w.+-]+);base64,/) || [])[1] || 'image/png';
          const data = String(d).replace(/^data:image\/[\w.+-]+;base64,/, '');
          if (data) blocks.push({ type: 'image', source: { type: 'base64', media_type: mt, data } });
        } catch (e) {}
      });
      const text = String(m.text || '').slice(0, 6000);
      blocks.push({ type: 'text', text: text || '(see attached image)' });
      return blocks;
    };
    const aMsgs = inMsgs.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: toContent(m) }));
    const reportKind = String(req.body.report || '').toLowerCase();
    const reportExtra = reportKind === 'internal'
      ? '\n\n[REPORT MODE] Based on the conversation above, output ONLY an INTERNAL FIX REPORT for team records / to close a support ticket, in exactly this layout:\nISSUE: (one line)\nSOURCE: (client name, or internal)\nDATE: (today)\nROOT CAUSE: (plain technical explanation)\nFIX APPLIED: (what resolves it, or the recommended fix if not yet applied)\nAREAS AFFECTED: (pages / tables / files)\nSTATUS: (Resolved or Pending)\nNOTES: (anything to watch)\nBe factual and concise. No greeting, no sign-off.'
      : reportKind === 'client'
      ? '\n\n[REPORT MODE] Based on the conversation above, write ONLY a warm, professional message the team can email to their CLIENT as-is. Rules: no code, no internal file or table names, no jargon, no blame. Briefly acknowledge the issue in plain language, confirm it is resolved (or actively being handled), tell them what they can now do, and close politely signed "The Tawaslo Team". Start with "Hi,". Output only the message.'
      : '';

    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 1600, system: sys + reportExtra, messages: aMsgs }),
      });
      const j = await r.json();
      if (!r.ok) return res.status(200).json({ error: 'copilot_failed', message: (j && j.error && j.error.message) || 'Claude request failed.' });
      const reply = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
      return res.status(200).json({ reply: reply || 'Sorry, I could not generate a response.' });
    } catch (e) {
      return res.status(200).json({ error: 'copilot_failed', message: e.message });
    }
  }

  // ── Campaign Autopilot: a trend/topic in, five on-brand posts out (one AI call). ──
  if (theMode === 'campaign') {
    const plats = (Array.isArray(req.body.platforms) && req.body.platforms.length) ? req.body.platforms : ['Instagram', 'Facebook'];
    const cCount = Math.min(7, Math.max(3, Number(req.body.count) || 5));
    const cTopic = req.body.topic || topic || 'our seasonal special';
    const cv = req.body.voice || null;
    let voiceBlock = '';
    if (cv) {
      const emojiRule = cv.emoji === 'none' ? 'Use no emojis.' : cv.emoji === 'lots' ? 'Use emojis freely where natural.' : 'Use a few tasteful emojis.';
      const lines = [
        (cv.tones && cv.tones.length) ? `Brand personality: ${cv.tones.join(', ')}.` : '',
        emojiRule,
        (cv.dos && cv.dos.length) ? `Always: ${cv.dos.join('; ')}.` : '',
        (cv.donts && cv.donts.length) ? `Never: ${cv.donts.join('; ')}.` : '',
        (cv.examples && cv.examples.length) ? `Match the style of these examples:\n- ${cv.examples.slice(0, 6).join('\n- ')}` : '',
      ].filter(Boolean).join('\n');
      if (lines) voiceBlock = `\nWrite in this brand's voice:\n${lines}\n`;
    }
    const langLine = language === 'ar' ? 'Write captions in Arabic.' : language === 'en' ? 'Write captions in English.' : 'Write captions in English.';
    const sys = `You are a senior social media strategist. From a trend or topic, design a tight ${cCount} post mini campaign for ONE brand. Use a varied mix of these formats (do not repeat one until the others are used): reel, carousel, story_poll, quote, tip, ugc_repost, behind_scenes. Each post needs a ready to publish caption with tasteful emojis and a few relevant hashtags, the best platform chosen from [${plats.join(', ')}], a dayOffset integer from 0 to 6, and a time in HH:MM. ${langLine} Do not use hyphens or dashes anywhere in the captions. Return ONLY a JSON object, no markdown.`;
    const userMsg = `Trend or topic: ${cTopic}\nBrand: ${req.body.brand || ''}${voiceBlock}\nReturn JSON exactly: { "posts": [ { "format": "reel", "caption": "", "platform": "", "dayOffset": 0, "time": "18:00" } ] } with exactly ${cCount} posts, spread across different days.`;
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 1200, system: sys, messages: [{ role: 'user', content: userMsg }] }) });
        if (r.ok) { const d = await r.json(); const txt = (d.content && d.content[0] && d.content[0].text) || ''; const mt = txt.match(/\{[\s\S]*\}/); if (mt) { const parsed = JSON.parse(mt[0]); if (parsed && Array.isArray(parsed.posts) && parsed.posts.length) return res.status(200).json({ ok: true, posts: parsed.posts.slice(0, cCount) }); } }
      }
    } catch (e) { /* fall through to templated */ }
    return res.status(200).json({ ok: true, demo: true, posts: campaignFallback(cTopic, plats, cCount) });
  }

  // ── AI image generation & editing (Google Gemini "Nano Banana") ────────
  // Folded into this endpoint to stay under Vercel's function limit. Needs a
  // GEMINI_API_KEY from Google AI Studio (aistudio.google.com — free tier, no
  // card required). Model gemini-2.5-flash-image handles both text to image
  // and image editing (an input image is passed as inline_data).
  if (theMode === 'image' || theMode === 'image-edit') {
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return res.status(200).json({ error: 'image_engine_unconfigured', message: 'Add GEMINI_API_KEY in Vercel to turn on AI images.' });
    const promptIn = req.body.prompt || topic;
    if (!promptIn) return res.status(400).json({ error: 'A prompt is required.' });
    const size = ['1024x1024', '1024x1536', '1536x1024'].includes(req.body.size) ? req.body.size : '1024x1024';
    const sizeToAR = { '1024x1024': '1:1', '1024x1536': '2:3', '1536x1024': '3:2' };
    const aspectRatio = sizeToAR[size] || '1:1';
    const n = Math.min(parseInt(req.body.n, 10) || 2, 4);
    const MODEL = 'gemini-2.5-flash-image';
    const realStyle = req.body.realistic ? ' Render this as a realistic photograph: shot on a full-frame DSLR with a 50mm lens, natural lighting, true-to-life colors, real textures and natural skin with pores and subtle imperfections, shallow depth of field. Photojournalistic realism. It must NOT look like an illustration, 3D render, CGI, or digital art; no plastic or over-smoothed skin, no waxy AI look, no oversaturation, no cartoon style.' : '';
    const prompt = `${promptIn}\n\nProduce the image with a ${aspectRatio} aspect ratio.${realStyle}`;
    try {
      const parts = [{ text: prompt }];
      if (theMode === 'image-edit' && req.body.imageBase64) {
        const raw = String(req.body.imageBase64).replace(/^data:image\/\w+;base64,/, '');
        parts.push({ inline_data: { mime_type: 'image/png', data: raw } });
      }
      const callOnce = async () => {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'] } }),
        });
        const d = await r.json();
        if (d.error) throw new Error(d.error.message || 'Gemini error');
        const cand = d.candidates && d.candidates[0];
        const outParts = (cand && cand.content && cand.content.parts) || [];
        const imgPart = outParts.find(p => p.inlineData || p.inline_data);
        const inline = imgPart && (imgPart.inlineData || imgPart.inline_data);
        if (!inline || !inline.data) throw new Error('No image returned');
        return 'data:' + (inline.mimeType || inline.mime_type || 'image/png') + ';base64,' + inline.data;
      };
      // Nano Banana returns one image per call, so fan out for the requested count.
      const settled = await Promise.allSettled(Array.from({ length: n }, () => callOnce()));
      const images = settled.filter(s => s.status === 'fulfilled').map(s => s.value);
      if (!images.length) {
        const firstErr = settled.find(s => s.status === 'rejected');
        return res.status(400).json({ error: firstErr ? firstErr.reason.message : 'Image generation failed' });
      }
      return res.status(200).json({ images });
    } catch (e) {
      return res.status(500).json({ error: 'Image generation failed', details: e.message });
    }
  }

  // ── Geo currency hint ──────────────────────────────────────────────
  // Returns the visitor's country and an approximate local-currency rate so
  // the pricing cards can show a small "approx X BHD" line under the USD
  // price. Display only — billing is always taken in USD. Rates are static
  // (GCC pegs are fixed; the rest are rounded estimates, and the line is
  // explicitly labelled "approx" so exactness is not implied).
  if (theMode === 'geo') {
    const cc = String(req.headers['x-vercel-ip-country'] || '').toUpperCase();
    const MAP = {
      BH:{ currency:'BHD', rate:0.376 }, SA:{ currency:'SAR', rate:3.75 },
      AE:{ currency:'AED', rate:3.67 },  KW:{ currency:'KWD', rate:0.307 },
      QA:{ currency:'QAR', rate:3.64 },  OM:{ currency:'OMR', rate:0.385 },
      JO:{ currency:'JOD', rate:0.709 }, EG:{ currency:'EGP', rate:49 },
      GB:{ currency:'GBP', rate:0.79 },  CA:{ currency:'CAD', rate:1.37 },
      AU:{ currency:'AUD', rate:1.52 },  IN:{ currency:'INR', rate:83 },
      PK:{ currency:'PKR', rate:278 },   TR:{ currency:'TRY', rate:32 },
    };
    const EU = ['DE','FR','ES','IT','NL','IE','PT','AT','BE','FI','GR','LU','SK','SI','EE','LV','LT','CY','MT'];
    const info = MAP[cc] || (EU.includes(cc) ? { currency:'EUR', rate:0.92 } : null);
    return res.status(200).json({
      country: cc || null,
      currency: info ? info.currency : 'USD',
      rate: info ? info.rate : 1,
    });
  }

  // ── RSS / suggested content — fetch & parse blog/news feeds into post ideas. ──
  if (theMode === 'rss') {
    const urls = Array.isArray(req.body.urls) ? req.body.urls.slice(0, 5) : (req.body.url ? [req.body.url] : []);
    if (!urls.length) return res.status(200).json({ items: [] });
    const clean = (s) => String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').replace(/&#?\w+;/g, ' ').replace(/\s+/g, ' ').trim();
    const fetchFeed = async (u) => {
      try {
        const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 6000);
        const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 TawasloBot' }, signal: ctrl.signal }); clearTimeout(timer);
        const xml = await r.text();
        let host = u; try { host = new URL(u).hostname.replace(/^www\./, ''); } catch (e) {}
        const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/(item|entry)>/gi) || [];
        const out = [];
        for (const b of blocks.slice(0, 12)) {
          const pick = (tag) => { const m = b.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i')); return m ? m[1] : ''; };
          const title = clean(pick('title'));
          let link = clean(pick('link'));
          if (!link) { const lm = b.match(/<link[^>]*href=["']([^"']+)["']/i); if (lm) link = lm[1]; }
          const snippet = clean(pick('description') || pick('summary') || pick('content')).slice(0, 180);
          const date = clean(pick('pubDate') || pick('updated') || pick('published'));
          let image = null;
          const mm = b.match(/<(?:media:content|media:thumbnail|enclosure)[^>]*url=["']([^"']+)["']/i); if (mm) image = mm[1];
          if (!image) { const im = b.match(/<img[^>]*src=["']([^"']+)["']/i); if (im) image = im[1]; }
          if (title) out.push({ title, link, snippet, date, source: host, image });
        }
        return out;
      } catch (e) { return []; }
    };
    const all = (await Promise.all(urls.map(fetchFeed))).flat();
    return res.status(200).json({ items: all.slice(0, 16) });
  }

  // ── Concierge — the AI front desk. Reads the venue's menu + availability,
  // answers guest questions and books a table. Multi-turn: takes the chat
  // history + a context object, returns { reply, booking }. The booking is
  // executed client-side against Supabase so no service key is needed here.
  if (theMode === 'concierge') {
    const ctx = req.body.context || {};
    const convo = Array.isArray(req.body.messages) ? req.body.messages.slice(-12) : [];
    if (!convo.length) return res.status(400).json({ error: 'messages required' });
    const out = await conciergeReply(ctx, convo);
    if (out.error) return res.status(500).json({ error: 'Concierge AI error', details: out.details });
    if (!ctx.preview) bumpConcierge(ctx.client_id);
    return res.status(200).json({ reply: out.reply, booking: out.booking, order: out.order });
  }

  // Vision modes need an image; reply needs a message; everything else needs a topic.
  if ((theMode === 'vision' || theMode === 'alt')) {
    if (!imageUrl) return res.status(400).json({ error: 'An image is required.' });
  } else if (theMode === 'reply') {
    if (!req.body.message) return res.status(400).json({ error: 'A message is required.' });
  } else if (theMode === 'analyze') {
    if (!Array.isArray(req.body.messages) || !req.body.messages.length) return res.status(200).json({ sentiment: null, topics: [] });
  } else if (theMode === 'occasions') {
    if (!req.body.products) return res.status(200).json({ days: [] });
  } else if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const extras = [
    brand ? `Brand: ${brand}` : '',
    audience ? `Target audience: ${audience}` : '',
    details ? `Key points / call-to-action: ${details}` : '',
  ].filter(Boolean).join('\n');

  // Build the message content. Vision modes attach the image as an image block.
  let messageContent;
  let maxTokens = 700;

  if (theMode === 'vision') {
    // "Read the image" — describe what's in the photo so the user can build a caption from it.
    maxTokens = 300;
    const visionPrompt = `Look at this image and describe what it shows in one or two natural sentences a social media manager could use as a starting point for a caption. Mention the main subject, mood, setting and any visible text or product. Be concrete and specific. ${details ? `The user adds this context: ${details}. Fold it in.` : ''} Return ONLY the description, no preamble.`;
    messageContent = [
      { type: 'image', source: { type: 'url', url: imageUrl } },
      { type: 'text', text: visionPrompt },
    ];
  } else if (theMode === 'alt') {
    // Generate accessibility alt text for one image.
    maxTokens = 150;
    const altPrompt = `Write concise, factual alt text describing this image for a blind or low-vision user on ${platformName}. One sentence, under 120 characters, describe what is literally visible (people, objects, setting, any text). Do not start with "image of" or "photo of". ${details ? `Context: ${details}.` : ''} Return ONLY the alt text.`;
    messageContent = [
      { type: 'image', source: { type: 'url', url: imageUrl } },
      { type: 'text', text: altPrompt },
    ];
  } else if (theMode === 'ideas') {
    const n = Math.min(Math.max(parseInt(count, 10) || 6, 3), 10);
    messageContent = `You are a social media strategist working with brands worldwide. Generate ${n} distinct, scroll-stopping ${platformName} post ideas about the topic below. Each idea is one short sentence (a hook or concept), not a full caption.

Topic: ${topic}
Tone: ${toneText}
${extras}

Return ONLY a JSON object in this exact format (no markdown, no extra text):
{ "ideas": ["idea 1", "idea 2", "idea 3"] }`;
  } else if (theMode === 'hashtags') {
    messageContent = `You are a social media expert working with brands worldwide. Generate the 5 most relevant ${platformName} hashtags for the topic below. Mix broad and niche tags.

Topic: ${topic}
${extras}

Return ONLY a JSON object in this exact format (no markdown, no extra text):
{ "hashtags": ["#tag1", "#tag2"] }`;
  } else if (theMode === 'reply') {
    // Reply Assistant — generate on-brand replies, conditioned on the client's trained Brand Voice.
    maxTokens = 600;
    const v = req.body.voice || {};
    const incoming = String(req.body.message || '');
    const emojiRule = v.emoji === 'none' ? 'Use no emojis.' : v.emoji === 'lots' ? 'Use emojis freely where natural.' : 'Use a few tasteful emojis.';
    const voiceLines = [
      (v.tones && v.tones.length) ? `Brand personality: ${v.tones.join(', ')}.` : '',
      emojiRule,
      v.signoff ? `End each reply with this sign-off exactly: "${v.signoff}".` : '',
      (v.facts && v.facts.length) ? `Use these facts, accurately and only when relevant:\n- ${v.facts.join('\n- ')}` : '',
      (v.dos && v.dos.length) ? `Always: ${v.dos.join('; ')}.` : '',
      (v.donts && v.donts.length) ? `Never: ${v.donts.join('; ')}.` : '',
      (v.examples && v.examples.length) ? `Match the style of these example replies:\n- ${v.examples.slice(0, 8).join('\n- ')}` : '',
    ].filter(Boolean).join('\n');
    const langRule = language === 'en' ? 'Write the replies in English.'
      : language === 'ar' ? 'Write the replies in Arabic.'
      : language === 'both' ? 'For each reply, write the English version first, then the Arabic version underneath.'
      : 'Reply in the same language the customer used (Arabic if they wrote Arabic, English if they wrote English).';
    messageContent = `You are the social media community manager for ${brand || 'this brand'}, replying to a customer on ${platformName}. Write 2 short, on-brand reply options to the message below. Keep each warm, helpful and concise (1-2 sentences). ${langRule}
${voiceLines ? '\nBrand voice to follow:\n' + voiceLines + '\n' : ''}
Tone: ${toneText}
Customer message: "${incoming}"

Return ONLY a JSON object in this exact format (no markdown, no extra text):
{ "replies": ["reply option 1", "reply option 2"] }`;
  } else if (theMode === 'analyze') {
    // Read real inbox messages → sentiment split + top topics for the engagement report.
    maxTokens = 500;
    const msgs = req.body.messages.slice(0, 60).map((m, i) => `${i + 1}. ${String(m).slice(0, 180)}`).join('\n');
    messageContent = `You are analyzing customer messages (comments and DMs) for a brand's monthly social media report. Messages may be in English or Arabic.

Messages:
${msgs}

Return ONLY a JSON object (no markdown):
{ "sentiment": { "positive": <int>, "neutral": <int>, "negative": <int> }, "topics": [["short topic or question label", <int count>]], "loved": "<one short phrase: what people praised most>", "watch": "<one short phrase: an issue or request worth watching>" }
The three sentiment percentages must be integers that sum to 100. Give up to 4 topics, most common first. Keep "loved" and "watch" under 8 words each.`;
  } else if (theMode === 'occasions') {
    // Match a client's products to real observance / national "days" they can market around.
    maxTokens = 700;
    messageContent = `You are a social media planning assistant. A business sells: ${req.body.products}.
List up to 8 real, widely-recognized recurring observance / awareness / national "days" this business could create marketing content around (for example, International Coffee Day for a cafe, World Tourism Day for a hotel). Only include real, well-known days that genuinely relate to what they sell. Give each day's approximate annual date.

Return ONLY a JSON object (no markdown, no extra text):
{ "days": [ { "en": "English name", "ar": "الاسم بالعربية", "md": "MM-DD" } ] }
Use zero-padded MM-DD (month-day). Order by calendar date. If nothing clearly fits, return an empty array.`;
  } else if (theMode === 'strategy') {
    // Content strategy generator — a brief becomes pillars, cadence and themes.
    maxTokens = 1100;
    const langRule = (language === 'ar'
      ? 'Write ALL text fields (names, descriptions, examples, themes, notes, summary) in Arabic.'
      : 'Write all text fields in English.') + (language !== 'en' ? dialectInstruction : '');
    messageContent = `You are a senior social media strategist building a content strategy for a brand. ${langRule}

Brand: ${brand || 'the brand'}
Brief / goals: ${topic}
${audience ? `Audience: ${audience}` : ''}
${details ? `Extra context: ${details}` : ''}
${platform ? `Primary platform: ${platformName}` : ''}

Produce a practical, specific content strategy. Give 4 content pillars (each with a short name, a one-sentence description, and 2 concrete example post ideas), a recommended weekly cadence with a per-platform breakdown, 5 recurring content themes, and a one-line strategy summary.

Return ONLY a JSON object in this exact format (no markdown, no extra text):
{
  "summary": "one-line strategy summary",
  "pillars": [ { "name": "Pillar name", "description": "one sentence", "examples": ["idea 1", "idea 2"] } ],
  "cadence": { "postsPerWeek": 5, "byPlatform": [["Instagram", 3], ["Facebook", 2]], "note": "short cadence note" },
  "themes": ["theme 1", "theme 2", "theme 3", "theme 4", "theme 5"]
}`;
  } else if (theMode === 'reel') {
    // Short-video studio — a topic becomes a full Reel/TikTok/Shorts script.
    maxTokens = 1400;
    const dur = req.body.duration || '30s';
    const langRule = (language === 'ar'
      ? 'Write ALL text fields (title, hook, onscreen, voiceover, caption, cta, audio) in Arabic. Keep "shot" visual directions in English so a videographer anywhere can follow them.'
      : language === 'en'
      ? 'Write all text fields in English.'
      : 'Write the title, hook, onscreen text, voiceover, caption, cta and audio in Arabic; keep "shot" visual directions in English.') + (language !== 'en' ? dialectInstruction : '');
    messageContent = `You are a viral short-video director and scriptwriter for Instagram Reels, TikTok and YouTube Shorts. ${langRule}

Topic/Product: ${topic}
Brand: ${brand || 'the brand'}
Platform: ${platformName}
Target length: ${dur}
Tone: ${toneText}
${audience ? `Audience: ${audience}` : ''}
${details ? `Extra context: ${details}` : ''}

Write a complete, production-ready short-video script. Open with a scroll-stopping hook in the first 2 seconds. Break the video into ${dur === '15s' ? '3-4' : dur === '60s' ? '6-8' : '4-6'} scenes; for each scene give the timecode, the shot/visual direction, the on-screen text, and the voiceover/spoken line. Keep it punchy and native to the platform. Then give a caption with emojis, a maximum of 5 relevant hashtags (Instagram recommends 5 or fewer), a clear CTA, and a trending-style audio/music suggestion.

Return ONLY a JSON object in this exact format (no markdown, no extra text):
{
  "title": "short punchy title",
  "hook": "the opening hook line (first 2 seconds)",
  "scenes": [ { "time": "0-3s", "shot": "visual / what to film", "onscreen": "on-screen text", "voiceover": "spoken line" } ],
  "caption": "the post caption with emojis",
  "hashtags": ["#tag1", "#tag2"],
  "cta": "call to action",
  "audio": "trending audio or music suggestion"
}`;
  } else if (theMode === 'compete') {
    // Competitor analysis — turn a competitor handle + our niche into a beat-them playbook.
    maxTokens = 1300;
    const comp = req.body.competitor || topic;
    const niche = req.body.niche || brand || '';
    const stats = req.body.stats ? `\nKnown public stats (use these as ground truth): ${JSON.stringify(req.body.stats)}` : '';
    const langRule = (language === 'ar' ? 'Write ALL text fields in Arabic.' : 'Write all text fields in English.') + (language !== 'en' ? dialectInstruction : '');
    messageContent = `You are a competitive social media strategist. A brand wants to outperform a competitor on ${platformName || 'Instagram'}. ${langRule}

Competitor: ${comp}
Our brand / niche: ${niche || 'a brand in the same space'}${stats}

Analyze the competitor's likely social strategy and give a sharp, realistic, actionable plan to beat them. If you are unsure of exact figures, give informed estimates and keep them plausible.

Return ONLY a JSON object in this exact format (no markdown, no extra text):
{
  "opportunity": "High | Medium | Low — how big the opening is for us to beat them",
  "opportunityWhy": "one short clause explaining the opportunity rating",
  "sentiment": 72,
  "summary": "one-line read on the competitor's positioning",
  "strengths": ["what they do well (3 items)"],
  "gaps": ["weaknesses / gaps we can exploit (3-4 items)"],
  "contentMix": [["Reels", 45], ["Carousels", 30], ["Stories", 25]],
  "hashtags": ["#relevant", "#hashtags", "to target (8-10 items)"],
  "postingTips": ["cadence / timing tips (2-3 items)"],
  "quietWindow": "one specific weak time-slot in their posting we can own",
  "playbook": ["concrete move to win (5-6 specific actions, most impactful first)"]
}
Notes: "sentiment" is the estimated % of their audience reactions/comments that are positive (0-100 integer). Order "playbook" from highest impact to lowest.`;
  } else if (theMode === 'report') {
    // Reports — turn the month's stats into a short executive insight + a recommendation.
    maxTokens = 700;
    const stats = req.body.stats ? JSON.stringify(req.body.stats) : '{}';
    const langRule = language === 'ar' ? 'Write in Arabic.' : 'Write in English.';
    messageContent = `You are a senior social-media strategist writing the executive summary of a client's monthly report. ${langRule}
Here are this month's figures: ${stats}
Write a sharp, confident 2–3 sentence read of how the account is doing — what's working, what stands out — then one specific, actionable recommendation for next month. No fluff, no restating every number; give insight a busy client would value. If figures are zero or missing, focus on growth setup and next steps honestly.
Return ONLY a JSON object (no markdown): {"summary": "the 2-3 sentence read", "recommendation": "one concrete next step"}`;
  } else if (theMode === 'score') {
    // Post Score & Optimizer — rate a caption's engagement potential and rewrite it stronger.
    maxTokens = 1100;
    const cap = req.body.caption || topic || '';
    const hasMedia = req.body.hasMedia ? 'The post includes an image or video.' : 'The post has no media attached yet.';
    const langRule = language === 'ar'
      ? 'Write the verdict, issues and tips in Arabic.'
      : 'Write the verdict, issues and tips in English.';
    messageContent = `You are a social media performance analyst. Score the following ${platformName || 'social'} post for engagement potential, then rewrite the caption stronger. ${langRule} Keep the "improved" caption in the SAME language(s) as the original.

Caption:
"""${cap}"""
${hasMedia}

Give an overall score 0-100, and rate Hook, Clarity, Emotion, CTA and Hashtags each out of 10. Name the 2-3 biggest issues. Rewrite the caption to be stronger while keeping its meaning and a brand-appropriate tone. Add 2-3 quick tips.

Return ONLY a JSON object in this exact format (no markdown, no extra text):
{
  "score": 78,
  "verdict": "one-line overall verdict",
  "breakdown": [["Hook", 8], ["Clarity", 7], ["Emotion", 6], ["CTA", 5], ["Hashtags", 9]],
  "issues": ["issue 1", "issue 2"],
  "improved": "the stronger rewritten caption, same language as the original",
  "tips": ["tip 1", "tip 2"]
}`;
  } else if (theMode === 'triage') {
    // Smart inbox triage — classify each incoming comment/DM by intent + urgency in one call.
    maxTokens = 1600;
    const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 40) : [];
    if (!items.length) return res.status(200).json({ results: [] });
    const list = items.map(it => `[${it.id}] ${String(it.text || '').replace(/\s+/g, ' ').slice(0, 280)}`).join('\n');
    messageContent = `You are a social media support triage assistant. Classify each incoming message/comment below by intent and urgency. Messages may be in English or Arabic.

Categories: "lead" (buying/booking intent), "question" (asking for info), "complaint" (unhappy / has a problem), "praise" (positive feedback / thanks), "spam" (spam, bot, or irrelevant), "other".
Priority: "high" (needs a fast response — hot leads and complaints), "medium", "low".

Messages (format is [id] text):
${list}

Return ONLY a JSON object (no markdown), echoing each id exactly:
{ "results": [ { "id": "the id", "category": "lead|question|complaint|praise|spam|other", "priority": "high|medium|low" } ] }`;
  } else {
    const shape = language === 'en'
      ? '{\n  "english": "the English caption with relevant emojis and hashtags",\n  "arabic": ""\n}'
      : language === 'ar'
      ? '{\n  "english": "",\n  "arabic": "النص العربي مع إيموجي وهاشتاق مناسب"\n}'
      : '{\n  "english": "the English caption with relevant emojis and hashtags",\n  "arabic": "النص العربي مع إيموجي وهاشتاق مناسب"\n}';

    const langInstruction = (language === 'en'
      ? 'Generate the caption in English only. Leave "arabic" as an empty string.'
      : language === 'ar'
      ? 'Generate the caption in Arabic only. Leave "english" as an empty string.'
      : 'Generate captions in BOTH English and Arabic.') + (language !== 'en' ? dialectInstruction : '');

    // Optional brand voice — when the client has a trained voice and the toggle is on,
    // condition the caption on it so it sounds like that brand, consistently.
    const cv = req.body.voice || null;
    let voiceBlock = '';
    if (cv) {
      const emojiRule = cv.emoji === 'none' ? 'Use no emojis.' : cv.emoji === 'lots' ? 'Use emojis freely where natural.' : 'Use a few tasteful emojis.';
      const lines = [
        (cv.tones && cv.tones.length) ? `Brand personality: ${cv.tones.join(', ')}.` : '',
        emojiRule,
        cv.signoff ? `Where natural, you may end with: "${cv.signoff}".` : '',
        (cv.facts && cv.facts.length) ? `Use these facts accurately, only when relevant:\n- ${cv.facts.join('\n- ')}` : '',
        (cv.dos && cv.dos.length) ? `Always: ${cv.dos.join('; ')}.` : '',
        (cv.donts && cv.donts.length) ? `Never: ${cv.donts.join('; ')}.` : '',
        (cv.examples && cv.examples.length) ? `Match the style of these examples:\n- ${cv.examples.slice(0, 8).join('\n- ')}` : '',
      ].filter(Boolean).join('\n');
      if (lines) voiceBlock = `\nWrite in this brand's voice:\n${lines}\n`;
    }

    messageContent = `You are a social media copywriter working with brands worldwide. ${langInstruction}

Topic/Product: ${topic}
Platform: ${platformName}
Tone: ${toneText}
${extras}${voiceBlock}
Hashtag rule: include a maximum of 5 highly relevant hashtags — Instagram now recommends 5 or fewer. Never include more than 5 hashtags in the caption.
Return ONLY a JSON object in this exact format (no markdown, no extra text):
${shape}`;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: messageContent }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Anthropic API error', details: err });
    }

    const data = await response.json();
    const text = data.content[0].text.trim();

    // Plain-text modes return their text directly.
    if (theMode === 'vision') return res.status(200).json({ description: text });
    if (theMode === 'alt') return res.status(200).json({ alt: text.replace(/^["']|["']$/g, '') });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      if (theMode === 'ideas') return res.status(200).json({ ideas: [text] });
      if (theMode === 'occasions') return res.status(200).json({ days: [] });
      if (theMode === 'hashtags') return res.status(200).json({ hashtags: [] });
      if (theMode === 'reply') return res.status(200).json({ replies: [text] });
      if (theMode === 'analyze') return res.status(200).json({ sentiment: null, topics: [] });
      return res.status(200).json({ english: text, arabic: '' });
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate caption', details: err.message });
  }
}

// ── Shared Concierge brain — used by the web widget AND the WhatsApp webhook. ──
async function conciergeReply(ctx, convo) {
  ctx = ctx || {}; convo = Array.isArray(convo) ? convo.slice(-12) : [];
  const tagWords = { veg: 'vegetarian', vegan: 'vegan', halal: 'halal', glutenfree: 'gluten-free', dairyfree: 'dairy-free', nuts: 'contains nuts', spicy: 'spicy', popular: "chef's pick" };
  const menuLines = (ctx.menu || []).slice(0, 60).map(m => {
    const tg = Array.isArray(m.tags) && m.tags.length ? ' [' + m.tags.map(t => tagWords[t] || t).join(', ') + ']' : '';
    const vs = Array.isArray(m.variants) ? m.variants.filter(v => v && v.name) : [];
    const priceStr = vs.length
      ? ' — sizes: ' + vs.map(v => `${v.name}${v.price != null ? ' ' + v.price + ' ' + (ctx.currency || 'BHD') : ''}`).join(', ')
      : (m.price != null ? ' — ' + m.price + ' ' + (ctx.currency || 'BHD') : '');
    const ad = Array.isArray(m.addons) ? m.addons.filter(a => a && a.name) : [];
    const adStr = ad.length ? ' — extras: ' + ad.map(a => `${a.name}${a.price != null ? ' +' + a.price : ''}`).join(', ') : '';
    return `${m.category || 'Menu'}: ${m.name_en || ''}${m.name_ar ? ' / ' + m.name_ar : ''}${priceStr}${adStr}${m.available === false ? ' (sold out)' : ''}${tg}`;
  }).join('\n');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const closed = (ctx.closedDays || []).map(d => dayNames[d]).join(', ') || 'none';
  const dp = ctx.dayparts;
  const hrs = (dp && dp.hours) ? `breakfast ${(dp.hours.breakfast || []).join('–')}h, lunch ${(dp.hours.lunch || []).join('–')}h, dinner ${(dp.hours.dinner || []).join('–')}h` : '';
  const catTimes = (dp && dp.cats) ? Object.entries(dp.cats).filter(([, v]) => v && v !== 'all').map(([c, v]) => `${c} (${v} only)`).join('; ') : '';
  const dpLine = dp ? `\nTime-based menu — sections served only at set times: ${catTimes || 'none'}. Daypart hours: ${hrs}. Right now it is ${dp.now || 'between service times'}.` : '';
  const specialLine = ctx.special ? `\nToday's special (mention it when it fits): ${ctx.special}` : '';
  const menuLink = ctx.menuUrl ? `\nFull visual menu (photos, both languages, prices): ${ctx.menuUrl} — share this link whenever the guest asks to see the menu, wants pictures, or asks for "the list".` : '';
  const orderLine = ctx.orderUrl ? `\nPickup ordering is ON. Order & pay link: ${ctx.orderUrl} — when the guest wants to order for pickup / takeaway / to-go, share this link so they can build their order.` : '';
  const voiceLine = ctx.brandVoice ? `\n\nBrand voice — write EVERY reply in this voice and personality: ${String(ctx.brandVoice).slice(0, 500)}` : '';
  const houseLine = ctx.instructions ? `\n\nHouse instructions from the owner (these take priority — follow them exactly, but never invent menu items, prices or facts that are not listed above):\n${String(ctx.instructions).slice(0, 1800)}` : '';
  const orderMode = !!ctx.orderMode;
  const orderHint = orderMode ? `\n\nORDER MODE: You are taking a pickup order. Help the guest pick items from the menu above. When they ask to add item(s), reply warmly and set "order" to the items to ADD this turn — an array of {"name":"<exact menu item name>","qty":<integer>}. Only include items that appear in the menu; never invent. Do NOT repeat items already added in earlier turns. When they seem done, invite them to tap "Review & checkout". Never take payment or ask for card details — checkout handles that.` : '';
  const bt = ctx.bizType || 'restaurant';
  const isShop = bt === 'shop';
  const isServices = bt === 'services';
  const isGeneral = !isShop && !isServices && bt !== 'restaurant' && bt !== 'cafe';
  const hasMenu = !isServices && !isGeneral;
  const menuNoun = isShop ? 'catalog' : 'menu';
  const bookNoun = isServices ? 'appointment' : 'table';
  const venueNoun = isShop ? 'shop' : (isServices || isGeneral) ? 'business' : 'restaurant';
  const roleNoun = isShop ? 'shop assistant' : isGeneral ? 'assistant' : 'front-desk host';
  const canBook = ctx.booking !== false && !isShop && !isGeneral;
  const menuCap = hasMenu ? `answer ${menuNoun} and price questions, ` : '';
  const orderCap = ctx.orderUrl ? 'help with pickup orders, ' : '';
  const bookCap = canBook ? `and book ${isServices ? 'an appointment' : 'a table for dine-in'}. ` : '';
  const genCap = isGeneral ? "answer questions about the business, its services and hours, and take down what the visitor needs (their name and how to reach them) so the team can follow up. " : '';
  const hiCap = isGeneral
    ? "When a visitor first says hi, warmly ask how you can help and what they're looking for."
    : canBook
      ? `When a guest first says hi or seems unsure, warmly offer the options${hasMenu ? ' — see the ' + menuNoun : ''}${ctx.orderUrl ? ', order for pickup' : ''}, or book ${isServices ? 'an appointment' : 'a table'} — and share the matching link.`
      : `When a guest first says hi, warmly ask how you can help${hasMenu ? ' and offer to show the ' + menuNoun : ''}${ctx.orderUrl ? ' or help them order for pickup' : ''}.`;
  const capabilities = `give opening hours, ${genCap}${menuCap}${orderCap}${bookCap}${hiCap}`.replace(/\s+/g, ' ').trim();
  const bookRules = canBook
    ? `- To book you need: date, time (inside opening hours, not on a closed day, not in the past), ${isServices ? 'number of people' : 'party size'}, and the guest's name. Phone is optional. Always ask once, warmly, whether it is a special occasion — it is optional, so do not insist if they would rather skip. Ask only for what's missing, one at a time. Confirm details back before booking; only once date, time, ${isServices ? 'people' : 'party size'} AND name are known and the guest agrees, return the booking object.`
    : isGeneral
      ? "- This is not a bookable venue. Never ask for reservation details and never return a booking object. Instead, when the visitor has a request, take their name and a contact (phone or email) so the team can follow up, and reassure them someone will be in touch."
      : `- This ${venueNoun} does NOT take ${bookNoun} bookings. Never ask for booking details and never return a booking object. If a guest wants ${isShop ? 'to reserve or buy something' : 'a ' + bookNoun}, warmly say the team will help or ask them to call${hasMenu ? ', and offer the ' + menuNoun + ' instead' : ''}.`;
  const capLine = canBook ? ((ctx.capacity ? `- Each time slot holds up to ${ctx.capacity} ${isServices ? 'people' : 'guests'} in total; never confirm a time that would exceed this.` : '') + (Array.isArray(ctx.fullSlots) && ctx.fullSlots.length ? ` These upcoming times are FULLY BOOKED — never offer them; if the guest asks for one, say it is full and suggest the nearest open time: ${ctx.fullSlots.join('; ')}.` : '') + (ctx.requireApproval ? ` IMPORTANT: this ${venueNoun} approves bookings manually. When the guest agrees, still return the booking object, but in your reply do NOT say it is confirmed — say you have requested it and the team will confirm shortly.` : '')) : '';
  const sys = `You are the friendly ${roleNoun} for ${ctx.name || ('the ' + venueNoun)}, a ${venueNoun} in Bahrain. Reply in the SAME language the guest uses — English or natural Gulf (Khaleeji) Arabic. Be warm and concise (1-3 short sentences).
You can: ${capabilities}
Opening hours: ${ctx.open || '12:00'}–${ctx.close || '22:00'}. Closed on: ${closed}. Slot length: ${ctx.slotMinutes || 30} minutes. Today is ${ctx.today || ''}.
${hasMenu ? `${isShop ? 'Catalog' : 'Menu'} (prices in ${ctx.currency || 'BHD'}; brackets show dietary tags):
${menuLines || '(no items listed yet — politely offer to have the team confirm specifics)'}` : 'This business has no food menu — do not discuss dishes, menu items, or dietary tags.'}${specialLine}${dpLine}${menuLink}${orderLine}${voiceLine}${houseLine}${orderHint}

Rules:
- Never invent menu items, prices, or facts not listed above. If you don't know, say you'll have the team follow up.
- Dietary questions: use the bracketed tags to answer "what's vegan / vegetarian / halal / gluten-free / dairy-free / spicy?" — list only items that carry that exact tag, and warn if nothing matches.
- Time-based menu: if a section is served only at certain times, and the guest asks for it outside those hours, tell them warmly when it's available (e.g. "Breakfast is served 7–11am").
- Intent routing: "pickup / takeaway / to-go / order to collect" → share the pickup order link (if provided). "dine in / table / reservation / book" → do the booking flow. "menu / the list / photos / what do you have" → share the menu link.
${bookRules}
${capLine}

- If the guest asks to CANCEL their reservation, confirm which booking with them first; only once they clearly confirm, set "cancel" to true (and write a warm confirmation in "reply").
- If the guest asks to RESCHEDULE, move, or change the time of their reservation, gather the NEW date and time (and the new party size if it changed), confirm the new details back, and only once they agree set "reschedule" to the new details. Do not also return a "booking" object when rescheduling.

Return ONLY a JSON object, no markdown:
{ "reply": "your message to the guest", "booking": null, "cancel": false, "reschedule": null, "order": null }
When (and only when) all booking details are gathered and confirmed, set "booking" to:
{ "date": "YYYY-MM-DD", "time": "HH:MM", "party": <integer>, "name": "guest name", "phone": "", "occasion": "" }
When (and only when) the guest confirms a reschedule, set "reschedule" to the new details:
{ "date": "YYYY-MM-DD", "time": "HH:MM", "party": <integer> }`;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5', max_tokens: 600, system: [{ type: 'text', text: sys, cache_control: { type: 'ephemeral' } }],
        messages: convo.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 900) })),
      }),
    });
    if (!r.ok) { const e = await r.text(); return { error: true, details: e }; }
    const d = await r.json();
    const text = ((d.content && d.content[0] && d.content[0].text) || '').trim();
    const jm = text.match(/\{[\s\S]*\}/);
    if (!jm) return { reply: text || '…', booking: null };
    let parsed; try { parsed = JSON.parse(jm[0]); } catch (e) { return { reply: text, booking: null }; }
    return { reply: parsed.reply || '', booking: canBook ? (parsed.booking || null) : null, cancel: !!parsed.cancel, reschedule: canBook ? (parsed.reschedule || null) : null, order: orderMode ? (Array.isArray(parsed.order) ? parsed.order : null) : null };
  } catch (e) { return { error: true, details: e.message }; }
}

// ── WhatsApp Cloud API helpers ──
const WA_SUPA = process.env.SUPABASE_URL || 'https://gtjmpmhsiyqwhykunosc.supabase.co';
const WA_SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
function waSb(path, opts = {}) {
  return fetch(`${WA_SUPA}/rest/v1/${path}`, { ...opts, headers: { apikey: WA_SB_KEY, Authorization: `Bearer ${WA_SB_KEY}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });
}
// Meter one concierge reply against a client's monthly allowance (fire-and-forget).
function bumpConcierge(clientId) { if (!clientId) return; const ym = new Date().toISOString().slice(0, 7); try { waSb('rpc/bump_concierge', { method: 'POST', body: JSON.stringify({ p_client: clientId, p_ym: ym }) }); } catch (e) {} }
function waActiveDaypart(hours) {
  const h = new Date().getHours();
  const H = { breakfast: [7, 11], brunch: [11, 15], lunch: [12, 16], dinner: [16, 23], ...(hours || {}) };
  for (const k of ['breakfast', 'brunch', 'lunch', 'dinner']) { const r = H[k]; if (Array.isArray(r) && r.length === 2 && h >= r[0] && h < r[1]) return k; }
  return null;
}
async function waBuildContext(clientId) {
  const ctx = { name: 'the restaurant', currency: 'BHD', menu: [], open: '12:00', close: '22:00', closedDays: [], slotMinutes: 30, special: null, dayparts: null };
  const now = new Date(); ctx.today = now.toISOString().slice(0, 10) + ' (' + now.toLocaleDateString('en', { weekday: 'long' }) + ')';
  try { const r = await waSb(`clients?id=eq.${clientId}&select=name,business_type&limit=1`); const c = await r.json(); if (c && c[0]) { if (c[0].name) ctx.name = c[0].name; if (c[0].business_type) ctx.bizType = c[0].business_type; } } catch (e) {}
  try {
    const r = await waSb(`menus?client_id=eq.${clientId}&select=*&limit=1`);
    const mj = await r.json();
    const m = Array.isArray(mj) ? mj[0] : null;
    if (m) {
      ctx.currency = m.currency || ctx.currency;
      ctx.menuUrl = (m.external_menu_url && m.external_menu_url.trim()) || (m.slug ? `https://www.tawaslo.com/menu/${m.slug}` : null);
      ctx.orderUrl = (m.pickup_enabled && m.slug) ? `https://www.tawaslo.com/order/${m.slug}` : null;
      ctx.booking = m.booking_enabled !== false;
      ctx.special = (m.special_on && m.special) ? m.special : null;
      ctx.dayparts = { hours: m.daypart_hours || {}, cats: m.cat_dayparts || {}, now: waActiveDaypart(m.daypart_hours) };
      const ri = await waSb(`menu_items?menu_id=eq.${m.id}&select=*&limit=120`);
      const ij = await ri.json();
      const items = Array.isArray(ij) ? ij : [];
      ctx.menu = items.filter(x => !x.hidden).map(x => ({ category: x.category, name_en: x.name_en, name_ar: x.name_ar, description: x.description || null, available: x.available, tags: Array.isArray(x.tags) ? x.tags : [], variants: (m.hide_prices || x.show_price === false) ? [] : (Array.isArray(x.variants) ? x.variants : []), addons: (m.hide_prices || x.show_price === false) ? [] : (Array.isArray(x.addons) ? x.addons : []), price: (m.hide_prices || x.show_price === false) ? null : x.price }));
    }
  } catch (e) {}
  try { const r = await waSb(`booking_settings?client_id=eq.${clientId}&select=*&limit=1`); const sj = await r.json(); const s = Array.isArray(sj) ? sj[0] : null; if (s) { const h = s.hours || {}; if (h.open) ctx.open = h.open; if (h.close) ctx.close = h.close; if (Array.isArray(h.closed_days)) ctx.closedDays = h.closed_days; if (s.slot_minutes) ctx.slotMinutes = s.slot_minutes; if (s.capacity) ctx.capacity = s.capacity; ctx.requireApproval = !!h.require_approval; if (h.concierge_brief) ctx.instructions = h.concierge_brief; if (h.concierge_greeting) ctx.greeting = h.concierge_greeting; if (h.concierge_voice) ctx.brandVoice = h.concierge_voice; } } catch (e) {}
  try {
    if (ctx.capacity) {
      const nowIso = new Date().toISOString();
      const horizon = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
      const r = await waSb(`bookings?client_id=eq.${clientId}&status=in.(confirmed,pending,seated)&starts_at=gte.${nowIso}&starts_at=lt.${horizon}&select=starts_at,party_size`);
      const rows = await r.json();
      const bySlot = {};
      (Array.isArray(rows) ? rows : []).forEach(x => { const k = x.starts_at; bySlot[k] = (bySlot[k] || 0) + (Number(x.party_size) || 0); });
      ctx.fullSlots = Object.keys(bySlot).filter(k => bySlot[k] >= ctx.capacity).map(k => { const d = new Date(k); return d.toLocaleString('en', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); }).slice(0, 20);
    }
  } catch (e) {}
  return ctx;
}
async function waSend(phoneId, token, to, bodyText) {
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { body: String(bodyText || '').slice(0, 3500) } }),
    });
    if (!r.ok) { console.error('WhatsApp send failed (' + r.status + ')'); }
  } catch (e) { /* network error — skip */ }
}
async function handleWhatsApp(body) {
  const token = process.env.WHATSAPP_TOKEN || process.env.WA_TOKEN;
  const clientId = process.env.WHATSAPP_DEFAULT_CLIENT_ID;
  for (const en of (body.entry || [])) {
    for (const ch of (en.changes || [])) {
      const val = ch.value || {};
      const phoneId = val.metadata && val.metadata.phone_number_id;
      for (const m of (val.messages || [])) {
        if (m.type !== 'text' || !m.text || !phoneId || !token || !clientId) continue;
        const from = m.from; const text = m.text.body || '';
        try { await waSb('wa_messages', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify({ wa_message_id: m.id, direction: 'in', from_number: from, body: text, msg_type: m.type, received_at: new Date(Number(m.timestamp || (Date.now() / 1000)) * 1000).toISOString() }) }); } catch (e) {}
        let thread = [];
        try { const r = await waSb(`wa_threads?client_id=eq.${clientId}&wa_from=eq.${encodeURIComponent(from)}&select=messages&limit=1`); const t = (await r.json())[0]; if (t && Array.isArray(t.messages)) thread = t.messages; } catch (e) {}
        thread.push({ role: 'user', content: text }); thread = thread.slice(-12);
        const ctx = await waBuildContext(clientId);
        const out = await conciergeReply(ctx, thread);
        const reply = (out && out.reply) || "Sorry, I didn't catch that — could you rephrase?";
        thread.push({ role: 'assistant', content: reply }); thread = thread.slice(-12);
        try { await waSb(`wa_threads?on_conflict=client_id,wa_from`, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ client_id: clientId, wa_from: from, messages: thread, updated_at: new Date().toISOString() }) }); } catch (e) {}
        await waSend(phoneId, token, from, reply);
        try { await waSb('wa_messages', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ direction: 'out', from_number: from, body: reply, msg_type: 'text', received_at: new Date().toISOString() }) }); } catch (e) {}
        bumpConcierge(clientId);
        if (out && out.cancel) {
          try {
            const nowIso = new Date().toISOString();
            const r = await waSb(`bookings?client_id=eq.${clientId}&status=eq.confirmed&starts_at=gte.${nowIso}&order=starts_at.asc&select=id,customer_phone,starts_at`);
            const bks = await r.json();
            const fd = String(from).replace(/[^\d]/g, '');
            const match = (Array.isArray(bks) ? bks : []).find(x => { const cp = String(x.customer_phone || '').replace(/[^\d]/g, ''); return cp && fd && (cp.slice(-8) === fd.slice(-8)); });
            if (match) await waSb(`bookings?id=eq.${match.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'cancelled' }) });
          } catch (e) {}
        }
        const rs = out && out.reschedule;
        if (rs && rs.date && rs.time) {
          try {
            const tt2 = String(rs.time).length === 5 ? rs.time : ('0' + rs.time);
            const sd2 = new Date(rs.date + 'T' + tt2 + ':00');
            if (!isNaN(sd2.getTime())) {
              const nowIso2 = new Date().toISOString();
              const rr = await waSb(`bookings?client_id=eq.${clientId}&status=eq.confirmed&starts_at=gte.${nowIso2}&order=starts_at.asc&select=id,customer_phone,party_size`);
              const bks2 = await rr.json();
              const fd2 = String(from).replace(/[^\d]/g, '');
              const match2 = (Array.isArray(bks2) ? bks2 : []).find(x => { const cp = String(x.customer_phone || '').replace(/[^\d]/g, ''); return cp && fd2 && (cp.slice(-8) === fd2.slice(-8)); });
              if (match2) {
                const party2 = rs.party ? (Number(rs.party) || match2.party_size) : (match2.party_size || 2);
                let full2 = false;
                try {
                  const cap2 = Number(ctx.capacity) || 0;
                  if (cap2 > 0) {
                    const slotMs2 = (Number(ctx.slotMinutes) || 30) * 60000;
                    const q0 = sd2.toISOString(); const q1 = new Date(sd2.getTime() + slotMs2).toISOString();
                    const rc2 = await waSb(`bookings?client_id=eq.${clientId}&status=in.(confirmed,pending,seated)&starts_at=gte.${q0}&starts_at=lt.${q1}&id=neq.${match2.id}&select=party_size`);
                    const rw2 = await rc2.json();
                    const bk2 = (Array.isArray(rw2) ? rw2 : []).reduce((a, x) => a + (Number(x.party_size) || 0), 0);
                    if (bk2 + party2 > cap2) full2 = true;
                  }
                } catch (e) {}
                if (full2) {
                  await waSend(phoneId, token, from, `Sorry — ${sd2.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })} is fully booked. Want me to check another time?`);
                } else {
                  const patch2 = { starts_at: sd2.toISOString() };
                  if (rs.party) patch2.party_size = party2;
                  await waSb(`bookings?id=eq.${match2.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(patch2) });
                  await waSend(phoneId, token, from, `Updated ✓ ${sd2.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })} at ${sd2.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}. See you then!`);
                }
              }
            }
          } catch (e) {}
        }
        const b = out && out.booking;
        if (b && b.date && b.time && b.name) {
          const tt = String(b.time).length === 5 ? b.time : ('0' + b.time);
          const sd = new Date(b.date + 'T' + tt + ':00');
          if (!isNaN(sd.getTime())) {
            const party = Number(b.party) || 2;
            let full = false;
            try {
              const cap = Number(ctx.capacity) || 0;
              if (cap > 0) {
                const slotMs = (Number(ctx.slotMinutes) || 30) * 60000;
                const s0 = sd.toISOString(); const s1 = new Date(sd.getTime() + slotMs).toISOString();
                const rc = await waSb(`bookings?client_id=eq.${clientId}&status=in.(confirmed,pending,seated)&starts_at=gte.${s0}&starts_at=lt.${s1}&select=party_size`);
                const rows = await rc.json();
                const booked = (Array.isArray(rows) ? rows : []).reduce((a, x) => a + (Number(x.party_size) || 0), 0);
                if (booked + party > cap) full = true;
              }
            } catch (e) {}
            if (full) {
              await waSend(phoneId, token, from, `Sorry — ${sd.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })} is fully booked. Could you try another time? Reply with one and I will check.`);
            } else {
              const st = ctx.requireApproval ? 'pending' : 'confirmed';
              try { await waSb(`bookings`, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ client_id: clientId, customer_name: b.name, customer_phone: b.phone || from, party_size: party, starts_at: sd.toISOString(), source: 'whatsapp', status: st, note: b.occasion || null }) }); } catch (e) {}
              const whenStr = `${sd.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })} at ${sd.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}`;
              await waSend(phoneId, token, from, ctx.requireApproval ? `Got it — I have requested your table for ${party} on ${whenStr}. The team will confirm shortly! ⏳` : `Booked ✓ ${whenStr} for ${party}. See you then!`);
            }
          }
        }
      }
    }
  }
}
