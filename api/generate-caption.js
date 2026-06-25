export default async function handler(req, res) {
  // WhatsApp Cloud API webhook live (deploy marker v1).
  // ── WhatsApp Cloud API webhook (folded in here to stay under Vercel's function cap) ──
  if (req.method === 'GET' && req.query && req.query['hub.mode']) {
    const vt = process.env.WHATSAPP_VERIFY_TOKEN || 'tawaslo_wa_verify';
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
    const prompt = `${promptIn}\n\nProduce the image with a ${aspectRatio} aspect ratio.`;
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
    return res.status(200).json({ reply: out.reply, booking: out.booking });
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
    messageContent = `You are a social media expert working with brands worldwide. Generate a pack of around 20 highly relevant ${platformName} hashtags for the topic below. Mix broad and niche tags.

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

Write a complete, production-ready short-video script. Open with a scroll-stopping hook in the first 2 seconds. Break the video into ${dur === '15s' ? '3-4' : dur === '60s' ? '6-8' : '4-6'} scenes; for each scene give the timecode, the shot/visual direction, the on-screen text, and the voiceover/spoken line. Keep it punchy and native to the platform. Then give a caption with emojis, 8-12 relevant hashtags, a clear CTA, and a trending-style audio/music suggestion.

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
  const sys = `You are the friendly front-desk host for ${ctx.name || 'the restaurant'}, a venue in Bahrain. Reply in the SAME language the guest uses — English or natural Gulf (Khaleeji) Arabic. Be warm and concise (1-3 short sentences).
You can: answer menu and price questions, give opening hours, and book a table.
Opening hours: ${ctx.open || '12:00'}–${ctx.close || '22:00'}. Closed on: ${closed}. Slot length: ${ctx.slotMinutes || 30} minutes. Today is ${ctx.today || ''}.
Menu (prices in ${ctx.currency || 'BHD'}; brackets show dietary tags):
${menuLines || '(no menu provided — politely offer to have the team confirm specifics)'}${specialLine}${dpLine}

Rules:
- Never invent menu items, prices, or facts not listed above. If you don't know, say you'll have the team follow up.
- Dietary questions: use the bracketed tags to answer "what's vegan / vegetarian / halal / gluten-free / dairy-free / spicy?" — list only items that carry that exact tag, and warn if nothing matches.
- Time-based menu: if a section is served only at certain times, and the guest asks for it outside those hours, tell them warmly when it's available (e.g. "Breakfast is served 7–11am").
- To book you need: date, time (inside opening hours, not on a closed day, not in the past), party size, and the guest's name. Phone and occasion are optional. Ask only for what's missing, one item at a time.
- Confirm the details back to the guest before booking. Only once date, time, party size AND name are known and the guest agrees, return the booking object.

Return ONLY a JSON object, no markdown:
{ "reply": "your message to the guest", "booking": null }
When (and only when) all required details are gathered and confirmed, set "booking" to:
{ "date": "YYYY-MM-DD", "time": "HH:MM", "party": <integer>, "name": "guest name", "phone": "", "occasion": "" }`;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5', max_tokens: 600, system: sys,
        messages: convo.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 900) })),
      }),
    });
    if (!r.ok) { const e = await r.text(); return { error: true, details: e }; }
    const d = await r.json();
    const text = ((d.content && d.content[0] && d.content[0].text) || '').trim();
    const jm = text.match(/\{[\s\S]*\}/);
    if (!jm) return { reply: text || '…', booking: null };
    let parsed; try { parsed = JSON.parse(jm[0]); } catch (e) { return { reply: text, booking: null }; }
    return { reply: parsed.reply || '', booking: parsed.booking || null };
  } catch (e) { return { error: true, details: e.message }; }
}

// ── WhatsApp Cloud API helpers ──
const WA_SUPA = process.env.SUPABASE_URL || 'https://gtjmpmhsiyqwhykunosc.supabase.co';
const WA_SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
function waSb(path, opts = {}) {
  return fetch(`${WA_SUPA}/rest/v1/${path}`, { ...opts, headers: { apikey: WA_SB_KEY, Authorization: `Bearer ${WA_SB_KEY}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });
}
function waActiveDaypart(hours) {
  const h = new Date().getHours();
  const H = { breakfast: [7, 11], brunch: [11, 15], lunch: [12, 16], dinner: [16, 23], ...(hours || {}) };
  for (const k of ['breakfast', 'brunch', 'lunch', 'dinner']) { const r = H[k]; if (Array.isArray(r) && r.length === 2 && h >= r[0] && h < r[1]) return k; }
  return null;
}
async function waBuildContext(clientId) {
  const ctx = { name: 'the restaurant', currency: 'BHD', menu: [], open: '12:00', close: '22:00', closedDays: [], slotMinutes: 30, special: null, dayparts: null };
  const now = new Date(); ctx.today = now.toISOString().slice(0, 10) + ' (' + now.toLocaleDateString('en', { weekday: 'long' }) + ')';
  try { const r = await waSb(`clients?id=eq.${clientId}&select=name&limit=1`); const c = await r.json(); if (c && c[0] && c[0].name) ctx.name = c[0].name; } catch (e) {}
  try {
    const r = await waSb(`menus?client_id=eq.${clientId}&select=id,currency,hide_prices,special,special_on,cat_dayparts,daypart_hours&limit=1`);
    const m = (await r.json())[0];
    if (m) {
      ctx.currency = m.currency || ctx.currency;
      ctx.special = (m.special_on && m.special) ? m.special : null;
      ctx.dayparts = { hours: m.daypart_hours || {}, cats: m.cat_dayparts || {}, now: waActiveDaypart(m.daypart_hours) };
      const ri = await waSb(`menu_items?menu_id=eq.${m.id}&select=category,name_en,name_ar,description,price,available,hidden,show_price,tags,variants,addons&limit=120`);
      const items = await ri.json();
      ctx.menu = (items || []).filter(x => !x.hidden).map(x => ({ category: x.category, name_en: x.name_en, name_ar: x.name_ar, description: x.description || null, available: x.available, tags: Array.isArray(x.tags) ? x.tags : [], variants: (m.hide_prices || x.show_price === false) ? [] : (Array.isArray(x.variants) ? x.variants : []), addons: (m.hide_prices || x.show_price === false) ? [] : (Array.isArray(x.addons) ? x.addons : []), price: (m.hide_prices || x.show_price === false) ? null : x.price }));
    }
  } catch (e) {}
  try { const r = await waSb(`booking_settings?client_id=eq.${clientId}&select=slot_minutes,hours&limit=1`); const s = (await r.json())[0]; if (s) { const h = s.hours || {}; if (h.open) ctx.open = h.open; if (h.close) ctx.close = h.close; if (Array.isArray(h.closed_days)) ctx.closedDays = h.closed_days; if (s.slot_minutes) ctx.slotMinutes = s.slot_minutes; } } catch (e) {}
  return ctx;
}
async function waSend(phoneId, token, to, bodyText) {
  try {
    await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { body: String(bodyText || '').slice(0, 3500) } }),
    });
  } catch (e) {}
}
async function handleWhatsApp(body) {
  const token = process.env.WHATSAPP_TOKEN;
  const clientId = process.env.WHATSAPP_DEFAULT_CLIENT_ID;
  for (const en of (body.entry || [])) {
    for (const ch of (en.changes || [])) {
      const val = ch.value || {};
      const phoneId = val.metadata && val.metadata.phone_number_id;
      for (const m of (val.messages || [])) {
        if (m.type !== 'text' || !m.text || !phoneId || !token || !clientId) continue;
        const from = m.from; const text = m.text.body || '';
        let thread = [];
        try { const r = await waSb(`wa_threads?client_id=eq.${clientId}&wa_from=eq.${encodeURIComponent(from)}&select=messages&limit=1`); const t = (await r.json())[0]; if (t && Array.isArray(t.messages)) thread = t.messages; } catch (e) {}
        thread.push({ role: 'user', content: text }); thread = thread.slice(-12);
        const ctx = await waBuildContext(clientId);
        const out = await conciergeReply(ctx, thread);
        const reply = (out && out.reply) || "Sorry, I didn't catch that — could you rephrase?";
        thread.push({ role: 'assistant', content: reply }); thread = thread.slice(-12);
        try { await waSb(`wa_threads?on_conflict=client_id,wa_from`, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ client_id: clientId, wa_from: from, messages: thread, updated_at: new Date().toISOString() }) }); } catch (e) {}
        await waSend(phoneId, token, from, reply);
        const b = out && out.booking;
        if (b && b.date && b.time && b.name) {
          const tt = String(b.time).length === 5 ? b.time : ('0' + b.time);
          const sd = new Date(b.date + 'T' + tt + ':00');
          if (!isNaN(sd.getTime())) {
            try { await waSb(`bookings`, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ client_id: clientId, customer_name: b.name, customer_phone: b.phone || from, party_size: Number(b.party) || 2, starts_at: sd.toISOString(), source: 'whatsapp', status: 'confirmed', note: b.occasion || null }) }); } catch (e) {}
            await waSend(phoneId, token, from, `Booked ✓ ${sd.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })} at ${sd.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })} for ${b.party}. See you then!`);
          }
        }
      }
    }
  }
}
