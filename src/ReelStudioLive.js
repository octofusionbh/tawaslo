import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import ReelStudioExperience from './ReelStudioExperience';

// The storyboard's destinations are the endpoint's platforms under different ids.
const API_PLATFORM = { ig:'instagram', tt:'tiktok', yt:'youtube' };
const sceneId = () => `scene-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
const clamp = (value, max) => String(value == null ? '' : value).slice(0, max);

const stampSeconds = stamp => { const parts = String(stamp).split(':'); return parts.length === 2 ? Number(parts[0]) * 60 + Number(parts[1]) : Number(parts[0]); };
// "0:00-0:03", "0-3s" and "3s" are all shapes this endpoint has returned.
const sceneSeconds = time => {
  const found = typeof time === 'string' ? time.match(/\d+(?::\d{2})?(?:\.\d+)?/g) : null;
  if (!found || !found.length) return 0;
  const value = found.length >= 2 ? stampSeconds(found[1]) - stampSeconds(found[0]) : stampSeconds(found[0]);
  return Number.isFinite(value) ? Math.round(value) : 0;
};

const localVoice = clientId => { try { const raw = window.localStorage.getItem('tw_voice_' + (clientId || 'x')); return raw ? JSON.parse(raw) : null; } catch (_) { return null; } };

export default function ReelStudioLive({ client=null, dark=false, setDark=()=>{}, mobileWeb=false, onOpenPublisher=()=>{}, aiCredits=null }) {
  const [voice, setVoice] = useState(() => client?.brand_voice || localVoice(client?.id));
  const clientId = client?.id || '';

  useEffect(() => { setVoice(client?.brand_voice || localVoice(clientId)); }, [clientId, client?.brand_voice]);
  useEffect(() => {
    if (!clientId || client?.brand_voice) return;
    let cancelled = false;
    supabase.from('clients').select('brand_voice').eq('id', clientId).maybeSingle()
      .then(({ data }) => { if (!cancelled && data?.brand_voice) setVoice(data.brand_voice); }, () => {});
    return () => { cancelled = true; };
  }, [clientId, client?.brand_voice]);

  const generateScript = useCallback(async ({ topic, platform, language, duration, tone, dialect }) => {
    let script;
    try {
      const response = await fetch('/api/generate-caption', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ topic, platform: API_PLATFORM[platform] || platform, tone, mode:'reel', lang:language, dialect, duration, brand: client?.name || undefined, voice: voice || undefined }),
      });
      script = await response.json();
    } catch (_) { return { error:'The script could not be written. Please try again.' }; }

    const returned = Array.isArray(script?.scenes) ? script.scenes.filter(Boolean).slice(0, 12) : [];
    if (!returned.length) return { error: typeof script?.error === 'string' && script.error ? script.error : 'No script came back. Please try again.' };

    let seconds = returned.map(scene => Math.min(30, sceneSeconds(scene.time)));
    // The endpoint does not always time its scenes; an even split is stated plainly rather than passed off as its answer.
    const untimed = seconds.some(value => value < 1);
    if (untimed) {
      const target = Number(String(duration).replace(/\D/g, '')) || 30;
      const even = Math.max(1, Math.min(30, Math.round(target / returned.length)));
      seconds = returned.map(() => even);
    }

    const scenes = returned.map((scene, index) => ({
      id: `${sceneId()}-${index}`,
      name: `Scene ${index + 1}`,
      seconds: seconds[index],
      shot: clamp(scene.shot, 1000),
      onscreen: clamp(scene.onscreen, 140),
      voiceover: clamp(scene.voiceover, 1000),
      art: 'sea',
    }));
    // The redesign has no hook field; keep the written hook where it is meant to be read.
    if (script.hook && !scenes[0].onscreen) scenes[0].onscreen = clamp(script.hook, 140);

    const hashtags = Array.isArray(script.hashtags) ? script.hashtags.filter(tag => typeof tag === 'string' && tag.trim()) : [];
    return {
      title: clamp(script.title, 90) || undefined,
      caption: clamp([clamp(script.caption, 4000), hashtags.join(' ')].filter(Boolean).join('\n\n'), 5000) || undefined,
      audio: clamp(script.audio, 1000) || undefined,
      scenes,
      notice: untimed
        ? 'Script written. No scene timings came back, so your target length was split evenly — set each scene’s length yourself.'
        : 'Script written. Review each scene and adjust the timings.',
    };
  }, [client?.name, voice]);

  return <ReelStudioExperience
    dark={dark}
    setDark={setDark}
    mobileWeb={mobileWeb}
    onOpenPublisher={onOpenPublisher}
    onGenerateScript={generateScript}
    liveCredits={aiCredits}
    clientName={client?.name || ''}
  />;
}
