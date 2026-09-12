import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { shrinkImageBlob, extensionForBlob } from './imageShrink';
import AIStudioExperience from './AIStudioExperience';
import { canPublishOnWeb } from './workspaceResponsive';

// The brief's tone chips are labels; the endpoint wants a phrase, so each maps to one.
const TONE_PROMPT = { Warm:'warm and welcoming', Direct:'direct and clear', 'Story-led':'story-led and narrative' };
// The image endpoint accepts these three canvases only; the studio's ratio picks the closest one.
const apiImageSize = canvas => {
  if (!canvas || !(canvas.width > 0) || !(canvas.height > 0)) return '1024x1024';
  const ratio = canvas.width / canvas.height;
  return ratio <= 0.8 ? '1024x1536' : ratio >= 1.25 ? '1536x1024' : '1024x1024';
};

const post = async body => {
  try {
    const response = await fetch('/api/generate-caption', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body) });
    return await response.json();
  } catch (_) { return { error:true }; }
};
const messageOf = (reply, fallback) => (typeof reply?.error === 'string' && reply.error ? reply.error : fallback);

// Report the size the model actually returned rather than the size that was asked for.
const measure = url => new Promise(resolve => {
  const picture = new window.Image();
  picture.onload = () => resolve({ url, width: picture.naturalWidth, height: picture.naturalHeight });
  picture.onerror = () => resolve({ url, width:0, height:0 });
  picture.src = url;
});

const readSourceAsDataUrl = async source => {
  const blob = await (await fetch(source.url)).blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('unreadable'));
    reader.readAsDataURL(blob);
  });
};

const localVoice = clientId => { try { const raw = window.localStorage.getItem('tw_voice_' + (clientId || 'x')); return raw ? JSON.parse(raw) : null; } catch (_) { return null; } };

