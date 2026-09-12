import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import ReviewsExperience from './ReviewsExperience';

const text = value => (typeof value === 'string' ? value : '');
const slugify = value => String(value || 'r').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 26) || 'r';

function whenLabel(iso) {
  if (!iso) return '';
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  const time = at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const day = new Date(at); day.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.round((today - day) / 86400000);
  if (days === 0) return `Today · ${time}`;
  if (days === 1) return `Yesterday · ${time}`;
  return `${at.toLocaleDateString([], { day: 'numeric', month: 'short' })} · ${time}`;
}

// reviews stores a rating, the route it took and an optional private comment. There is no reply,
// tag or status column, so a row starts unanswered and the design's tag strip stays empty.
function toReview(row) {
  const rating = Math.min(5, Math.max(1, Number(row.rating) || 1));
  return {
    id: row.id,
    source: row.route === 'google' ? 'google' : 'direct',
    rating,
    name: text(row.name).trim() || 'Guest',
    when: whenLabel(row.created_at),
    comment: text(row.comment).trim(),
    tags: [],
    status: rating <= 3 ? 'needs-care' : 'unanswered',
    phone: text(row.phone).trim(),
    reply: '',
  };
}

// Every rating counts towards the score; only rows carrying feedback reach the inbox, which mirrors
// how the owner page separates the star stats from the private-feedback list.
function summarize(rows) {
  const count = rows.length;
  const average = count ? rows.reduce((sum, row) => sum + (Number(row.rating) || 0), 0) / count : 0;
  return { count, average, distribution: [5, 4, 3, 2, 1].map(rating => ({ rating, count: rows.filter(row => Number(row.rating) === rating).length })) };
}

function toSettings(row) {
  return {
    enabled: row.enabled !== false,
    headline: text(row.headline),
    googleUrl: text(row.google_url),
    privatePrompt: '',
    followupOn: row.goodbye_on === true,
  };
}

export default function ReviewsLive({ client, dark = false }) {
  const [state, setState] = useState({ status: 'loading', reviews: [], summary: null, settings: null, slug: '', error: '' });
  const settingsRef = useRef(null);
  const clientId = client?.id || '';
  const clientName = client?.name || '';

  useEffect(() => {
    let active = true;
    if (!clientId && !clientName) { setState({ status: 'empty', reviews: [], summary: null, settings: null, slug: '', error: '' }); return undefined; }
    setState({ status: 'loading', reviews: [], summary: null, settings: null, slug: '', error: '' });
    (async () => {
      try {
        let id = clientId;
        if (!id) {
          const { data, error } = await supabase.from('clients').select('id').eq('name', clientName).limit(1);
          if (error) throw error;
          id = data && data[0] && data[0].id;
        }
        if (!id) throw new Error('This client is not in the workspace yet.');

        // The public review page is found by bio_pages.slug, so the owner page creates one when missing.
        let slug = '';
        const { data: pages } = await supabase.from('bio_pages').select('slug').eq('client_id', id).limit(1);
        slug = (pages && pages[0] && pages[0].slug) || '';
        if (!slug && clientName) {
          const next = `${slugify(clientName)}-${Math.random().toString(36).slice(2, 5)}`;
          const { error: pageError } = await supabase.from('bio_pages').insert([{ client_id: id, slug: next, title: clientName }]);
          if (!pageError) slug = next;
        }

        let settingsRow = null;
        const { data: rows } = await supabase.from('review_settings').select('*').eq('client_id', id).limit(1);
        settingsRow = (rows && rows[0]) || null;
        if (!settingsRow) {
          const { data: created } = await supabase.from('review_settings').insert([{ client_id: id, threshold: 4, headline: 'How was your visit?' }]).select();
          settingsRow = (created && created[0]) || null;
        }

        const { data: reviewRows, error: reviewError } = await supabase.from('reviews').select('*').eq('client_id', id).order('created_at', { ascending: false });
        if (reviewError) throw reviewError;
        if (!active) return;
        settingsRef.current = settingsRow;
        const all = reviewRows || [];
        const feedback = all.filter(row => row.route === 'private' || text(row.comment).trim());
        setState({
          status: 'ready',
          reviews: feedback.map(toReview),
          summary: summarize(all),
          settings: toSettings(settingsRow || {}),
          slug,
          error: '',
        });
      } catch (error) {
        if (!active) return;
        setState({ status: 'error', reviews: [], summary: null, settings: null, slug: '', error: (error && error.message) || 'Reviews could not be loaded.' });
      }
    })();
    return () => { active = false; };
  }, [clientId, clientName]);

  const handleSettings = useCallback(async update => {
    const row = settingsRef.current;
    if (!row || !row.id) return;
    const patch = {};
    if ('headline' in update) patch.headline = update.headline;
    if ('googleUrl' in update) patch.google_url = update.googleUrl;
    if ('enabled' in update) patch.enabled = update.enabled;
    if (!Object.keys(patch).length) return;
    settingsRef.current = { ...row, ...patch };
    try { await supabase.from('review_settings').update(patch).eq('id', row.id); } catch (_) {}
  }, []);

  if (state.status !== 'ready') {
    return <main className="tw-reviews" data-theme={dark ? 'dark' : 'light'}>
      <header className="re-page-head"><div><span>{clientName ? `${clientName} / Reviews` : 'Reviews'}</span><h1>Every review, handled.</h1>
      <p>{state.status === 'loading' ? 'Loading this client’s reviews…' : state.status === 'empty' ? 'Choose a client to open their reviews.' : state.error}</p></div></header>
    </main>;
  }

  return <ReviewsExperience
    dark={dark}
    liveReviews={state.reviews}
    liveSummary={state.summary}
    liveSettings={state.settings}
    liveShareSlug={state.slug}
    clientName={clientName}
    onSettingsChange={handleSettings}
  />;
}
