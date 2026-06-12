export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, platform, tone, lang, audience, details, brand, mode, count, imageUrl } = req.body;

  const platformNames = {
    ig: 'Instagram', fb: 'Facebook', tw: 'Twitter/X',
    li: 'LinkedIn', tt: 'TikTok', yt: 'YouTube',
  };

  const platformName = platform ? platformNames[platform] || platform : 'social media';
  const toneText = tone || 'engaging and professional';
  const language = (lang || 'both').toLowerCase(); // 'en' | 'ar' | 'both'
  const theMode = (mode || 'caption').toLowerCase(); // 'caption' | 'ideas' | 'hashtags' | 'vision' | 'alt'

  // Vision modes need an image; everything else needs a topic.
  if ((theMode === 'vision' || theMode === 'alt')) {
    if (!imageUrl) return res.status(400).json({ error: 'An image is required.' });
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
  } else {
    const shape = language === 'en'
      ? '{\n  "english": "the English caption with relevant emojis and hashtags",\n  "arabic": ""\n}'
      : language === 'ar'
      ? '{\n  "english": "",\n  "arabic": "النص العربي مع إيموجي وهاشتاق مناسب"\n}'
      : '{\n  "english": "the English caption with relevant emojis and hashtags",\n  "arabic": "النص العربي مع إيموجي وهاشتاق مناسب"\n}';

    const langInstruction = language === 'en'
      ? 'Generate the caption in English only. Leave "arabic" as an empty string.'
      : language === 'ar'
      ? 'Generate the caption in Arabic only. Leave "english" as an empty string.'
      : 'Generate captions in BOTH English and Arabic.';

    messageContent = `You are a social media copywriter working with brands worldwide. ${langInstruction}

Topic/Product: ${topic}
Platform: ${platformName}
Tone: ${toneText}
${extras}

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
      if (theMode === 'hashtags') return res.status(200).json({ hashtags: [] });
      return res.status(200).json({ english: text, arabic: '' });
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate caption', details: err.message });
  }
}