export default function AIStudioLive({ client=null, dark=false, setDark=()=>{}, mobileWeb=false, onOpenPublisher=()=>{}, onBuyAiCredits=()=>{}, aiCredits=null, onCreditUsed=null, initialTool='captions', initialSavedId='', onInitialSavedOpened=()=>{} }) {
  const [voice, setVoice] = useState(() => client?.brand_voice || localVoice(client?.id));
  const [liveError, setLiveError] = useState('');
  const clientId = client?.id || '';

  useEffect(() => { setVoice(client?.brand_voice || localVoice(clientId)); }, [clientId, client?.brand_voice]);
  useEffect(() => {
    if (!clientId || client?.brand_voice) return;
    let cancelled = false;
    supabase.from('clients').select('brand_voice').eq('id', clientId).maybeSingle()
      .then(({ data }) => { if (!cancelled && data?.brand_voice) setVoice(data.brand_voice); }, () => {});
    return () => { cancelled = true; };
  }, [clientId, client?.brand_voice]);

  const generate = useCallback(async ({ tool, fields, source, canvas }) => {
    const brand = client?.name || undefined;
    const shared = { topic: fields.topic, platform: fields.platform, tone: TONE_PROMPT[fields.tone] || fields.tone, brand };

    if (tool === 'captions') {
      const body = { ...shared, lang: fields.language, dialect: fields.dialect, voice: voice || undefined };
      const replies = await Promise.all([0,1,2].map(() => post(body)));
      const usable = replies.filter(reply => reply && !reply.error && (reply.english || reply.arabic));
      if (!usable.length) return { error: messageOf(replies.find(reply => typeof reply?.error === 'string'), 'Could not write captions. Please try again.') };
      return { captions: usable.map((reply, index) => ({ label:`Version ${index + 1}`, en: reply.english || '', ar: reply.arabic || '' })) };
    }

    if (tool === 'ideas') {
      const reply = await post({ ...shared, mode:'ideas', count:6 });
      const raw = Array.isArray(reply?.ideas) ? reply.ideas : [];
      const ideas = raw
        .map(idea => typeof idea === 'string' ? [idea, '', ''] : [String(idea?.title || idea?.idea || ''), String(idea?.format || ''), String(idea?.body || idea?.description || '')])
        .filter(idea => idea[0].trim());
      if (!ideas.length) return { error: messageOf(reply, 'Could not write post ideas. Please try again.') };
      return { ideas: ideas.slice(0, 6) };
    }

    const editing = fields.imageMode === 'edit';
    let imageBase64 = '';
    if (editing) {
      if (!source) return { error:'Choose a source image before applying an edit.' };
      try { imageBase64 = await readSourceAsDataUrl(source); }
      catch (_) { return { error:'That image could not be read. Choose it again and retry.' }; }
    }
    const size = apiImageSize(canvas);
    const reply = await post(editing
      ? { mode:'image-edit', prompt: fields.prompt, imageBase64, size, realistic:true }
      : { mode:'image', prompt: fields.prompt, size, n:2, realistic:true });
    if (reply?.error === 'image_engine_unconfigured') return { error:'The image engine is not connected. Add a Gemini API key (GEMINI_API_KEY) to turn on image generation and editing.' };
    const returned = Array.isArray(reply?.images) ? reply.images.filter(item => typeof item === 'string' && item) : [];
    if (!returned.length) return { error: messageOf(reply, editing ? 'Could not edit that image. Please try again.' : 'Could not generate an image. Please try again.') };
    return { images: await Promise.all(returned.slice(0, 2).map(measure)) };
  }, [client?.name, voice]);

  const handleGenerate = useCallback(async request => {
    setLiveError('');
    const response = await generate(request);
    // The wallet is only charged once the endpoint actually returned something.
    if (response && !response.error) onCreditUsed?.();
    return response;
  }, [generate, onCreditUsed]);

  const useImage = useCallback(async dataUrl => {
    if (!canPublishOnWeb()) return;
    setLiveError('');
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      const owner = user?.id || 'anon';
      const parts = /^data:(image\/[a-z+]+);base64,(.*)$/i.exec(dataUrl);
      const type = parts?.[1] || 'image/png';
      const base64 = parts?.[2] || dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
      // The model hands back a full-resolution PNG, which costs about 4 MB a
      // time. Re-encode to a 1920px JPEG before it ever reaches storage.
      const raw = new Blob([bytes], { type });
      const blob = await shrinkImageBlob(raw, { max: 1920, quality: 0.85 });
      const path = `${owner}/ai/${Date.now()}.${extensionForBlob(blob, type === 'image/jpeg' ? 'jpg' : 'png')}`;
      const { error } = await supabase.storage.from('media').upload(path, blob, { contentType: blob.type || type, upsert:true });
      if (error) throw error;
      const { data:url } = supabase.storage.from('media').getPublicUrl(path);
      try { window.sessionStorage.setItem('tw_studio_media', url.publicUrl); } catch (_) { /* handoff is best effort */ }
      onOpenPublisher();
    } catch (_) { setLiveError('That image could not be added to Publisher. Download it and add it there instead.'); }
  }, [onOpenPublisher]);

  const downloadImage = useCallback(dataUrl => {
    try {
      const link = document.createElement('a');
      link.href = dataUrl; link.download = 'tawaslo-image.png';
      document.body.appendChild(link); link.click(); link.remove();
    } catch (_) { setLiveError('That image could not be downloaded.'); }
  }, []);

  return <AIStudioExperience
    dark={dark}
    setDark={setDark}
    mobileWeb={mobileWeb}
    onOpenPublisher={onOpenPublisher}
    onBuyAiCredits={onBuyAiCredits}
    initialTool={initialTool}
    initialSavedId={initialSavedId}
    onInitialSavedOpened={onInitialSavedOpened}
    onGenerate={handleGenerate}
    liveCredits={aiCredits}
    liveError={liveError}
    clientName={client?.name || ''}
    onUseImage={useImage}
    onDownloadImage={downloadImage}
  />;
}
