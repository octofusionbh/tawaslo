import { useCallback, useEffect, useMemo, useState } from 'react';
import SuggestedExperience from './SuggestedExperience';

// Feeds stay under the key the previous Suggested page used, so a client's
// existing sources keep working after the redesign is switched on.
const feedKey = client => `tw_feeds_${client?.id || client?.name || 'x'}`;
const savedKey = client => `tw_suggested_saved_${client?.id || client?.name || 'x'}`;
const text = value => (typeof value === 'string' ? value : '');
const host = value => { try { return new URL(/^https?:\/\//.test(value) ? value : `https://${value}`).hostname.replace(/^www\./, ''); } catch (_) { return value; } };

function readList(key) {
  try { const raw = window.localStorage.getItem(key); const value = raw ? JSON.parse(raw) : []; return Array.isArray(value) ? value.filter(item => typeof item === 'string') : []; } catch (_) { return []; }
}
function writeList(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; }
}

// Relative wording is derived from the item's own date; items without one show nothing.
function published(value) {
  const at = new Date(value);
  if (!value || Number.isNaN(at.getTime())) return '';
  const days = Math.round((Date.now() - at.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return at.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

// The feed gives no id, so one is derived from the link purely to key the list.
function toIdea(item, index) {
  const link = text(item?.link).trim();
  return {
    id: link || `feed-item-${index}`,
    title: text(item?.title).trim() || link || 'Untitled article',
    link,
    snippet: text(item?.snippet).trim(),
    source: text(item?.source).trim(),
    published: published(item?.date),
    image: text(item?.image).trim(),
  };
}

export default function SuggestedLive({ client, dark = false, setDark = () => {}, mobileWeb = false, onOpenPublisher = () => {}, onOpenStudio = () => {} }) {
  const key = feedKey(client), store = savedKey(client);
  const [feeds, setFeeds] = useState([]);
  const [saved, setSaved] = useState([]);
  const [state, setState] = useState({ loading: false, items: [], error: '' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => { setFeeds(readList(key)); setSaved(readList(store)); }, [key, store]);

  useEffect(() => {
    let active = true;
    if (!feeds.length) { setState({ loading: false, items: [], error: '' }); return undefined; }
    setState(current => ({ ...current, loading: true, error: '' }));
    fetch('/api/generate-caption', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'rss', urls: feeds }) })
      .then(response => response.json())
      .then(data => { if (!active) return; setState({ loading: false, items: Array.isArray(data?.items) ? data.items.map(toIdea) : [], error: '' }); })
      .catch(() => { if (!active) return; setState({ loading: false, items: [], error: 'The latest articles could not be loaded. Try refreshing.' }); });
    return () => { active = false; };
  }, [feeds, nonce]);

  const sources = useMemo(() => feeds.map(url => ({ id: url, name: host(url), detail: url, active: true, url })), [feeds]);

  const persistFeeds = useCallback(next => { setFeeds(next); if (!writeList(key, next)) setState(current => ({ ...current, error: 'Feeds could not be saved. Browser storage is unavailable.' })); }, [key]);

  const addSource = useCallback(value => {
    let url = String(value || '').trim();
    if (!url) return { error: 'Enter a website address, such as example.com.' };
    if (!/^https?:\/\//.test(url)) url = `https://${url}`;
    if (feeds.includes(url)) return { error: '' };
    persistFeeds([...feeds, url]);
    return {};
  }, [feeds, persistFeeds]);

  const removeSource = useCallback(source => { persistFeeds(feeds.filter(url => url !== (source?.url || source?.id))); }, [feeds, persistFeeds]);

  const toggleSaved = useCallback(idea => {
    const id = idea?.id;
    if (!id) return { saved: false };
    const next = saved.includes(id) ? saved.filter(item => item !== id) : [id, ...saved];
    setSaved(next); writeList(store, next);
    return { saved: next.includes(id) };
  }, [saved, store]);

  return <SuggestedExperience
    dark={dark}
    setDark={setDark}
    mobileWeb={mobileWeb}
    onOpenPublisher={onOpenPublisher}
    onOpenStudio={onOpenStudio}
    liveIdeas={state.items}
    liveSources={sources}
    clientName={client?.name || ''}
    liveError={state.error}
    liveLoading={state.loading}
    savedIds={saved}
    onToggleSaved={toggleSaved}
    onAddSource={addSource}
    onRemoveSource={removeSource}
    onRefresh={() => setNonce(value => value + 1)}
  />;
}
