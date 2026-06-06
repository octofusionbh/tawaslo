export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, platform, tone, lang, audience, details, brand } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const platformNames = {
    ig: 'Instagram', fb: 'Facebook', tw: 'Twitter/X',
    li: 'LinkedIn', tt: 'TikTok', yt: 'YouTube',
  };

  const platformName = platform ? platformNames[platform] || platform : 'social media';
  const toneText = tone || 'engaging and professional';
  const language = (lang || 'both').toLowerCase(); // 'en' | 'ar' | 'both'

  const extras = [
    brand ? `Brand: ${brand}` : '',
    audience ? `Target audience: ${audience}` : '',
    details ? `Key points / call-to-action: ${details}` : '',
  ].filter(Boolean).join('\n');

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

  const prompt = `You are a social media copywriter for GCC/MENA brands. ${langInstruction}

Topic/Product: ${topic}
Platform: ${platformName}
Tone: ${toneText}
${extras}

Return ONLY a JSON object in this exact format (no markdown, no extra text):
${shape}`;

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
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Anthropic API error', details: err });
    }

    const data = await response.json();
    const text = data.content[0].text.trim();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(200).json({ english: text, arabic: '' });
    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate caption', details: err.message });
  }
}
