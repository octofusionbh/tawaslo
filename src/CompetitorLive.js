import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CompetitorExperience from './CompetitorExperience';

// /api/trends is a one-handle lookup, so the comparison list is simply the client's
// own shortlist of handles looked up one by one. Five is the ceiling because each
// handle is a separate request.
const MAX_ACCOUNTS = 5;
const API_PLATFORM = { ig: 'instagram', tt: 'tiktok' };
const listKey = client => `tw_competitor_live_${client?.id || client?.name || 'x'}`;
const ideasKey = client => `tw_competitor_live_ideas_${client?.id || client?.name || 'x'}`;

const text = value => (typeof value === 'string' ? value.trim() : '');
const num = value => (value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? null : Number(value));
// Posts come back with a caption and nothing else to name them by, so the card
// heading is the caption cut short — never an invented title.
const heading = value => { const line = String(value || '').replace(/\s+/g, ' ').trim(); if (!line) return 'Untitled post'; return line.length > 64 ? `${line.slice(0, 63).trimEnd()}…` : line; };

function readStore(key, guard) {
  try { const raw = window.localStorage.getItem(key); const value = raw ? JSON.parse(raw) : []; return Array.isArray(value) ? value.filter(guard) : []; } catch (_) { return []; }
}
function writeStore(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; }
}
const isAccount = item => !!item && typeof item.id === 'string' && typeof item.handle === 'string' && (item.platform === 'ig' || item.platform === 'tt');
const isIdea = item => !!item && typeof item.id === 'string' && typeof item.title === 'string';

function toPosts(list, platform, account) {
  return (Array.isArray(list) ? list : [])
    .filter(Boolean)
    .map((post, index) => ({
      id: `${platform}:${account.handle}:${index}`,
      accountId: account.id,
      accountName: account.name,
      platform,
      title: heading(post.caption),
      caption: text(post.caption),
      likes: num(post.likes),
      comments: num(post.comments),
      eng: num(post.eng),
      thumbnail: text(post.thumbnail),
      url: text(post.url),
    }))
    .sort((a, b) => (b.eng ?? b.likes ?? 0) - (a.eng ?? a.likes ?? 0));
}

async function lookup(entry, platform) {
  const base = { ...entry, look: 'custom', initials: (entry.name || entry.handle).slice(0, 1).toUpperCase(), loading: false, error: '', metrics: null, posts: [] };
  let data = null;
  try {
    const response = await fetch(`/api/trends?mode=competitor&handle=${encodeURIComponent(entry.handle)}&platform=${API_PLATFORM[platform]}`);
    data = await response.json();
  } catch (_) { data = null; }
  if (!data || !data.ok) return { ...base, error: 'This account could not be read right now. Check the handle, or try again later.' };
  const followers = num(data.followers), average = num(data.avgEngagement);
  // Followers anchors every figure in the row; without it there is nothing honest to show.
  const metrics = followers === null ? null : {
    followers,
    average,
    posts: num(data.postCount),
    sampleSize: num(data.sampleSize),
    // The same rate the old Competitor Spy page shows: avg interactions ÷ followers.
    rate: followers > 0 && average !== null ? (average / followers) * 100 : null,
  };
  return {
    ...base,
    metrics,
    posts: toPosts(data.topPosts, platform, entry),
    error: metrics ? '' : 'No public figures were returned for this account.',
  };
}

