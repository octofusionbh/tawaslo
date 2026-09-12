import { useCallback, useEffect, useMemo, useState } from 'react';
import StealThisExperience from './StealThisExperience';

// The shelf is built from the same competitor shortlist Competitor Insights keeps, looked
// up one handle at a time and pooled, because /api/trends takes a single handle.
const MAX_ACCOUNTS = 5;
const API_PLATFORM = { ig: 'instagram', tt: 'tiktok' };
const listKey = client => `tw_competitor_live_${client?.id || client?.name || 'x'}`;
const ideasKey = client => `tw_competitor_live_ideas_${client?.id || client?.name || 'x'}`;
const briefKey = client => `tw_stealthis_briefs_${client?.id || client?.name || 'x'}`;

const text = value => (typeof value === 'string' ? value.trim() : '');
const num = value => (value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? null : Number(value));
// A post has a caption and nothing else to name it by, so the card heading is that
// caption cut short rather than an invented title.
const heading = value => { const line = String(value || '').replace(/\s+/g, ' ').trim(); if (!line) return 'Untitled post'; return line.length > 64 ? `${line.slice(0, 63).trimEnd()}…` : line; };

function readStore(key, guard) {
  try { const raw = window.localStorage.getItem(key); const value = raw ? JSON.parse(raw) : []; return Array.isArray(value) ? value.filter(guard) : []; } catch (_) { return []; }
}
function writeStore(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; }
}
const isAccount = item => !!item && typeof item.id === 'string' && typeof item.handle === 'string' && (item.platform === 'ig' || item.platform === 'tt');
const isIdea = item => !!item && typeof item.id === 'string' && typeof item.title === 'string';
const isBrief = item => !!item && typeof item.id === 'string' && typeof item.text === 'string';

async function lookup(entry, platform) {
  let data = null;
  try {
    const response = await fetch(`/api/trends?mode=competitor&handle=${encodeURIComponent(entry.handle)}&platform=${API_PLATFORM[platform]}`);
    data = await response.json();
  } catch (_) { return []; }
  if (!data || !data.ok || !Array.isArray(data.topPosts)) return [];
  return data.topPosts.filter(Boolean).map((post, index) => ({
    id: `${platform}:${entry.handle}:${index}`,
    accountId: entry.id,
    accountName: entry.name || entry.handle,
    handle: entry.handle,
    platform,
    title: heading(post.caption),
    caption: text(post.caption),
    likes: num(post.likes),
    comments: num(post.comments),
    eng: num(post.eng),
    thumbnail: text(post.thumbnail),
    url: text(post.url),
  }));
}

export default function StealThisLive({ client, dark = false, setDark = () => {}, mobileWeb = false, onOpenStudio = () => {}, onOpenCompetitors = () => {} }) {
  const key = listKey(client), store = ideasKey(client), briefs = briefKey(client);
  const [handles, setHandles] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [platform, setPlatform] = useState('ig');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setHandles(readStore(key, isAccount)); setIdeas(readStore(store, isIdea)); }, [key, store]);

  const shortlist = useMemo(() => handles.filter(item => item.platform === platform).slice(0, MAX_ACCOUNTS), [handles, platform]);

  useEffect(() => {
    if (!shortlist.length) { setPosts([]); setLoading(false); setError(''); return undefined; }
    let active = true;
    setLoading(true); setError('');
    Promise.all(shortlist.map(entry => lookup(entry, platform)))
      .then(results => {
        if (!active) return;
        const pooled = results.flat().sort((a, b) => (b.eng ?? b.likes ?? 0) - (a.eng ?? a.likes ?? 0));
        setPosts(pooled);
        setLoading(false);
        setError(pooled.length ? '' : 'No posts could be read for these accounts right now.');
      })
      .catch(() => { if (!active) return; setPosts([]); setLoading(false); setError('The lookup failed. Try again in a moment.'); });
    return () => { active = false; };
  }, [shortlist, platform]);

  // Saved posts share Competitor Insights' store, so a post saved on either page shows on both.
  const saveIdea = useCallback(post => {
    if (!post || !post.id) return { ok: false, error: 'This post could not be saved.' };
    if (ideas.some(item => item.id === post.id)) return { ok: true, alreadySaved: true };
    if (ideas.length >= 100) return { ok: false, error: 'You have reached 100 saved posts. Remove one before saving another.' };
    const next = [{ id: post.id, title: post.title, caption: post.caption, url: post.url, thumbnail: post.thumbnail, accountName: post.accountName, platform: post.platform, savedAt: Date.now() }, ...ideas];
    setIdeas(next);
    if (!writeStore(store, next)) return { ok: false, error: 'Not saved. Browser storage is full or unavailable.' };
    return { ok: true };
  }, [ideas, store]);

  const saveBrief = useCallback((post, value) => {
    const body = String(value || '').trim();
    if (!post || !post.id) return { ok: false, error: 'This post is unavailable. Return to Discover and choose another.' };
    if (!body || body.length > 6000) return { ok: false, error: 'Add your original direction, up to 6,000 characters, before saving.' };
    const current = readStore(briefs, isBrief);
    const existing = current.find(item => item.id === post.id);
    if (existing && existing.text === body) return { ok: true, alreadySaved: true };
    const next = [{ id: post.id, title: post.title, text: body, savedAt: Date.now() }, ...current.filter(item => item.id !== post.id)].slice(0, 100);
    if (!writeStore(briefs, next)) return { ok: false, error: 'Not saved. Browser storage is full or unavailable.' };
    // AI Studio and the publisher pick work up through these session keys; the brief is the
    // client's own words, never the competitor's caption.
    try {
      window.sessionStorage.setItem('tw_studio_caption', body);
      window.sessionStorage.setItem('tw_studio_aitopic', body.slice(0, 500));
      window.sessionStorage.setItem('tw_studio_imgprompt', `On-brand social media photo, no text overlay: ${body.slice(0, 200)}`);
    } catch (_) { /* the brief is saved either way */ }
    return { ok: true };
  }, [briefs]);

  return <StealThisExperience
    dark={dark}
    setDark={setDark}
    onOpenStudio={onOpenStudio}
    onOpenCompetitors={onOpenCompetitors}
    livePosts={posts}
    liveSaved={ideas}
    liveError={error}
    liveLoading={loading}
    clientName={client?.name || ''}
    onSaveIdea={saveIdea}
    onSaveBrief={saveBrief}
    onPlatformChange={setPlatform}
  />;
}
