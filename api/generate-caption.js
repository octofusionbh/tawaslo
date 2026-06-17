export default async function handler(req, res) {
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
