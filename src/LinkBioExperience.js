import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, AtSign, BarChart3, CalendarClock, Check, Copy, Download, Eye, EyeOff, ExternalLink, Globe2, Image as ImageIcon, LayoutGrid, Link2, Mail, MapPin, Moon, Palette, Plus, QrCode, Save, Settings2, Star, Sun, Trash2, Users, X } from 'lucide-react';
import { FaFacebook, FaInstagram, FaLinkedin, FaPinterest, FaSnapchatGhost, FaTelegram, FaTiktok, FaTwitter, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import { Artwork } from './CalendarExperience';
import { LINK_BIO_ART, LINK_BIO_BLOCK_CATALOG, LINK_BIO_INSIGHTS, LINK_BIO_SOCIAL_CATALOG, LINK_BIO_THEMES, activeLinkBioTheme, createLinkBioBlock, linkBioQrPattern, linkBioSummary, linkBioVisitorMode, moveLink, moveSocial, readLinkBio, saveLinkBio } from './linkBioPreviewModel';
import './link-bio-experience.css';
const SOCIAL_ICONS = {
  instagram: FaInstagram,
  facebook: FaFacebook,
  tiktok: FaTiktok,
  whatsapp: FaWhatsapp,
  linkedin: FaLinkedin,
  youtube: FaYoutube,
  x: FaTwitter,
  snapchat: FaSnapchatGhost,
  threads: AtSign,
  pinterest: FaPinterest,
  telegram: FaTelegram,
  email: Mail
};
const LINK_TYPE_NAMES = {
  reservation: 'Reservations',
  menu: 'Menu',
  contact: 'Contact',
  video: 'Watch',
  signup: 'Email signup',
  collection: 'Collection',
  featured: 'Featured',
  link: 'Explore'
};
const STUDIO_TABS = [['build', 'Build', LayoutGrid], ['design', 'Design', Palette], ['insights', 'Insights', BarChart3], ['share', 'Share', QrCode]];
function SocialLinks({
  items,
  onPreviewAction,
  position
}) {
  return <div className={`lb-public-socials lb-socials-${position}`} aria-label="Social profiles">{items.map(item => {
      const Icon = SOCIAL_ICONS[item.id] || Link2;
      return <a href={item.url} key={item.id} aria-label={item.label} onClick={event => {
        event.preventDefault();
        onPreviewAction(item.label);
      }}><Icon aria-hidden="true" /></a>;
    })}</div>;
}
function MiniSiteCanvas({
  page,
  onPreviewAction = () => {},
  publicView = false,
  live = false
}) {
  const theme = activeLinkBioTheme(page.theme),
    visibleLinks = page.links.filter(link => link.visible),
    enabledSocials = page.socials.filter(item => item.enabled),
    groups = [...new Set(visibleLinks.map(link => link.group || 'Links'))],
    primaryLink = visibleLinks.find(link => link.highlight) || visibleLinks[0],
    initials = page.title.split(/\s+/).filter(Boolean).slice(0, 3).map(word => word[0]).join('').toUpperCase() || 'TW';
  const vars = {
    '--lb-page-bg': theme.bg,
    '--lb-page-ink': theme.ink,
    '--lb-page-accent': theme.accent,
    '--lb-page-soft': theme.soft
  };
  const IntroHeading = publicView ? 'h1' : 'h2';
  const GroupHeading = publicView ? 'h2' : 'h3';
  return <article className={`lb-canvas lb-header-${page.headerStyle} lb-buttons-${page.buttonStyle} ${page.featuredEnabled ? 'lb-has-story' : 'lb-links-first'}${publicView ? ' lb-canvas-public' : ''}`} style={vars} aria-label={`${page.title} visitor page`}>
    <header className="lb-canvas-header"><span className={`lb-canvas-mark${page.logo ? ' lb-canvas-logo' : ''}`}>{page.logo ? <img src={page.logo} alt={`${page.title} logo`} /> : initials}</span><div><strong>{page.title}</strong><span>{page.handle}</span></div></header>
    {(page.bio || page.location || page.featuredEnabled && primaryLink) && <section className="lb-canvas-intro">{page.bio && <IntroHeading>{page.bio}</IntroHeading>}{page.location && <span><MapPin size={13} aria-hidden="true" />{page.location}</span>}{page.featuredEnabled && primaryLink && <a className="lb-hero-action" href={primaryLink.url} onClick={event => {
          event.preventDefault();
          onPreviewAction(primaryLink.title);
        }}><span>{primaryLink.title}</span><ExternalLink size={15} aria-hidden="true" /></a>}</section>}
    {page.socialPosition === 'top' && <SocialLinks items={enabledSocials} onPreviewAction={onPreviewAction} position="top" />}
    {page.featuredEnabled && <figure className="lb-feature"><Artwork post={{
        art: page.featured.art
      }} /><figcaption><span>{page.featured.eyebrow}</span><strong>{page.featured.title}</strong><p>{page.featured.note}</p></figcaption></figure>}
    <nav className="lb-public-links" aria-label={`${page.title} links`}>{groups.map(group => <section key={group}>{(groups.length > 1 || group !== 'Links') && <GroupHeading>{group}</GroupHeading>}{visibleLinks.filter(link => (link.group || 'Links') === group).map((link, index) => <a className={link.layout === 'featured' ? 'lb-public-featured' : ''} data-highlight={link.highlight ? 'true' : 'false'} href={link.url} key={link.id} onClick={event => {
          event.preventDefault();
          onPreviewAction(link.title);
        }}>{link.layout === 'featured' && <Artwork post={{
            art: link.art
          }} compact />}<span>{String(index + 1).padStart(2, '0')}</span><span className="lb-public-copy"><strong>{link.title}</strong><small>{LINK_TYPE_NAMES[link.type] || 'Explore'}</small></span>{link.highlight && <Star size={12} fill="currentColor" aria-label="Prioritized" />}<ExternalLink size={16} aria-hidden="true" /></a>)}</section>)}</nav>
    {page.subscribeEnabled && !live && <section className="lb-subscribe"><span>Updates</span><strong>{page.subscribeTitle}</strong><div><input aria-label="Email address preview" placeholder="Email address" readOnly /><button type="button" onClick={() => onPreviewAction('Email signup')}>Join</button></div></section>}
    {page.socialPosition !== 'top' && <SocialLinks items={enabledSocials} onPreviewAction={onPreviewAction} position="bottom" />}
    <footer><span>{page.title}</span><a className="lb-tawaslo-credit" href="https://tawaslo.com" target="_blank" rel="noreferrer" aria-label="Visit Tawaslo website">Made with <strong>Tawaslo</strong><ExternalLink size={10} aria-hidden="true" /></a></footer>
  </article>;
}
function QrPreview({
  value,
  color
}) {
  const matrix = linkBioQrPattern(value);
  return <div className="lb-qr-matrix" style={{
    '--lb-qr': color
  }} aria-label="QR code preview">{matrix.flatMap((row, y) => row.map((on, x) => <i key={`${x}-${y}`} data-on={on ? 'true' : 'false'} />))}</div>;
}
export default function LinkBioExperience({
  dark = false,
  setDark = () => {},
  livePage = null,
  clientName = '',
  liveError = '',
  onSavePage = null
}) {
  // A live bio_pages row records link clicks and nothing else. Views, click rate,
  // subscribers, traffic sources and the decorative QR matrix have no source behind
  // them, so they stay behind this flag instead of being shown to a paying client.
  const live = livePage !== null && livePage !== undefined;
  const loadedRef = useRef(livePage);
  const initial = useMemo(() => live ? { data: livePage, error: liveError } : readLinkBio(), []),
    [page, setPage] = useState(initial.data),
    [storageError, setStorageError] = useState(initial.error),
    [notice, setNotice] = useState(''),
    [visitor, setVisitor] = useState(() => linkBioVisitorMode(window.location.search)),
    [tab, setTab] = useState('build'),
    [socialPicker, setSocialPicker] = useState(false),
    [saving, setSaving] = useState(false),
    [blockPicker, setBlockPicker] = useState(false);
  // The published page is served from /bio/<slug>; the preview keeps its own wording.
  const visitorUrl = `${window.location.origin}/?page=linkbio&occasions=editorial&bioView=visitor`,
    publicUrl = live ? `${window.location.origin}/bio/${page.slug}` : `${window.location.origin}/${page.slug}`,
    publicPrefix = live ? `${window.location.origin.replace(/^https?:\/\//, '')}/bio/` : 'tawaslo.com/',
    summary = linkBioSummary(page);
  useEffect(() => { if (live && livePage !== loadedRef.current) { loadedRef.current = livePage; setPage(livePage); setStorageError(liveError); } }, [live, livePage, liveError]);
  useEffect(() => {
    const sync = () => setVisitor(linkBioVisitorMode(window.location.search));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 2600);
    return () => clearTimeout(timer);
  }, [notice]);
  function setField(field, value) {
    setPage(current => ({
      ...current,
      [field]: value
    }));
  }
  function setFeatured(field, value) {
    setPage(current => ({
      ...current,
      featured: {
        ...current.featured,
        [field]: value
      }
    }));
  }
  function updateLink(id, patch) {
    setPage(current => ({
      ...current,
      links: current.links.map(link => link.id === id ? {
        ...link,
        ...patch
      } : link)
    }));
  }
  function addBlock(type) {
    if (page.links.length >= 8) {
      setNotice('This preview holds up to eight content blocks.');
      return;
    }
    setPage(current => ({
      ...current,
      links: [...current.links, {
        ...createLinkBioBlock(type),
        group: ''
      }]
    }));
    setBlockPicker(false);
    setNotice('Content block added.');
  }
  function removeLink(id) {
    setPage(current => ({
      ...current,
      links: current.links.filter(link => link.id !== id)
    }));
    setNotice('Content block removed from this draft.');
  }
  function updateSocial(id, patch) {
    setPage(current => ({
      ...current,
      socials: current.socials.map(item => item.id === id ? {
        ...item,
        ...patch
      } : item)
    }));
  }
  function addSocial(id) {
    updateSocial(id, {
      enabled: true
    });
    setSocialPicker(false);
    setNotice(`${page.socials.find(item => item.id === id)?.label || 'Social profile'} added.`);
  }
  function removeSocial(id) {
    updateSocial(id, {
      enabled: false
    });
    setNotice('Social profile removed from this page.');
  }
  async function save() {
    if (live) {
      if (!onSavePage || saving) return;
      setSaving(true);
      const result = await onSavePage(page);
      setSaving(false);
      if (result && result.error) { setStorageError(result.error); setNotice(''); return; }
      setStorageError('');
      if (result && result.page) setPage(result.page);
      setNotice('Page saved.');
      return;
    }
    const result = saveLinkBio(page);
    if (result.ok) {
      setPage(result.data);
      setStorageError('');
      setNotice('Page saved in this browser.');
    } else setStorageError(result.error);
  }
  function showVisitor() {
    const url = new URL(window.location.href);
    url.searchParams.set('bioView', 'visitor');
    window.history.pushState({
      ...window.history.state,
      twApp: 1,
      twPage: 'linkbio'
    }, '', url);
    setVisitor(true);
  }
  function showEditor() {
    const url = new URL(window.location.href);
    url.searchParams.delete('bioView');
    window.history.pushState({
      ...window.history.state,
      twApp: 1,
      twPage: 'linkbio'
    }, '', url);
    setVisitor(false);
  }
  async function copyLink(value = visitorUrl) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice('Link copied.');
    } catch (_) {
      setNotice('Copy is unavailable. Select the address shown on screen.');
    }
  }
  function previewAction(label) {
    setNotice(`${label} is interactive in the published page.`);
  }
  function downloadQr() {
    const matrix = linkBioQrPattern(publicUrl),
      cell = 8,
      pad = 24,
      size = matrix.length * cell + pad * 2,
      rects = matrix.flatMap((row, y) => row.map((on, x) => on ? `<rect x="${pad + x * cell}" y="${pad + y * cell}" width="${cell}" height="${cell}"/>` : '')).join(''),
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#fff"/><g fill="${page.qrColor}">${rects}</g></svg>`,
      href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `${page.slug}-qr-preview.svg`;
    anchor.click();
    setNotice('QR preview downloaded. Test the production QR before printing.');
  }
  if (visitor) return <main className="tw-link-bio lb-visitor-stage" data-link-bio-theme={dark ? 'dark' : 'light'}><div className="lb-visitor-toolbar"><button type="button" className="lb-text-action" onClick={showEditor}>Back to editor</button><div><button type="button" className="lb-icon" onClick={() => setDark(!dark)} aria-label={dark ? 'Use light Link in bio theme' : 'Use dark Link in bio theme'}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button type="button" className="lb-button" onClick={() => copyLink(visitorUrl)}><Copy size={16} />Copy link</button></div></div><div className="lb-visitor-label"><span>Visitor preview</span><strong>{page.title}</strong></div><MiniSiteCanvas page={page} onPreviewAction={previewAction} publicView live={live} /><div className="lb-toast" role="status">{notice}</div></main>;
  const activeSocials = page.socials.filter(item => item.enabled);
  return <main className="tw-link-bio" data-link-bio-theme={dark ? 'dark' : 'light'}>
    <div className="lb-preview-line"><span>{live ? `Public page · ${publicPrefix}${page.slug}` : 'Design preview · Local mini-site · Nothing is published'}</span><button type="button" className="lb-icon" onClick={() => setDark(!dark)} aria-label={dark ? 'Use light Link in bio theme' : 'Use dark Link in bio theme'}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button></div>
  <header className="lb-heading"><div><span className="lb-kicker"><img src="/logo-transparent.png" width="22" height="22" alt="" />{live ? `${clientName || page.title} / Link in bio` : `${page.title} / Link in bio`}</span><h1>One link. A whole world.</h1><p>Build a branded mini-site that turns attention into clicks, visits, sales, bookings, and an audience you own.</p></div><div className="lb-heading-actions"><button type="button" className="lb-text-action" onClick={showVisitor}><Eye size={17} />Visitor view</button><button type="button" className="lb-button lb-primary" onClick={save} disabled={live && (saving || !onSavePage)}><Save size={17} />{saving ? 'Saving…' : 'Save page'}</button></div></header>
    {storageError && <p className="lb-error" role="alert">{storageError}</p>}<div className="lb-toast" role="status">{notice}</div>
    <nav className="lb-studio-tabs" aria-label="Link in bio studio">{STUDIO_TABS.map(([id, label, Icon]) => <button type="button" key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}><Icon size={16} /><span>{label}</span>{id === 'insights' && !live && <b>{LINK_BIO_INSIGHTS.clickRate}%</b>}</button>)}</nav>
    <div className="lb-workspace">
      <section className="lb-editor" aria-label="Edit Link in bio page">
        {tab === 'build' && <BuildEditor live={live} page={page} setPage={setPage} setField={setField} setNotice={setNotice} updateLink={updateLink} addBlock={addBlock} removeLink={removeLink} blockPicker={blockPicker} setBlockPicker={setBlockPicker} activeSocials={activeSocials} socialPicker={socialPicker} setSocialPicker={setSocialPicker} addSocial={addSocial} removeSocial={removeSocial} updateSocial={updateSocial} />} 
        {tab === 'design' && <DesignEditor page={page} setField={setField} setFeatured={setFeatured} />} 
        {tab === 'insights' && <InsightsEditor page={page} summary={summary} live={live} />} 
        {tab === 'share' && <ShareEditor page={page} setField={setField} publicUrl={publicUrl} publicPrefix={publicPrefix} copyLink={copyLink} downloadQr={downloadQr} live={live} />} 
      </section>
      <aside className="lb-live" aria-label="Live visitor page preview"><div className="lb-live-heading"><div><span>Live page</span><strong>{publicPrefix}{page.slug}</strong></div><button type="button" className="lb-text-action" onClick={() => copyLink(publicUrl)}><Copy size={15} />Copy</button></div><MiniSiteCanvas page={page} onPreviewAction={previewAction} live={live} />{live ? <p className="lb-local-note"><Link2 size={14} />Only visible links are published. Hidden links keep their click history and can be shown again at any time.</p> : <p className="lb-local-note"><Link2 size={14} />This local preview saves drafts in this browser. Publishing, forms, analytics, integrations, and a scannable production QR require the live product backend.</p>}</aside>
    </div>
  </main>;
}
function BuildEditor({
  page,
  setPage,
  setField,
  setNotice,
  updateLink,
  addBlock,
  removeLink,
  blockPicker,
  setBlockPicker,
  activeSocials,
  socialPicker,
  setSocialPicker,
  addSocial,
  removeSocial,
  updateSocial,
  live = false
}) {
  const [collectionsOpen, setCollectionsOpen] = useState(false),
    [collectionName, setCollectionName] = useState(''),
    collections = page.collections || [];
  function addCollection(event) {
    event.preventDefault();
    const name = collectionName.trim().slice(0, 40);
    if (!name) return;
    if (collections.some(item => item.toLowerCase() === name.toLowerCase())) {
      setNotice('That collection already exists.');
      return;
    }
    if (collections.length >= 12) {
      setNotice('This preview holds up to twelve collections.');
      return;
    }
    setPage(current => ({
      ...current,
      collections: [...(current.collections || []), name]
    }));
    setCollectionName('');
    setNotice(`${name} collection added.`);
  }
  function removeCollection(name) {
    setPage(current => ({
      ...current,
      collections: (current.collections || []).filter(item => item !== name),
      links: current.links.map(link => link.group === name ? {
        ...link,
        group: ''
      } : link)
    }));
    setNotice(`${name} collection removed. Its links are now ungrouped.`);
  }
  function uploadLogo(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setNotice('Use a PNG, JPG, or WebP logo.');
      return;
    }
    if (file.size > 1000000) {
      setNotice('Use a logo smaller than 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setField('logo', String(reader.result || ''));
      setNotice('Logo added to this draft.');
    };
    reader.onerror = () => setNotice('That logo could not be read. Try another file.');
    reader.readAsDataURL(file);
  }
  return <>
  <section className="lb-edit-section"><div className="lb-section-heading"><span>Identity</span><p>Add the brand, then keep the introduction as short—or minimal—as it needs to be.</p></div><div className="lb-logo-editor"><span className={`lb-logo-preview${page.logo ? ' lb-logo-preview-image' : ''}`}>{page.logo ? <img src={page.logo} alt="Current brand logo" /> : page.title.split(/\s+/).filter(Boolean).slice(0, 3).map(word => word[0]).join('').toUpperCase() || 'TW'}</span><div><strong>Brand logo</strong><small>PNG, JPG, or WebP · up to 1 MB</small><span><label className="lb-logo-upload"><ImageIcon size={15} />{page.logo ? 'Replace logo' : 'Upload logo'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo} /></label>{page.logo && <button type="button" className="lb-text-action" onClick={() => {
            setField('logo', '');
            setNotice('Logo removed. Initials will be used instead.');
          }}><Trash2 size={14} />Remove</button>}</span></div></div><div className="lb-fields"><label>Display name<input value={page.title} maxLength={80} onChange={event => setField('title', event.target.value)} /></label><label>Handle<input value={page.handle} maxLength={80} onChange={event => setField('handle', event.target.value)} /></label><label className="lb-wide">Short introduction <small>Optional</small><textarea rows={2} maxLength={180} value={page.bio} onChange={event => setField('bio', event.target.value)} /></label><label className="lb-wide">Location <small>Optional</small><input value={page.location} maxLength={100} onChange={event => setField('location', event.target.value)} /></label></div></section>
  <section className="lb-edit-section"><div className="lb-section-heading lb-links-heading"><div><span>Content</span><p>Create collections once, then place each link with a consistent dropdown.</p></div><div className="lb-section-actions"><button type="button" className="lb-text-action" onClick={() => setCollectionsOpen(value => !value)} aria-expanded={collectionsOpen}><LayoutGrid size={16} />Collections</button><button type="button" className="lb-text-action" onClick={() => setBlockPicker(value => !value)} aria-expanded={blockPicker} disabled={page.links.length >= 8}><Plus size={16} />Add content</button></div></div>{collectionsOpen && <div className="lb-collection-manager"><form onSubmit={addCollection}><label><span>New collection</span><input value={collectionName} maxLength={40} placeholder="e.g. Shop, Visit, Contact" onChange={event => setCollectionName(event.target.value)} /></label><button type="submit" className="lb-button" disabled={!collectionName.trim()}><Plus size={15} />Add</button></form><div>{collections.length ? collections.map(name => <span key={name}><strong>{name}</strong><button type="button" className="lb-icon lb-danger" aria-label={`Remove ${name} collection`} onClick={() => removeCollection(name)}><X size={14} /></button></span>) : <small>No collections yet. Links can stay ungrouped.</small>}</div><small>Collections become section headings on the public page.</small></div>}{blockPicker && <div className="lb-block-picker">{LINK_BIO_BLOCK_CATALOG.map(item => <button type="button" key={item.id} onClick={() => addBlock(item.id)}><span>{item.label}</span><small>{item.note}</small><Plus size={15} /></button>)}</div>}<ol className="lb-link-list">{page.links.map((link, index) => <li key={link.id} data-visible={link.visible ? 'true' : 'false'}><span className="lb-link-number">{String(index + 1).padStart(2, '0')}</span><div className="lb-link-fields"><label><span>Label</span><input value={link.title} maxLength={80} onChange={event => updateLink(link.id, {
                title: event.target.value
              })} /></label><label><span>Destination</span><input value={link.url} maxLength={300} onChange={event => updateLink(link.id, {
                url: event.target.value
              })} /></label><label><span>Collection</span><select value={link.group} onChange={event => updateLink(link.id, {
                group: event.target.value
              })}><option value="">No collection</option>{collections.map(name => <option value={name} key={name}>{name}</option>)}</select></label><label><span>Show from</span><input type="datetime-local" value={link.schedule} onChange={event => updateLink(link.id, {
                schedule: event.target.value
              })} /></label></div><div className="lb-link-meta"><span>{link.clicks.toLocaleString()} clicks</span><button type="button" aria-pressed={link.layout === 'featured'} onClick={() => updateLink(link.id, {
              layout: link.layout === 'featured' ? 'classic' : 'featured'
            })}><ImageIcon size={15} />{link.layout === 'featured' ? 'Featured' : 'Classic'}</button><button type="button" aria-pressed={link.highlight} onClick={() => setPage(current => ({
              ...current,
              links: current.links.map(item => ({
                ...item,
                highlight: item.id === link.id ? !link.highlight : false
              }))
            }))}><Star size={15} fill={link.highlight ? 'currentColor' : 'none'} />Prioritize</button></div><div className="lb-link-actions"><button type="button" className="lb-icon" aria-label={link.visible ? `Hide ${link.title}` : `Show ${link.title}`} aria-pressed={link.visible} onClick={() => updateLink(link.id, {
              visible: !link.visible
            })}>{link.visible ? <Eye size={17} /> : <EyeOff size={17} />}</button><button type="button" className="lb-icon" aria-label={`Move ${link.title} up`} disabled={index === 0} onClick={() => setPage(current => moveLink(current, link.id, -1))}><ArrowUp size={17} /></button><button type="button" className="lb-icon" aria-label={`Move ${link.title} down`} disabled={index === page.links.length - 1} onClick={() => setPage(current => moveLink(current, link.id, 1))}><ArrowDown size={17} /></button><button type="button" className="lb-icon lb-danger" aria-label={`Remove ${link.title}`} onClick={() => removeLink(link.id)}><Trash2 size={17} /></button></div></li>)}</ol></section>
  <section className="lb-edit-section"><div className="lb-section-heading lb-social-heading"><div><span>Socials</span><p>Add only the profiles this brand uses, then choose where the icons appear.</p></div><button type="button" className="lb-text-action" onClick={() => setSocialPicker(value => !value)} aria-expanded={socialPicker}><Plus size={16} />Add social</button></div><div className="lb-social-position" aria-label="Social icon position"><span>Position</span><button type="button" aria-pressed={page.socialPosition === 'top'} onClick={() => setField('socialPosition', 'top')}>Top</button><button type="button" aria-pressed={page.socialPosition !== 'top'} onClick={() => setField('socialPosition', 'bottom')}>Bottom</button></div>{socialPicker && <div className="lb-social-picker"><div><strong>Add a profile</strong><button type="button" className="lb-icon" onClick={() => setSocialPicker(false)} aria-label="Close social picker"><X size={17} /></button></div><div>{LINK_BIO_SOCIAL_CATALOG.filter(catalog => !page.socials.find(item => item.id === catalog.id)?.enabled).map(item => {
            const Icon = SOCIAL_ICONS[item.id] || Link2;
            return <button type="button" key={item.id} onClick={() => addSocial(item.id)}><Icon aria-hidden="true" /><span>{item.label}</span><Plus size={14} /></button>;
          })}</div></div>}<div className="lb-social-editor">{activeSocials.map((item, index) => {
          const Icon = SOCIAL_ICONS[item.id] || Link2,
            catalog = LINK_BIO_SOCIAL_CATALOG.find(entry => entry.id === item.id);
          return <div className="lb-social-row" key={item.id}><div className="lb-social-row-title"><Icon aria-hidden="true" /><strong>{item.label}</strong><div><button type="button" className="lb-icon" aria-label={`Move ${item.label} up`} disabled={index === 0} onClick={() => setPage(current => moveSocial(current, item.id, -1))}><ArrowUp size={15} /></button><button type="button" className="lb-icon" aria-label={`Move ${item.label} down`} disabled={index === activeSocials.length - 1} onClick={() => setPage(current => moveSocial(current, item.id, 1))}><ArrowDown size={15} /></button><button type="button" className="lb-icon lb-danger" aria-label={`Remove ${item.label}`} onClick={() => removeSocial(item.id)}><Trash2 size={15} /></button></div></div><label><span>Destination</span><input value={item.url} maxLength={300} inputMode="url" onChange={event => updateSocial(item.id, {
                url: event.target.value
              })} placeholder={catalog?.placeholder || 'https://example.com/profile'} /></label></div>;
        })}</div></section>
  {!live && <section className="lb-edit-section"><div className="lb-section-heading"><span>Audience</span><p>Give people a reason to return even after social reach changes.</p></div><div className="lb-audience-editor"><button type="button" aria-pressed={page.subscribeEnabled} onClick={() => setField('subscribeEnabled', !page.subscribeEnabled)}><Users size={17} /><span><strong>Email signup</strong><small>{page.subscribeEnabled ? 'Shown on the public page' : 'Hidden from visitors'}</small></span><Check size={16} /></button><label>Signup invitation<input disabled={!page.subscribeEnabled} value={page.subscribeTitle} maxLength={90} onChange={event => setField('subscribeTitle', event.target.value)} /></label></div></section>}
  </>;
}
function DesignEditor({
  page,
  setField,
  setFeatured
}) {
  return <>
  <section className="lb-edit-section"><div className="lb-section-heading"><span>Header</span><p>Choose how the brand introduces itself before visitors scroll.</p></div><div className="lb-choice-strip">{[['editorial', 'Editorial'], ['classic', 'Classic'], ['hero', 'Hero']].map(([id, label]) => <button type="button" key={id} aria-pressed={page.headerStyle === id} onClick={() => setField('headerStyle', id)}><span className={`lb-header-swatch lb-header-swatch-${id}`} /><strong>{label}</strong></button>)}</div></section>
  <section className="lb-edit-section"><div className="lb-section-heading"><span>Visual direction</span><p>Choose the mood, then decide whether the links need a featured story.</p></div><div className="lb-theme-grid">{LINK_BIO_THEMES.map(theme => <button type="button" key={theme.id} aria-pressed={page.theme === theme.id} onClick={() => setField('theme', theme.id)} style={{
          '--swatch-bg': theme.bg,
          '--swatch-ink': theme.ink,
          '--swatch-accent': theme.accent
        }}><span><i /><i /><i /></span><strong>{theme.name}</strong><small>{theme.note}</small></button>)}</div><div className="lb-feature-toggle"><button type="button" aria-pressed={page.featuredEnabled} aria-label={page.featuredEnabled ? 'Remove featured story from the page' : 'Add featured story to the page'} onClick={() => setField('featuredEnabled', !page.featuredEnabled)}>{page.featuredEnabled ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}<span><strong>Featured story</strong><small>{page.featuredEnabled ? 'Shown above your links' : 'Hidden — your links lead the page'}</small></span><b>{page.featuredEnabled ? 'Remove' : 'Add'}</b></button></div>{page.featuredEnabled && <><div className="lb-feature-fields"><label>Story label<input value={page.featured.eyebrow} maxLength={50} onChange={event => setFeatured('eyebrow', event.target.value)} /></label><label>Story headline<input value={page.featured.title} maxLength={90} onChange={event => setFeatured('title', event.target.value)} /></label><label className="lb-wide">Story note<textarea rows={2} maxLength={180} value={page.featured.note} onChange={event => setFeatured('note', event.target.value)} /></label></div><div className="lb-art-picker" aria-label="Featured artwork">{LINK_BIO_ART.map(item => <button type="button" key={item.id} aria-pressed={page.featured.art === item.id} onClick={() => setFeatured('art', item.id)}><Artwork post={{
            art: item.id
          }} compact /><span>{item.name}</span></button>)}</div></>}</section>
  <section className="lb-edit-section"><div className="lb-section-heading"><span>Link treatment</span><p>One consistent treatment keeps every action recognizable.</p></div><div className="lb-button-styles">{[['rules', 'Editorial rules'], ['solid', 'Solid buttons'], ['soft', 'Soft panels']].map(([id, label]) => <button type="button" key={id} aria-pressed={page.buttonStyle === id} onClick={() => setField('buttonStyle', id)}><i className={`lb-button-swatch lb-button-swatch-${id}`} /><span>{label}</span></button>)}</div></section>
  </>;
}
function InsightsEditor({
  page,
  summary,
  live = false
}) {
  // Nothing records a page view, a subscriber or a traffic source, so a live page
  // shows the clicks it actually counts and says plainly that the rest is missing.
  if (live) {
    const ranked = [...page.links].sort((a, b) => b.clicks - a.clicks);
    return <section className="lb-insights"><div className="lb-section-heading"><span>Performance</span><p>Link clicks counted on the published page.</p></div><div className="lb-metrics"><div><strong>{summary.totalClicks.toLocaleString()}</strong><span>clicks on visible links</span></div><div><strong>{summary.visible}</strong><span>visible links</span></div></div><div className="lb-insight-grid"><section><span>Clicks by link</span>{ranked.length ? ranked.map((link, index) => <div className="lb-performance-row" key={link.id}><b>{String(index + 1).padStart(2, '0')}</b><span><strong>{link.title}</strong><small>{link.visible ? 'Published' : 'Hidden'}</small></span><em>{link.clicks.toLocaleString()}</em></div>) : <p className="lb-local-note">No links on this page yet.</p>}</section></div><p className="lb-local-note"><BarChart3 size={14} />Clicks are the only measurement this page records. Views, click rate, subscribers and traffic sources are not tracked.</p></section>;
  }
  return <section className="lb-insights"><div className="lb-section-heading"><span>Performance</span><p>Sample data showing what the full product should help the team decide.</p></div><div className="lb-metrics"><div><strong>{LINK_BIO_INSIGHTS.views.toLocaleString()}</strong><span>views</span></div><div><strong>{LINK_BIO_INSIGHTS.clicks.toLocaleString()}</strong><span>clicks</span></div><div><strong>{LINK_BIO_INSIGHTS.clickRate}%</strong><span>click rate</span></div><div><strong>{LINK_BIO_INSIGHTS.subscribers}</strong><span>new subscribers</span></div></div><div className="lb-activity"><div><span>Activity</span><strong>{LINK_BIO_INSIGHTS.period}</strong></div><div className="lb-bars">{LINK_BIO_INSIGHTS.days.map((value, index) => <i key={index} style={{
          height: `${Math.round(value / 1.5)}%`
        }} title={`${value} visits`} />)}</div></div><div className="lb-insight-grid"><section><span>Top content</span>{[...page.links].sort((a, b) => b.clicks - a.clicks).map((link, index) => <div className="lb-performance-row" key={link.id}><b>{String(index + 1).padStart(2, '0')}</b><span><strong>{link.title}</strong><small>{link.group} · {link.layout}</small></span><em>{link.clicks.toLocaleString()}</em></div>)}</section><section><span>Traffic sources</span>{LINK_BIO_INSIGHTS.sources.map(source => <div className="lb-source-row" key={source.label}><span>{source.label}</span><i><b style={{
              width: `${source.value}%`
            }} /></i><strong>{source.value}%</strong></div>)}<div className="lb-recommendation"><Star size={17} /><span><strong>Best next move</strong><p>{summary.top?.title} leads this page. Keep it first, then test a stronger visual treatment on the next most important link.</p></span></div></section></div><p className="lb-local-note"><BarChart3 size={14} />Sample insight data for this design preview. A live page would record views, clicks, sources, devices, locations, subscribers, and campaign attribution.</p></section>;
}
function ShareEditor({
  page,
  setField,
  publicUrl,
  publicPrefix = 'tawaslo.com/',
  copyLink,
  downloadQr,
  live = false
}) {
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${page.seoTitle}\n${publicUrl}`)}`;
  return <section className="lb-share">
    <div className="lb-section-heading"><span>Share</span><p>Make the page easy to discover online and easy to carry into the real world.</p></div>
    <div className="lb-share-grid">
      {!live && <section className="lb-qr-panel"><QrPreview value={publicUrl} color={page.qrColor} /><div><span>QR preview</span><strong>Menus, table cards, windows, invitations.</strong><label>QR color<input type="color" value={page.qrColor} onChange={event => setField('qrColor', event.target.value)} /></label><button type="button" className="lb-button" onClick={downloadQr}><Download size={16} />Download SVG preview</button></div></section>}
      <section className="lb-page-address"><Globe2 size={22} /><span>Public address</span><label>Page name<div><b>{publicPrefix}</b><input value={page.slug} maxLength={60} onChange={event => setField('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} /></div></label><div className="lb-share-actions"><button type="button" className="lb-text-action" onClick={() => copyLink(publicUrl)}><Copy size={15} />Copy address</button><a className="lb-button lb-whatsapp-share" href={whatsappUrl} target="_blank" rel="noreferrer"><FaWhatsapp />Share to WhatsApp</a></div><small>A production page can also use the client’s own domain.</small></section>
    </div>
    <section className="lb-seo"><div><span>Search and sharing</span><p>Control how this page looks when it appears in Google, WhatsApp, and social messages.</p></div><label>Meta title <small>{page.seoTitle.length}/60</small><input value={page.seoTitle} maxLength={60} onChange={event => setField('seoTitle', event.target.value)} /></label><label>Meta description <small>{page.seoDescription.length}/155</small><textarea rows={3} value={page.seoDescription} maxLength={155} onChange={event => setField('seoDescription', event.target.value)} /></label><article className="lb-share-card"><span>{publicPrefix}{page.slug}</span><strong>{page.seoTitle}</strong><p>{page.seoDescription}</p></article></section>
    {!live && <section className="lb-connectors"><div><Settings2 size={18} /><span><strong>Campaign attribution</strong><small>UTM source, campaign, and referrer reporting on every block.</small></span><Check size={16} /></div><div><CalendarClock size={18} /><span><strong>Scheduled content</strong><small>Show or retire links around launches, menus, and events.</small></span><Check size={16} /></div><div><Users size={18} /><span><strong>Owned audience</strong><small>Email signup and future notification controls in one guest list.</small></span><Check size={16} /></div></section>}
  </section>;
}
