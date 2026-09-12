import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabase';
import LinkBioExperience from './LinkBioExperience';
import { LINK_BIO_SOCIAL_CATALOG } from './linkBioPreviewModel';

const text = value => (typeof value === 'string' ? value : '');
const slugify = value => text(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'page';
const count = value => (Number.isFinite(Number(value)) ? Math.max(0, Math.round(Number(value))) : 0);

// The published page resolves social icons from this fixed set; anything else
// renders as a generic globe, and a non-http value (mailto:) would be mangled
// into a broken link, so those stay in hub.studio and are not published.
const PUBLISHABLE_SOCIALS = new Set(['instagram', 'tiktok', 'snapchat', 'whatsapp', 'x', 'youtube', 'facebook', 'linkedin', 'telegram', 'pinterest']);

function studioOf(hub) {
  const studio = hub && typeof hub === 'object' ? hub.studio : null;
  return studio && typeof studio === 'object' ? studio : {};
}

// bio_pages stores the published link as {id, label, url, clicks}. Everything the
// redesign adds (visibility, grouping, layout, artwork) lives in hub.studio.links so
// the public renderer keeps working and hidden links keep their click history.
function toLinks(row, studio) {
  const published = Array.isArray(row?.links) ? row.links : [];
  const meta = Array.isArray(studio.links) ? studio.links : [];
  const clicksById = new Map(published.map(link => [text(link?.id), count(link?.clicks)]));
  const base = meta.length ? meta : published;
  return base.slice(0, 8).map((link, index) => {
    const id = text(link?.id) || `link-${index + 1}`;
    const live = published.find(item => text(item?.id) === id);
    return {
      id,
      title: text(live?.label) || text(link?.title) || text(link?.label) || '',
      url: text(live?.url) || text(link?.url) || '',
      visible: meta.length ? link?.visible !== false : true,
      type: text(link?.type) || 'link',
      layout: link?.layout === 'featured' ? 'featured' : 'classic',
      art: text(link?.art) || 'table',
      clicks: clicksById.has(id) ? clicksById.get(id) : count(link?.clicks),
      group: text(link?.group),
      highlight: link?.highlight === true,
      schedule: text(link?.schedule).slice(0, 40),
    };
  });
}

function toSocials(hub, studio) {
  const saved = Array.isArray(studio.socials) ? studio.socials : null;
  const published = Array.isArray(hub?.socials) ? hub.socials : [];
  return LINK_BIO_SOCIAL_CATALOG.map(item => {
    const fromStudio = saved && saved.find(entry => entry?.id === item.id);
    const fromHub = published.find(entry => text(entry?.type) === item.id || text(entry?.id) === item.id);
    const url = text(fromStudio?.url) || text(fromHub?.value) || item.url;
    const enabled = fromStudio ? fromStudio.enabled !== false : !!text(fromHub?.value);
    return { ...item, url, enabled };
  });
}

// Only real row values are carried across. Nothing is defaulted to a sample figure.
function toPage(row, clientName) {
  const hub = row?.hub && typeof row.hub === 'object' ? row.hub : {};
  const studio = studioOf(hub);
  const links = toLinks(row, studio);
  const groups = links.map(link => link.group).filter(Boolean);
  const savedCollections = Array.isArray(studio.collections) ? studio.collections.filter(item => typeof item === 'string') : [];
  return {
    title: text(row?.title) || text(clientName),
    handle: text(studio.handle),
    logo: text(row?.avatar_url),
    location: text(hub.location),
    bio: text(row?.bio),
    theme: text(studio.theme) || 'harbor',
    featuredEnabled: studio.featuredEnabled === true,
    featured: {
      eyebrow: text(studio.featured?.eyebrow),
      title: text(studio.featured?.title),
      note: text(studio.featured?.note),
      art: text(studio.featured?.art) || 'table',
    },
    collections: [...savedCollections, ...groups].filter((item, index, list) => item && list.indexOf(item) === index).slice(0, 12),
    links,
    slug: text(row?.slug),
    headerStyle: ['editorial', 'classic', 'hero'].includes(studio.headerStyle) ? studio.headerStyle : 'editorial',
    buttonStyle: ['rules', 'solid', 'soft'].includes(studio.buttonStyle) ? studio.buttonStyle : 'rules',
    // Nothing collects email addresses, so the signup block is never shown live.
    subscribeEnabled: false,
    subscribeTitle: '',
    seoTitle: text(studio.seoTitle),
    seoDescription: text(studio.seoDescription),
    qrColor: /^#[0-9a-f]{6}$/i.test(text(studio.qrColor)) ? studio.qrColor : '#163B38',
    socialPosition: studio.socialPosition === 'top' ? 'top' : 'bottom',
    socials: toSocials(hub, studio),
  };
}

function toRow(page, row, clientId) {
  const hub = row?.hub && typeof row.hub === 'object' ? row.hub : {};
  const visible = page.links.filter(link => link.visible && (link.title || link.url));
  return {
    client_id: row?.client_id || clientId,
    slug: text(page.slug) || slugify(page.title),
    title: text(page.title),
    bio: text(page.bio),
    avatar_url: text(page.logo),
    // Columns this redesign does not edit keep whatever the row already holds.
    accent: text(row?.accent) || '#7C83FF',
    show_posts: row?.show_posts !== false,
    // label is what the public page renders; title is written too so both shapes agree.
    links: visible.map(link => ({ id: link.id, label: text(link.title), title: text(link.title), url: text(link.url), clicks: count(link.clicks) })),
    hub: {
      ...hub,
      location: text(page.location),
      socials: page.socials.filter(item => item.enabled && PUBLISHABLE_SOCIALS.has(item.id) && /^https?:\/\//.test(text(item.url))).map(item => ({ id: item.id, type: item.id, value: text(item.url), label: text(item.label) })),
      // hub.theme drives the published renderer and uses a different preset set, so
      // the redesign's own styling is kept apart from it under hub.studio.
      studio: {
        handle: text(page.handle),
        theme: text(page.theme),
        headerStyle: text(page.headerStyle),
        buttonStyle: text(page.buttonStyle),
        featuredEnabled: page.featuredEnabled === true,
        featured: page.featured,
        collections: page.collections,
        socialPosition: page.socialPosition,
        seoTitle: text(page.seoTitle),
        seoDescription: text(page.seoDescription),
        qrColor: text(page.qrColor),
        socials: page.socials.map(item => ({ id: item.id, url: text(item.url), enabled: item.enabled === true })),
        links: page.links.map(link => ({ id: link.id, title: text(link.title), url: text(link.url), visible: link.visible !== false, type: link.type, layout: link.layout, art: link.art, group: link.group, highlight: link.highlight === true, schedule: link.schedule })),
      },
    },
    updated_at: new Date().toISOString(),
  };
}

export default function LinkBioLive({ client, dark = false, setDark = () => {} }) {
  const [state, setState] = useState({ status: 'loading', row: null, error: '' });
  const clientIdRef = useRef('');
  const clientId = client?.id || '';
  const clientName = client?.name || '';

  useEffect(() => {
    let active = true;
    if (!clientId && !clientName) { setState({ status: 'empty', row: null, error: '' }); return undefined; }
    setState({ status: 'loading', row: null, error: '' });
    (async () => {
      try {
        let id = clientId;
        if (!id) {
          const { data, error } = await supabase.from('clients').select('id').eq('name', clientName).limit(1);
          if (error) throw error;
          id = data && data[0] && data[0].id;
        }
        if (!id) throw new Error('This client is not in the workspace yet.');
        // bio_pages allows several pages per client; this screen edits the first one.
        const { data: rows, error } = await supabase.from('bio_pages').select('*').eq('client_id', id).order('created_at', { ascending: true });
        if (error) throw error;
        if (!active) return;
        clientIdRef.current = id;
        const row = (rows || [])[0] || { client_id: id, slug: `${slugify(clientName)}-${Math.random().toString(36).slice(2, 6)}`, title: clientName, bio: '', avatar_url: text(client?.logo), accent: '#7C83FF', show_posts: true, links: [], hub: {} };
        setState({ status: 'ready', row, error: '' });
      } catch (error) {
        if (!active) return;
        setState({ status: 'error', row: null, error: (error && error.message) || 'This link in bio page could not be loaded.' });
      }
    })();
    return () => { active = false; };
  }, [clientId, clientName, client?.logo]);

  // A stable object keeps the editor from discarding unsaved edits on re-render.
  const page = useMemo(() => (state.row ? toPage(state.row, clientName) : null), [state.row, clientName]);

  const handleSave = useCallback(async next => {
    const row = state.row;
    if (!row) return { error: 'This workspace is not connected yet.' };
    const payload = toRow(next, row, clientIdRef.current);
    if (!payload.slug) return { error: 'Give the page an address before saving.' };
    try {
      const query = row.id
        ? supabase.from('bio_pages').update(payload).eq('id', row.id).select()
        : supabase.from('bio_pages').insert([payload]).select();
      const { data, error } = await query;
      if (error) throw error;
      const saved = data && data[0];
      if (!saved) throw new Error('The page could not be saved.');
      setState(current => ({ ...current, row: saved }));
      return { page: toPage(saved, clientName) };
    } catch (error) {
      const message = (error && error.message) || 'The page could not be saved.';
      return { error: /duplicate|unique/i.test(message) ? 'That page address is already taken. Choose another.' : message };
    }
  }, [state.row, clientName]);

  if (state.status !== 'ready' || !page) {
    return <main className="tw-link-bio" data-link-bio-theme={dark ? 'dark' : 'light'}>
      <header className="lb-heading"><div>
        <span className="lb-kicker">{clientName ? `${clientName} / Link in bio` : 'Link in bio'}</span>
        <h1>One link. A whole world.</h1>
        <p>{state.status === 'loading' ? 'Loading this page…' : state.status === 'empty' ? 'Choose a client to open their link in bio page.' : state.error}</p>
      </div></header>
    </main>;
  }

  return <LinkBioExperience dark={dark} setDark={setDark} livePage={page} clientName={clientName} onSavePage={handleSave} />;
}