export default function CompetitorLive({ client, dark = false, setDark = () => {}, mobileWeb = false, lang = 'en', onOpenStudio = () => {} }) {
  const key = listKey(client), store = ideasKey(client);
  const [handles, setHandles] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [platform, setPlatform] = useState('ig');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [analyses, setAnalyses] = useState({});

  useEffect(() => { setHandles(readStore(key, isAccount)); setIdeas(readStore(store, isIdea)); }, [key, store]);

  const shortlist = useMemo(() => handles.filter(item => item.platform === platform), [handles, platform]);

  useEffect(() => {
    if (!shortlist.length) { setAccounts([]); setLoading(false); return undefined; }
    let active = true;
    setAccounts(shortlist.map(entry => ({ ...entry, look: 'custom', initials: (entry.name || entry.handle).slice(0, 1).toUpperCase(), loading: true, error: '', metrics: null, posts: [] })));
    setLoading(true); setError('');
    Promise.all(shortlist.map(entry => lookup(entry, platform)))
      .then(rows => { if (!active) return; setAccounts(rows); setLoading(false); if (rows.every(row => !row.metrics)) setError('No public data could be read for these accounts right now.'); })
      .catch(() => { if (!active) return; setLoading(false); setError('The competitor lookup failed. Try again in a moment.'); });
    return () => { active = false; };
  }, [shortlist, platform]);

  const selected = accounts.find(item => item.id === selectedId) || null;
  const analysisKey = selected ? `${platform}:${selected.handle}` : '';

  // The AI read is a second request, so it only runs for the account on screen once
  // its figures have arrived, and the result is kept for the rest of the session.
  // A ref, not the analyses state, tracks what has been asked for: keying the effect on
  // the state it writes would cancel the request it just started.
  const requested = useRef({});
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  useEffect(() => {
    if (!selected || selected.loading || !analysisKey || requested.current[analysisKey]) return;
    requested.current[analysisKey] = true;
    setAnalyses(current => ({ ...current, [analysisKey]: { loading: true } }));
    fetch('/api/generate-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'compete',
        competitor: selected.handle,
        niche: client?.name || '',
        platform: API_PLATFORM[platform],
        lang,
        stats: selected.metrics ? { ok: true, handle: selected.handle, followers: selected.metrics.followers, avgEngagement: selected.metrics.average, postCount: selected.metrics.posts, sampleSize: selected.metrics.sampleSize } : undefined,
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (!mounted.current) return;
        const ok = data && (data.summary || (data.strengths || []).length || (data.gaps || []).length || (data.playbook || []).length);
        setAnalyses(current => ({ ...current, [analysisKey]: ok
          ? { summary: text(data.summary), strengths: data.strengths || [], gaps: data.gaps || [], playbook: data.playbook || [] }
          : { error: 'The read of this account could not be generated.' } }));
      })
      .catch(() => { if (mounted.current) setAnalyses(current => ({ ...current, [analysisKey]: { error: 'The read of this account could not be generated.' } })); });
  }, [selected, analysisKey, client, platform, lang]);

  const persist = useCallback(next => {
    setHandles(next);
    if (!writeStore(key, next)) setError('Your competitor list could not be saved. Browser storage is unavailable.');
  }, [key]);

  const addCompetitor = useCallback((input, forPlatform) => {
    const handle = String(input?.handle || '').trim().replace(/^@/, '').toLowerCase();
    const name = String(input?.name || '').trim() || handle;
    if (!/^[a-z0-9_.]{1,40}$/.test(handle)) return { ok: false, field: 'handle', error: 'Enter a handle using letters, numbers, dots or underscores, up to 40 characters. Do not enter a link.' };
    if (name.length > 60) return { ok: false, field: 'name', error: 'Keep the account name to 60 characters or fewer.' };
    if (handles.some(item => item.handle === handle && item.platform === forPlatform)) return { ok: false, field: 'handle', error: 'This account is already in your comparison.' };
    if (handles.filter(item => item.platform === forPlatform).length >= MAX_ACCOUNTS) return { ok: false, error: `You can compare up to ${MAX_ACCOUNTS} accounts per platform. Remove one before adding another.` };
    const account = { id: `competitor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, handle, platform: forPlatform };
    persist([...handles, account]);
    return { ok: true, account };
  }, [handles, persist]);

  const removeCompetitor = useCallback(account => {
    if (!account || !handles.some(item => item.id === account.id)) return { ok: false, error: 'This account is no longer in your comparison.' };
    persist(handles.filter(item => item.id !== account.id));
    return { ok: true };
  }, [handles, persist]);

  const saveIdea = useCallback(post => {
    if (!post || !post.id) return { ok: false, error: 'This post could not be saved.' };
    if (ideas.some(item => item.id === post.id)) return { ok: true, alreadySaved: true };
    if (ideas.length >= 100) return { ok: false, error: 'You have reached 100 saved posts. Remove one before saving another.' };
    const next = [{ id: post.id, title: post.title, caption: post.caption, url: post.url, thumbnail: post.thumbnail, accountName: post.accountName, platform: post.platform, savedAt: Date.now() }, ...ideas];
    setIdeas(next);
    if (!writeStore(store, next)) return { ok: false, error: 'Not saved. Browser storage is full or unavailable.' };
    return { ok: true };
  }, [ideas, store]);

  return <CompetitorExperience
    dark={dark}
    setDark={setDark}
    onOpenStudio={onOpenStudio}
    liveAccounts={accounts}
    liveSavedIdeas={ideas}
    liveAnalysis={analysisKey ? analyses[analysisKey] || null : null}
    liveError={error}
    liveLoading={loading}
    clientName={client?.name || ''}
    onAddCompetitor={addCompetitor}
    onRemoveCompetitor={removeCompetitor}
    onSaveIdea={saveIdea}
    onSelectAccount={account => setSelectedId(account ? account.id : '')}
    onPlatformChange={next => { setPlatform(next); setSelectedId(''); }}
  />;
}
