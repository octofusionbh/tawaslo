import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Bookmark, CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, Clock, Eye, Film, Grid3X3, Heart, Layers2, LayoutGrid, List, Mail, MessageCircle, MessageSquare, Moon, MoreHorizontal, Send, Sun, UserRound, X } from 'lucide-react';
import { FaInstagram, FaFacebook, FaLinkedin, FaTiktok, FaWhatsapp } from 'react-icons/fa';
import { CALENDAR_PREVIEW_KEY, CALENDAR_STATUS, CALENDAR_NETWORKS, monthKey, parseCalendarMonth, calendarDays, seedCalendar, canReview, reviewDecision, revisePost, createReviewRound } from './calendarPreviewModel';
import plannerGoldenHour from './assets/planner-golden-hour.png';
import plannerSundayBrunch from './assets/planner-sunday-brunch.png';
import plannerEveningTable from './assets/planner-evening-table.png';
import plannerChefKitchen from './assets/planner-chef-kitchen.png';
import './calendar-experience.css';

const ICONS = { ig: FaInstagram, fb: FaFacebook, li: FaLinkedin, tt: FaTiktok };
const fmtMonth = date => date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const dateLabel = (date, day) => new Date(date.getFullYear(), date.getMonth(), day).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const storageKey = date => `${CALENDAR_PREVIEW_KEY}:preview-marina:${monthKey(date)}`;
// `store` is the workspace's real posts wearing the same interface as
// localStorage, so the whole component reads and writes through one shape
// whether it is showing the design preview or a live client's month.
const backingStore = (store) => store || (typeof window !== 'undefined' ? window.localStorage : null);
const ARTWORK_IMAGES={sunset:plannerGoldenHour,table:plannerSundayBrunch,menu:plannerEveningTable,kitchen:plannerChefKitchen,sea:plannerGoldenHour};
function loadCalendar(date, store = null) {
  try {
    const backing = backingStore(store);
    const data = JSON.parse(backing.getItem(storageKey(date)));
    if (data?.month === monthKey(date) && Array.isArray(data.posts) && Array.isArray(data.sharedIds) && Array.isArray(data.activity)) return data;
    // A live workspace with nothing scheduled that month is an empty calendar,
    // never the sample month. Only the design preview falls back to seeds.
    if (store) return { month: monthKey(date), posts: [], sharedIds: [], message: '', access: 'review', expiresAt: null, activity: [] };
  } catch (_) { /* A blocked store still allows an in-memory preview. */ }
  return store ? { month: monthKey(date), posts: [], sharedIds: [], message: '', access: 'review', expiresAt: null, activity: [] } : seedCalendar(date);
}
function Network({ platform, label = false }) {
  const Icon = ICONS[platform] || FaInstagram;
  return <span className="cal-network"><Icon aria-hidden="true"/>{label && CALENDAR_NETWORKS[platform]}</span>;
}
function Status({ status }) { return <span className={`cal-status cal-status-${status}`}><span aria-hidden="true"/>{CALENDAR_STATUS[status]}</span>; }

// Native artwork, not screenshots or claimed live social posts. Text stays crisp at every size.
export function Artwork({ post, slide = 0, compact = false, live = false }) {
  // A stored image can 404 (an older upload, a moved bucket). Fall back to the
  // plain titled tile rather than leaving a broken-image icon on the card.
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [post.image]);
  const designs = {
    sunset: ['GOLDEN', 'HOUR', 'A LITTLE LONGER BY THE WATER'],
    table: ['Sunday', 'slows down.', 'LUNCH AT MARINA SOCIAL CLUB'],
    menu: slide === 1 ? ['Good food.', 'Better company.', 'MADE FOR THE MIDDLE OF THE TABLE'] : slide === 2 ? ['Your place', 'by the sea.', 'COME AS YOU ARE'] : ['The table', 'is yours.', 'MAKE ROOM FOR SOMETHING GOOD'],
    kitchen: ['Made', 'with heart.', 'MEET THE PEOPLE BEHIND THE PLACE'],
    sea: ['By the', 'water.', 'MARINA SOCIAL CLUB'],
  };
  const lines = designs[post.art] || designs.sea;
  // A real post carries its own artwork; the sample set is only used when it does not.
  if (post.image && !broken) return <div className={`cal-art cal-art-photo ${compact ? 'cal-art-small' : ''}`} role="img" aria-label={post.title || 'Post artwork'}>
    <img className="cal-art-image" src={post.image} alt="" aria-hidden="true" onError={() => setBroken(true)}/>
  </div>;
  if (live || post.image === null || broken) return <div className={`cal-art cal-art-empty ${compact ? 'cal-art-small' : ''}`} role="img" aria-label={post.title || 'Post without artwork'}>
    <span className="cal-art-brand">{(post.title || 'Post').slice(0, 28)}</span>
  </div>;
  const image=ARTWORK_IMAGES[post.art]||ARTWORK_IMAGES.sea;
  return <div className={`cal-art cal-art-photo cal-art-${post.art} ${compact ? 'cal-art-small' : ''}`} role="img" aria-label={`Campaign photograph: ${lines[0]} ${lines[1]}`}>
    <img className="cal-art-image" src={image} alt="" aria-hidden="true"/>
    <span className="cal-art-shade" aria-hidden="true"/>
    <span className="cal-art-brand">MARINA<br/>SOCIAL CLUB</span>
    <strong>{lines[0]}<br/>{lines[1]}</strong>
    <span className="cal-art-caption">{lines[2]}</span>
  </div>;
}

export default function CalendarExperience({ dark = false, setDark = () => {}, clientView = false, store = null, clientName = '' }) {
  const live = !!store;
  const venue = (live && clientName) ? clientName : 'Marina Social Club';
  // The handle, monogram and bio were the demo restaurant's. On a real client we
  // derive what we can from their name and show nothing where we have no source,
  // rather than printing someone else's details on their review page.
  const handle = live ? venue.toLowerCase().replace(/[^a-z0-9]+/g, '') : 'marinasocialclub';
  const monogram = venue.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'TW';
  const [cursor, setCursor] = useState(() => parseCalendarMonth(new URLSearchParams(window.location.search).get('calendarMonth')));
  const [data, setData] = useState(() => loadCalendar(cursor, store));
  const [storageError, setStorageError] = useState(false);
  const [view, setView] = useState('month');
  const [clientLayout, setClientLayout] = useState(() => {
    const value = new URLSearchParams(window.location.search).get('clientLayout');
    return ['review', 'calendar', 'grid'].includes(value) ? value : 'review';
  });
  const [gridPreviewId, setGridPreviewId] = useState(null);
  const [gridPreviewSlide, setGridPreviewSlide] = useState(0);
  const [filter, setFilter] = useState('all');
  const [network, setNetwork] = useState('all');
  const [stage, setStage] = useState('calendar');
  const [selectedId, setSelectedId] = useState(null);
  const [slide, setSlide] = useState(0);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [chosen, setChosen] = useState([]);
  const [message, setMessage] = useState(data.message);
  const [access, setAccess] = useState('review');
  const [expiry, setExpiry] = useState('7');
  const [channel, setChannel] = useState('whatsapp');
  const [prepared, setPrepared] = useState(false);
  const [feedback, setFeedback] = useState('');
  const heading = useRef(null);
  const noteRef = useRef(null);
  const detailRef = useRef(null);
  const gridDialogRef = useRef(null);
  const gridSwipeStart = useRef(null);
  const lastGridTrigger = useRef(null);
  const rootRef = useRef(null);
  const lastPostTrigger = useRef(null);
  const bulkTrigger = useRef(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < 740));
    if (rootRef.current) observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    try { backingStore(store).setItem(storageKey(cursor), JSON.stringify(data)); setStorageError(false); }
    catch (_) { setStorageError(true); }
  }, [data, cursor]);
  useEffect(() => {
    const sync = event => { if (!store && event.key === storageKey(cursor)) setData(loadCalendar(cursor, store)); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [cursor]);
  useEffect(() => {
    if (selectedId) detailRef.current?.focus({ preventScroll: !clientView });
  }, [selectedId, clientView]);
  useEffect(() => {
    const shouldInert = confirmAll || (selectedId && !clientView) || (gridPreviewId && clientView);
    if (!shouldInert) return;
    const background = document.getElementById('root');
    const previous = background?.inert;
    if (background) background.inert = true;
    return () => { if (background) background.inert = previous; };
  }, [selectedId, confirmAll, gridPreviewId, clientView]);
  useEffect(() => {
    if (!gridPreviewId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [gridPreviewId]);
  useEffect(() => { if (!feedback) return; const timer = setTimeout(() => setFeedback(''), 5000); return () => clearTimeout(timer); }, [feedback]);

  const month = fmtMonth(cursor);
  const expired = data.expiresAt && data.expiresAt <= Date.now();
  const readOnly = data.access === 'view' || expired;
  const visiblePosts = clientView ? data.posts.filter(p => data.sharedIds.includes(p.id) && p.status !== 'draft') : data.posts;
  const pending = visiblePosts.filter(canReview);
  const approved = visiblePosts.filter(p => p.status === 'approved');
  const changes = visiblePosts.filter(p => p.status === 'changes');
  const filtered = visiblePosts.filter(p => (network === 'all' || p.platform === network) && (filter === 'all' || (filter === 'pending' ? canReview(p) : p.status === filter)));
  const selected = visiblePosts.find(p => p.id === selectedId);
  const shareUrl = `/?page=calendar&occasions=editorial&calendarView=client&calendarMonth=${monthKey(cursor)}`;
  const agencyUrl = `/?page=calendar&occasions=editorial&calendarMonth=${monthKey(cursor)}`;
  const fullShareUrl = `${window.location.origin}${shareUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(`${venue} · ${month} content review\n${message}\n${fullShareUrl}`)}`;
  const ready = data.posts.filter(p => p.status !== 'draft');

  function changeMonth(direction) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1);
    setCursor(next); setData(loadCalendar(next, store)); setFilter('all'); setSelectedId(null);
    const url = new URL(window.location.href); url.searchParams.set('calendarMonth', monthKey(next)); window.history.replaceState(null, '', url);
  }
  function jumpToCurrentMonth() {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), 1);
    setCursor(next); setData(loadCalendar(next, store)); setFilter('all'); setSelectedId(null);
    const url = new URL(window.location.href); url.searchParams.set('calendarMonth', monthKey(next)); window.history.replaceState(null, '', url);
  }
  function changeClientLayout(next) {
    setClientLayout(next); setSelectedId(null); setGridPreviewId(null); setRequesting(false); setSlide(0);
    const url = new URL(window.location.href); url.searchParams.set('clientLayout', next); window.history.replaceState(null, '', url);
  }
  function openPost(post, event) { if (!selectedId) lastPostTrigger.current = event.currentTarget; setSelectedId(post.id); setSlide(0); setNote(''); setNoteError(false); setRequesting(false); setEditCaption(post.caption); }
  function closePost() { setSelectedId(null); setRequesting(false); requestAnimationFrame(() => lastPostTrigger.current?.focus()); }
  function closeBulk() { setConfirmAll(false); requestAnimationFrame(() => (bulkTrigger.current?.isConnected ? bulkTrigger.current : heading.current)?.focus({ preventScroll: true })); }
  function decide(ids, decision, comment = '') {
    if (data.access === 'view' || (data.expiresAt && data.expiresAt <= Date.now())) { setFeedback('This preview is view only or expired. Return to the agency view to prepare a new review.'); return; }
    setData(state => reviewDecision(state, ids, decision, comment));
    setRequesting(false); if (confirmAll) closeBulk(); setNote('');
    setFeedback(decision === 'approved' ? 'Approval saved in this preview. Nothing will be published.' : 'Feedback saved. The agency can now revise this post.');
  }
  function startShare() { setChosen(ready.map(p => p.id)); setMessage(data.message); setAccess(data.access); setPrepared(false); setStage('share'); }
  async function copy(text, success) { try { await navigator.clipboard.writeText(text); setFeedback(success); } catch (_) { setFeedback('Copy was unavailable. Select and copy the text below.'); } }
  const shownView = compact ? 'agenda' : view;
  const summary = <div className="cal-summary" aria-label="Review progress">
    <span><strong>{visiblePosts.length}</strong> {clientView ? readOnly ? 'shared posts' : 'posts to review' : 'planned posts'}</span>
    <span><strong>{approved.length}</strong> approved</span><span><strong>{pending.length}</strong> awaiting review</span><span><strong>{changes.length}</strong> need changes</span>
    <div className="cal-progress" aria-label={`${approved.length} of ${visiblePosts.length} posts approved`}><span style={{ width: `${visiblePosts.length ? approved.length / visiblePosts.length * 100 : 0}%` }}/></div>
  </div>;
  const visualEdit = !!visiblePosts.length && <section className="cal-visual-edit" aria-labelledby="cal-visual-edit-title"><div className="cal-visual-edit-copy"><span>VISUAL RHYTHM</span><h2 id="cal-visual-edit-title">Four posts.<br/>One clear mood.</h2><p>Check colour, pace and variety before the client sees the month.</p><small>Open any tile to review the post.</small></div><div className="cal-visual-edit-frames">{visiblePosts.slice(0,4).map((post,index)=><button type="button" key={post.id} onClick={event=>openPost(post,event)} aria-label={`Open ${post.title}`}><Artwork live={live} post={post}/><span><Network platform={post.platform}/><strong>{post.title}</strong><small>{String(post.day).padStart(2,'0')} {cursor.toLocaleDateString('en',{month:'short'})}</small></span><i aria-hidden="true">0{index+1}</i></button>)}</div></section>;

  if (clientView) {
    const reviewPosts = clientLayout === 'grid' ? visiblePosts.filter(p => p.platform === 'ig' && (filter === 'all' || (filter === 'pending' ? canReview(p) : p.status === filter))) : filtered;
    const instagramPosts = clientLayout === 'grid' ? [...reviewPosts].sort((a, b) => b.day - a.day) : [];
    const gridPreview = visiblePosts.find(p => p.id === gridPreviewId && p.platform === 'ig') || null;
    const gridPreviewSlides = gridPreview?.format === 'Carousel' ? 3 : 1;
    const active = reviewPosts.find(p => p.id === selectedId) || reviewPosts.find(canReview) || reviewPosts[0] || null;
    const activeIndex = active ? reviewPosts.findIndex(p => p.id === active.id) : -1;
    const reviewedCount = visiblePosts.length - pending.length;
    const progressDegrees = visiblePosts.length ? Math.round(reviewedCount / visiblePosts.length * 360) : 0;
    const nextPending = active ? pending.find(p => p.id !== active.id) : pending[0];
    const selectPost = post => { setSelectedId(post.id); setSlide(0); setNote(''); setNoteError(false); setRequesting(false); };
    const openInReview = post => { setGridPreviewId(null); selectPost(post); setClientLayout('review'); const url = new URL(window.location.href); url.searchParams.set('clientLayout', 'review'); window.history.replaceState(null, '', url); setTimeout(() => detailRef.current?.focus(), 0); };
    const openGridPreview = (post, event) => { lastGridTrigger.current = event.currentTarget; setGridPreviewId(post.id); setGridPreviewSlide(0); setTimeout(() => gridDialogRef.current?.focus(), 0); };
    const closeGridPreview = () => { setGridPreviewId(null); setGridPreviewSlide(0); requestAnimationFrame(() => lastGridTrigger.current?.focus()); };
    const moveGridSlide = direction => setGridPreviewSlide(current => Math.max(0, Math.min(gridPreviewSlides - 1, current + direction)));
    const finishGridSwipe = event => {
      if (gridPreviewSlides < 2 || gridSwipeStart.current === null) return;
      const distance = event.clientX - gridSwipeStart.current;
      if (Math.abs(distance) > 42) moveGridSlide(distance < 0 ? 1 : -1);
      gridSwipeStart.current = null;
    };
    const movePost = direction => {
      const next = reviewPosts[activeIndex + direction];
      if (next) selectPost(next);
    };

    return <div ref={rootRef} className="tw-calendar-experience cal-client-page cal-client-review-page" data-calendar-theme={dark ? 'dark' : 'light'}>
      <div className="cal-client-previewbar"><span>{live?`${venue} · ${month}`:'Client preview · Sample content'}</span><a href={agencyUrl}><ArrowLeft size={14} aria-hidden="true"/>Exit client preview</a></div>
      <header className="cal-client-masthead">
        <div className="cal-client-identity"><span aria-hidden="true">{monogram}</span><div><strong>{venue}</strong><small>Private content review</small></div></div>
        <div className="cal-client-powered"><span>Prepared with</span><img src="/logo-transparent.png" alt=""/><strong>Tawaslo</strong><button type="button" aria-label={dark ? 'Use light theme' : 'Use dark theme'} onClick={() => setDark(!dark)}>{dark ? <Sun size={17}/> : <Moon size={17}/>}</button></div>
      </header>

      <main className="cal-client-review-main">
        <section className="cal-client-review-hero" aria-labelledby="cal-client-title">
          <div className="cal-client-hero-copy"><span>{month.toUpperCase()} · SOCIAL CALENDAR</span><h1 id="cal-client-title" ref={heading} tabIndex={-1}>Your month,<br/>ready for a final look.</h1><p>{data.message}</p><small>{expired ? 'This review link has expired. Ask your agency for a fresh link.' : readOnly ? 'This calendar is shared for viewing only.' : 'Your decision signs off this version. Publishing stays with your agency.'}</small></div>
          <div className="cal-client-progress-block">
            <div className="cal-client-progress-ring" style={{ '--client-progress': `${progressDegrees}deg` }} role="img" aria-label={`${reviewedCount} of ${visiblePosts.length} posts reviewed`}><span><strong>{reviewedCount}/{visiblePosts.length}</strong><small>reviewed</small></span></div>
            <p><strong>{pending.length ? `${pending.length} left for you` : 'Review complete'}</strong><span>{approved.length} approved · {changes.length} returned</span></p>
          </div>
        </section>

        <div className="cal-client-layoutbar">
          <div className="cal-client-layout-switch" role="group" aria-label="Choose how to view the calendar">
            <button aria-pressed={clientLayout === 'review'} onClick={() => changeClientLayout('review')}><Eye size={16} aria-hidden="true"/>Review</button>
            <button aria-pressed={clientLayout === 'calendar'} onClick={() => changeClientLayout('calendar')}><CalendarDays size={16} aria-hidden="true"/>Calendar</button>
            <button aria-pressed={clientLayout === 'grid'} onClick={() => changeClientLayout('grid')}><LayoutGrid size={16} aria-hidden="true"/>Grid</button>
          </div>
          <p>{clientLayout === 'review' ? 'Artwork, caption and approval together.' : clientLayout === 'calendar' ? 'Every shared channel on its proposed date.' : <><FaInstagram aria-hidden="true"/> Instagram posts only, arranged like the feed.</>}</p>
        </div>

        <div className="cal-client-filterbar" aria-label="Filter the content review">
          <div className="cal-client-filters">{[['all', 'All', clientLayout === 'grid' ? visiblePosts.filter(p => p.platform === 'ig').length : visiblePosts.length], ['pending', 'To review', clientLayout === 'grid' ? visiblePosts.filter(p => p.platform === 'ig' && canReview(p)).length : pending.length], ['approved', 'Approved', clientLayout === 'grid' ? visiblePosts.filter(p => p.platform === 'ig' && p.status === 'approved').length : approved.length], ['changes', 'Changes', clientLayout === 'grid' ? visiblePosts.filter(p => p.platform === 'ig' && p.status === 'changes').length : changes.length]].map(([key, text, count]) => <button key={key} aria-pressed={filter === key} onClick={() => { setFilter(key); setSelectedId(null); }}>{text}<span>{count}</span></button>)}</div>
          {clientLayout === 'grid' ? <span className="cal-client-instagram-only"><FaInstagram aria-hidden="true"/>Instagram only</span> : <label className="cal-client-network"><span className="cal-sr-only">Filter by network</span><select value={network} onChange={e => { setNetwork(e.target.value); setSelectedId(null); }}><option value="all">All networks</option>{Object.entries(CALENDAR_NETWORKS).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>}
        </div>

        {!active ? <div className="cal-client-empty"><h2>{clientLayout === 'grid' ? 'No Instagram posts here.' : 'Nothing in this view.'}</h2><p>Choose another status{clientLayout === 'grid' ? '' : ' or network'} to continue.</p><button className="cal-link" onClick={() => { setFilter('all'); setNetwork('all'); }}>Show all {clientLayout === 'grid' ? 'Instagram posts' : 'shared posts'} <ArrowRight size={16} aria-hidden="true"/></button></div> : clientLayout === 'review' ? <>
          <section className="cal-client-focus" aria-label={`Review ${active.title}`}>
            <div className="cal-client-creative-stage">
              <div className="cal-client-stage-top"><span>POST {String(activeIndex + 1).padStart(2, '0')} / {String(reviewPosts.length).padStart(2, '0')}</span><Status status={active.status}/></div>
              <div className={`cal-client-artwork cal-client-format-${active.format.toLowerCase()}`}><Artwork live={live} post={active} slide={slide}/></div>
              {active.format === 'Carousel' && <div className="cal-carousel-controls"><button aria-label="Previous slide" disabled={slide === 0} onClick={() => setSlide(slide - 1)}><ChevronLeft size={19}/></button><span>{slide + 1} / 3 slides</span><button aria-label="Next slide" disabled={slide === 2} onClick={() => setSlide(slide + 1)}><ChevronRight size={19}/></button></div>}
              {active.format === 'Reel' && <p className="cal-client-media-note">Reel cover shown · Video opens in the final review link.</p>}
            </div>

            <article className="cal-client-decision" ref={detailRef} tabIndex={-1}>
              <div className="cal-client-decision-nav"><span><Network platform={active.platform} label/> · {active.format} · Version {active.version}</span><div><button aria-label="Previous post" disabled={activeIndex <= 0} onClick={() => movePost(-1)}><ChevronLeft size={18}/></button><button aria-label="Next post" disabled={activeIndex >= reviewPosts.length - 1} onClick={() => movePost(1)}><ChevronRight size={18}/></button></div></div>
              <h2>{active.title}</h2>
              <p className="cal-client-date"><Clock size={15} aria-hidden="true"/>{dateLabel(cursor, active.day)} · {active.time} GMT+3</p>
              <div className="cal-client-caption"><span>CAPTION</span><p>{active.caption}</p></div>
              {active.notes.length > 0 && <div className="cal-client-conversation"><span>CONVERSATION</span>{active.notes.map((entry, i) => <div key={`${entry.author}-${i}`}><strong>{entry.author}</strong><p>{entry.text}</p></div>)}</div>}

              {readOnly ? <div className="cal-client-readonly"><Eye size={18} aria-hidden="true"/><p>{expired ? 'This review link has expired.' : 'This calendar is view only.'}</p></div> : canReview(active) ? <div className="cal-client-actions">{requesting ? <form onSubmit={e => { e.preventDefault(); if (!note.trim()) { setNoteError(true); noteRef.current?.focus(); return; } decide([active.id], 'changes', note); }}><label className="cal-field">What should we change?<textarea ref={noteRef} rows={4} maxLength={2000} value={note} onChange={e => { setNote(e.target.value); setNoteError(false); }} aria-invalid={noteError && !note.trim()} aria-describedby="cal-note-help" placeholder="Mention the visual, caption or date…"/></label><p id="cal-note-help" className={noteError && !note.trim() ? 'cal-error' : 'cal-helper'}>{noteError && !note.trim() ? 'Add a note so the team knows what to change.' : 'Your note stays attached to this post.'}</p><div className="cal-action-row"><button type="button" className="cal-button" onClick={() => { setRequesting(false); setNoteError(false); }}>Cancel</button><button className="cal-button cal-client-change" type="submit">Send changes</button></div></form> : <><div className="cal-client-action-copy"><strong>Ready to decide?</strong><span>You can revisit every decision before anything is published.</span></div><div className="cal-action-row"><button className="cal-button" onClick={() => { setRequesting(true); setTimeout(() => noteRef.current?.focus(), 0); }}><MessageSquare size={16} aria-hidden="true"/>Request changes</button><button className="cal-button cal-client-approve" onClick={() => decide([active.id], 'approved')}><Check size={17} aria-hidden="true"/>Approve this post</button></div><p className="cal-client-safe"><Check size={13} aria-hidden="true"/>Approval does not publish this post.</p></>}</div> : <div className={`cal-client-result cal-client-result-${active.status}`}><CheckCheck size={20} aria-hidden="true"/><div><strong>{active.status === 'approved' ? 'Approved by you' : 'Changes sent to the agency'}</strong><p>{active.status === 'approved' ? 'This version is signed off.' : 'The updated version will return here for another look.'}</p></div>{nextPending && <button className="cal-link" onClick={() => selectPost(nextPending)}>Next to review <ArrowRight size={16} aria-hidden="true"/></button>}</div>}
            </article>
          </section>

          <section className="cal-client-lineup" aria-labelledby="cal-client-lineup-title">
            <div><span>THE MONTH AT A GLANCE</span><h2 id="cal-client-lineup-title">Every post, in order.</h2><p>Select anything to bring it into the review stage.</p></div>
            <div className="cal-client-proofsheet">{reviewPosts.map((post, index) => <button type="button" key={post.id} className={post.id === active.id ? 'is-active' : ''} aria-label={`Review ${post.title}, ${CALENDAR_STATUS[post.status]}`} aria-pressed={post.id === active.id} onClick={() => selectPost(post)}><Artwork live={live} post={post} compact/><span><small>{String(post.day).padStart(2, '0')} {cursor.toLocaleDateString('en', { month: 'short' })}</small><strong>{post.title}</strong><Status status={post.status}/></span><i aria-hidden="true">{String(index + 1).padStart(2, '0')}</i></button>)}</div>
          </section>
        </> : clientLayout === 'calendar' ? <section className="cal-client-calendar-view" aria-labelledby="cal-client-calendar-title">
          <header><div><span>ALL SHARED CHANNELS</span><h2 id="cal-client-calendar-title">{month}</h2><p>Each post sits on its proposed publishing date.</p></div><div className="cal-client-calendar-legend"><span><i className="is-pending"/>To review</span><span><i className="is-approved"/>Approved</span><span><i className="is-changes"/>Changes</span></div></header>
          <div className="cal-client-month-grid" role="grid" aria-label={`${month} client content calendar`}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div className="cal-client-weekday" role="columnheader" key={day}>{day}</div>)}
            {calendarDays(cursor).map(date => { const inMonth = date.getMonth() === cursor.getMonth(); const dayPosts = inMonth ? reviewPosts.filter(p => p.day === date.getDate()) : []; return <div className={`cal-client-calendar-day ${inMonth ? '' : 'is-outside'}`} role="gridcell" aria-label={date.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })} key={date.toISOString()}><span className="cal-client-day-number">{date.getDate()}</span>{dayPosts.map(post => <button type="button" key={post.id} className={`cal-client-calendar-post is-${post.status}`} aria-label={`Review ${post.title}, ${CALENDAR_NETWORKS[post.platform]}, ${CALENDAR_STATUS[post.status]}`} onClick={() => openInReview(post)}><Artwork live={live} post={post} compact/><span><Network platform={post.platform}/><strong>{post.title}</strong><Status status={post.status}/></span></button>)}</div>; })}
          </div>
        </section> : <section className="cal-client-instagram-view" aria-labelledby="cal-client-grid-title">
          <header className="cal-client-instagram-head">
            <div className="cal-instagram-appbar"><FaInstagram aria-hidden="true"/><strong>Instagram feed preview</strong><span>{month}</span></div>
            <div className="cal-client-instagram-profile">
              <div className="cal-instagram-avatar" aria-hidden="true"><span>MS</span></div>
              <div className="cal-instagram-profile-main">
                <div className="cal-instagram-account-row"><h2 id="cal-client-grid-title">{handle}</h2><span>Feed preview</span></div>
                <div className="cal-instagram-stats" aria-label={`${instagramPosts.length} posts, 12.8 thousand followers, 248 following`}>
                  <span><strong>{instagramPosts.length}</strong><small>posts</small></span>
                  <span><strong>12.8K</strong><small>followers</small></span>
                  <span><strong>248</strong><small>following</small></span>
                </div>
                <div className="cal-instagram-bio cal-instagram-bio-desktop"><strong>{venue}</strong>{live?null:<span>Restaurant</span>}{live?null:<><p>Dining by the water<br/>Lunch, golden hour and everything after.</p><a href="#cal-client-grid">marinasocialclub.com</a></>}</div>
              </div>
            </div>
            <div className="cal-instagram-bio cal-instagram-bio-mobile"><strong>{venue}</strong>{live?null:<span>Restaurant</span>}{live?null:<><p>Dining by the water<br/>Lunch, golden hour and everything after.</p><a href="#cal-client-grid">marinasocialclub.com</a></>}</div>
            <div className="cal-instagram-highlights" aria-label="Instagram story highlights">
              <span><i className="is-menu">MENU</i><small>Menu</small></span>
              <span><i className="is-view">MSC</i><small>The view</small></span>
              <span><i className="is-events">RSVP</i><small>Events</small></span>
            </div>
            <p className="cal-instagram-helper">Instagram only · Newest posts appear first. Tap any tile to open its caption and approval.</p>
            <div className="cal-instagram-tabs" aria-label="Instagram profile sections">
              <span className="is-active"><Grid3X3 size={18} aria-hidden="true"/><small>Posts</small></span>
              <span><Film size={18} aria-hidden="true"/><small>Reels</small></span>
              <span><UserRound size={18} aria-hidden="true"/><small>Tagged</small></span>
            </div>
          </header>
          <div id="cal-client-grid" className="cal-client-instagram-grid">{instagramPosts.map(post => <button type="button" key={post.id} className={`cal-instagram-tile is-${post.status}`} aria-label={`View ${post.title}, ${post.format}, ${CALENDAR_STATUS[post.status]}`} onClick={event => openGridPreview(post, event)}><Artwork live={live} post={post}/>{post.format === 'Carousel' && <span className="cal-instagram-media-mark" title="Carousel"><Layers2 size={18} aria-hidden="true"/></span>}{post.format === 'Reel' && <span className="cal-instagram-media-mark" title="Reel"><Film size={18} aria-hidden="true"/></span>}<span className="cal-instagram-state" title={CALENDAR_STATUS[post.status]}>{post.status === 'approved' ? <Check size={11} aria-hidden="true"/> : post.status === 'changes' ? <MessageSquare size={10} aria-hidden="true"/> : <Eye size={11} aria-hidden="true"/>}</span><span className="cal-instagram-hover"><Eye size={20} aria-hidden="true"/><strong>View post</strong><small>{CALENDAR_STATUS[post.status]}</small></span></button>)}</div>
        </section>}

        <section className="cal-client-finish cal-client-review-finish"><div><span>WHEN YOU ARE READY</span><h2>{readOnly ? expired ? 'This link is no longer active.' : 'Everything is here to view.' : pending.length ? `${pending.length} post${pending.length === 1 ? '' : 's'} still need a decision.` : changes.length ? 'Your feedback is with the agency.' : 'You’re all caught up.'}</h2><p>{readOnly ? 'Contact your agency if you need to respond.' : pending.length ? 'Review them one by one, or approve the remaining versions together.' : changes.length ? 'Revised posts will return to this same private link.' : 'Every shared post has a decision. Thank you.'}</p></div>{!readOnly && pending.length > 0 && <button className="cal-button cal-client-approve-all" onClick={e => { bulkTrigger.current = e.currentTarget; setConfirmAll(true); }}><CheckCheck size={17} aria-hidden="true"/>Approve remaining {pending.length}</button>}</section>
        <footer className="cal-footer cal-client-review-footer"><span>Private review for {venue}</span><span>Powered by Tawaslo · Nothing publishes from this page</span></footer>
      </main>
      <div className="cal-feedback" role="status">{feedback}</div>
      {gridPreview && createPortal(<div className="tw-calendar-experience cal-instagram-modal-root" data-calendar-theme={dark ? 'dark' : 'light'}>
        <div className="cal-instagram-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) closeGridPreview(); }}>
          <section className="cal-instagram-post-dialog" ref={gridDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="cal-instagram-post-title" onKeyDown={event => {
            if (event.key === 'Escape') closeGridPreview();
            if (event.key === 'ArrowLeft' && gridPreviewSlides > 1) moveGridSlide(-1);
            if (event.key === 'ArrowRight' && gridPreviewSlides > 1) moveGridSlide(1);
            if (event.key === 'Tab') { const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled)')]; if (!controls.length) return; if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls[controls.length - 1].focus(); } else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) { event.preventDefault(); controls[0].focus(); } }
          }}>
            <button autoFocus type="button" className="cal-instagram-modal-close" aria-label="Close Instagram post" onClick={closeGridPreview}><X size={22} aria-hidden="true"/></button>
            <header className="cal-instagram-mobile-postbar">
              <span className="cal-instagram-mini-avatar" aria-hidden="true">{monogram}</span>
              <div><strong>{handle}</strong><small>{venue}</small></div>
              <MoreHorizontal size={20} aria-hidden="true"/>
            </header>
            <div className="cal-instagram-post-media" onPointerDown={event => { gridSwipeStart.current = event.clientX; }} onPointerUp={finishGridSwipe} onPointerCancel={() => { gridSwipeStart.current = null; }}>
              <Artwork live={live} post={gridPreview} slide={gridPreviewSlide}/>
              {gridPreviewSlides > 1 && <>
                <span className="cal-instagram-slide-count" aria-live="polite">{gridPreviewSlide + 1}/{gridPreviewSlides}</span>
                {gridPreviewSlide > 0 && <button type="button" className="cal-instagram-slide-arrow is-previous" aria-label="Previous carousel slide" onClick={() => moveGridSlide(-1)}><ChevronLeft size={21} aria-hidden="true"/></button>}
                {gridPreviewSlide < gridPreviewSlides - 1 && <button type="button" className="cal-instagram-slide-arrow is-next" aria-label="Next carousel slide" onClick={() => moveGridSlide(1)}><ChevronRight size={21} aria-hidden="true"/></button>}
                <div className="cal-instagram-slide-dots" aria-hidden="true">{Array.from({ length:gridPreviewSlides }, (_, index) => <i className={index === gridPreviewSlide ? 'is-active' : ''} key={index}/>)}</div>
                <p className="cal-instagram-swipe-hint">Swipe or use the arrows</p>
              </>}
            </div>
            <article className="cal-instagram-post-panel">
              <header><span className="cal-instagram-mini-avatar" aria-hidden="true">{monogram}</span><div><strong>{handle}</strong><small>{venue}</small></div><MoreHorizontal size={20} aria-hidden="true"/></header>
              <div className="cal-instagram-post-copy">
                <div><span className="cal-instagram-mini-avatar" aria-hidden="true">{monogram}</span><p><strong id="cal-instagram-post-title">{handle}</strong> {gridPreview.caption}</p></div>
                {gridPreview.notes.map((entry, index) => <div className="cal-instagram-comment" key={`${entry.author}-${index}`}><span aria-hidden="true">{entry.author === 'Client' ? 'CL' : 'TW'}</span><p><strong>{entry.author}</strong> {entry.text}</p></div>)}
                <time>{dateLabel(cursor, gridPreview.day)} · {gridPreview.time}</time>
              </div>
              <footer>
                <div className="cal-instagram-native-actions" aria-hidden="true"><Heart/><MessageCircle/><Send/><Bookmark/></div>
                <div className="cal-instagram-review-state"><Status status={gridPreview.status}/><span>{gridPreview.format}{gridPreviewSlides > 1 ? ` · ${gridPreviewSlides} slides` : ''}</span></div>
                <button type="button" className="cal-instagram-open-review" onClick={() => openInReview(gridPreview)}>{readOnly ? 'View full post' : 'Review and approve'}<ArrowRight size={16} aria-hidden="true"/></button>
              </footer>
            </article>
          </section>
        </div>
      </div>, document.body)}
      {confirmAll && createPortal(<div className="tw-calendar-experience cal-modal-root" data-calendar-theme={dark ? 'dark' : 'light'}><div className="cal-confirm-backdrop"><div role="alertdialog" aria-modal="true" aria-labelledby="cal-confirm-title" className="cal-confirm" onKeyDown={e => { if (e.key === 'Escape') closeBulk(); if (e.key === 'Tab') { const controls = e.currentTarget.querySelectorAll('button'); if (e.shiftKey && document.activeElement === controls[0]) { e.preventDefault(); controls[1].focus(); } else if (!e.shiftKey && document.activeElement === controls[1]) { e.preventDefault(); controls[0].focus(); } } }}><CheckCheck size={28} aria-hidden="true"/><h2 id="cal-confirm-title">Approve {pending.length} remaining posts?</h2><p>This signs off their current visuals, captions and dates. Nothing will publish from this review.</p><div className="cal-action-row"><button autoFocus className="cal-button" onClick={closeBulk}>Keep reviewing</button><button className="cal-button cal-primary" onClick={() => decide(pending.map(p => p.id), 'approved')}>Confirm approval</button></div></div></div></div>, document.body)}
    </div>;
  }

  return <div ref={rootRef} className="tw-calendar-experience cal-agency-page" data-calendar-theme={dark ? 'dark' : 'light'}>
    <div className="cal-preview-notice"><span>{live?`${venue} · Scheduling saves to your workspace`:`Design preview · Sample content · ${storageError ? 'Changes last for this visit only' : 'Changes stay in this browser'}`}</span>{clientView ? <a href={agencyUrl}><ArrowLeft size={14} aria-hidden="true"/>Agency view</a> : <button type="button" onClick={() => setDark(!dark)} aria-label={dark ? 'Use light calendar theme' : 'Use dark calendar theme'}>{dark ? <Sun size={16}/> : <Moon size={16}/>}</button>}</div>
    {clientView && <div className="cal-client-brand"><a href={agencyUrl} aria-label="Return to agency preview"><img src="/logo-transparent.png" alt="Tawaslo"/>Tawaslo</a><span>Prepared for {venue}</span><button type="button" aria-label={dark ? 'Use light calendar theme' : 'Use dark calendar theme'} onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button></div>}
    <header className="cal-heading">
      <div><p className="cal-eyebrow">{`${(live ? venue : 'Marina Social Club').toUpperCase()} / ${clientView ? 'CLIENT REVIEW' : 'CALENDAR'}`}</p><h1 ref={heading} tabIndex={-1}>{stage === 'share' ? 'A thoughtful handoff.' : clientView ? 'Your month, ready to review.' : 'The month in view.'}</h1><p className="cal-intro">{stage === 'share' ? 'Choose the content. Add a note. See exactly what your client receives.' : clientView ? 'Check each visual, caption and date. Approve what you love. Tell us what to change.' : 'See the content, follow the feedback, and keep the whole month moving.'}</p></div>
      {!clientView && stage === 'calendar' && <div className="cal-heading-actions"><a className="cal-link" href={shareUrl}><Eye size={16} aria-hidden="true"/>Client view</a><button className="cal-button cal-primary" onClick={startShare}><Send size={16} aria-hidden="true"/>Share for review</button></div>}
    </header>
    <div className="cal-feedback" role="status">{feedback}</div>

    {stage === 'share' ? <>
      <button className="cal-link cal-back" onClick={() => { setStage('calendar'); setPrepared(false); }}><ArrowLeft size={16} aria-hidden="true"/>Back to calendar</button>
      <div className="cal-share-layout">
        <section><div className="cal-section-title"><span>01 / CONTENT</span><h2>{month}</h2><p>{chosen.length} of {ready.length} ready posts selected. Drafts stay private.</p></div>
          <div className="cal-select-actions"><button className="cal-link" onClick={() => { setChosen(ready.map(p => p.id)); setPrepared(false); }}>Select all ready</button><button className="cal-link" onClick={() => { setChosen([]); setPrepared(false); }}>Clear selection</button></div>
          <div className="cal-share-posts">{ready.map(p => <label key={p.id}><input type="checkbox" checked={chosen.includes(p.id)} onChange={e => { setChosen(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id)); setPrepared(false); }}/><Artwork live={live} post={p} compact/><span><strong>{p.title}</strong><small>{p.day} {cursor.toLocaleDateString('en', { month: 'short' })} · {CALENDAR_NETWORKS[p.platform]}</small><Status status={p.status}/></span></label>)}</div>
        </section>
        <section className="cal-share-options"><div className="cal-section-title"><span>02 / THE HANDOFF</span><h2>Make it personal.</h2><p>The client only sees the posts you select, never your workspace.</p></div>
          <label className="cal-field">Your note<textarea rows={4} value={message} maxLength={1200} onChange={e => { setMessage(e.target.value); setPrepared(false); }}/></label>
          <div className="cal-fields"><label className="cal-field">Client can<select value={access} onChange={e => { setAccess(e.target.value); setPrepared(false); }}><option value="review">Approve and request changes</option><option value="view">View only</option></select></label><label className="cal-field">Link expires after<select value={expiry} onChange={e => { setExpiry(e.target.value); setPrepared(false); }}><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label></div>
          <div className="cal-receipt"><div className="cal-section-title"><span>03 / WHAT THEY RECEIVE</span></div><div className="cal-tabs"><button aria-pressed={channel === 'whatsapp'} onClick={() => setChannel('whatsapp')}><FaWhatsapp aria-hidden="true"/>WhatsApp</button><button aria-pressed={channel === 'email'} onClick={() => setChannel('email')}><Mail size={16} aria-hidden="true"/>Email</button></div>
            <div className="cal-message-preview">{channel === 'email' && <strong>Subject: {venue} · {month} content review</strong>}<p>Hi, your {month} calendar is ready.</p><p>{message}</p><span>{chosen.length} posts · {access === 'review' ? 'Approval requested' : 'View only'} · Link lasts {expiry} days</span><p className="cal-message-link">Open your content calendar ↗</p></div>
          </div>
          <p className="cal-helper">{live?'The link opens the client review page for the posts you picked. Send it yourself \u2014 nothing is sent from here.':'This is a local rehearsal. No message is sent and no public link is created.'}</p>
          {!prepared ? <button className="cal-button cal-primary cal-full" disabled={!chosen.length} onClick={() => { setData(state => createReviewRound(state, chosen, message, access, expiry)); setPrepared(true); setFeedback('Client preview prepared. Nothing was sent.'); }}>Prepare client preview <ArrowRight size={16} aria-hidden="true"/></button> : <div className="cal-prepared"><p><CheckCheck size={18} aria-hidden="true"/>Your preview is ready.</p><a className="cal-button cal-primary cal-full" href={shareUrl}>Open as the client <ArrowRight size={16} aria-hidden="true"/></a><a className="cal-button cal-whatsapp cal-full" href={whatsappShareUrl} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true"/>Share to WhatsApp</a><button className="cal-link" onClick={() => copy(fullShareUrl, 'Local preview link copied. It works only on this computer.')}>Copy local preview link</button><label className="cal-field">Local preview link<input readOnly value={fullShareUrl}/></label></div>}
        </section>
      </div>
    </> : <>
      {clientView && <div className="cal-client-note"><span>A NOTE FROM YOUR AGENCY</span><p>{data.message}</p><small>{expired ? 'This preview link has expired. Ask your agency for a new link.' : data.access === 'view' ? 'View-only calendar. Approval controls are not enabled.' : 'Your approval signs off this version only. Publishing is handled separately.'}</small></div>}
      {summary}
      <section className="cal-board" aria-label="Content calendar">
        <div className="cal-toolbar"><div className="cal-month"><h2>{month}</h2>{!clientView && <div><button className="cal-today" onClick={jumpToCurrentMonth}>Today</button><button aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft size={19}/></button><button aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={19}/></button></div>}</div><div className="cal-toolbar-tools"><span className="cal-timezone"><Clock size={13} aria-hidden="true"/>Workspace time · UTC</span>{!compact && <div className="cal-tabs"><button aria-pressed={view === 'month'} onClick={() => setView('month')}><LayoutGrid size={15} aria-hidden="true"/>Month</button><button aria-pressed={view === 'agenda'} onClick={() => setView('agenda')}><List size={15} aria-hidden="true"/>Agenda</button></div>}</div></div>
        <div className="cal-filterbar"><div className="cal-tabs cal-status-tabs" aria-label="Filter by review status">{[['all', 'All posts'], ['pending', 'Awaiting review'], ['approved', 'Approved'], ['changes', 'Changes']].map(([key, text]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{text}</button>)}</div><label className="cal-network-filter"><span className="cal-sr-only">Filter network</span><select value={network} onChange={e => setNetwork(e.target.value)}><option value="all">All networks</option>{Object.entries(CALENDAR_NETWORKS).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label></div>
        {filtered.length === 0 ? <div className="cal-empty"><h3>No posts in this view.</h3><p>Try another network or review status.</p><button className="cal-link" onClick={() => { setNetwork('all'); setFilter('all'); }}>Show all posts <ArrowRight size={16} aria-hidden="true"/></button></div> : shownView === 'month' ? <div className="cal-grid" aria-label={`${month} calendar`}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div className="cal-weekday" key={day}>{day}</div>)}
          {calendarDays(cursor).map(date => { const inMonth = date.getMonth() === cursor.getMonth(); const dayPosts = inMonth ? filtered.filter(p => p.day === date.getDate()) : []; return <div className={`cal-day ${inMonth ? '' : 'cal-outside'}`} key={date.toISOString()}><span className="cal-day-number">{date.getDate()}</span>{dayPosts.map(p => <button className="cal-post-tile" key={p.id} onClick={e => openPost(p, e)} aria-label={`${dateLabel(cursor, p.day)}, ${p.title}, ${CALENDAR_NETWORKS[p.platform]}, ${CALENDAR_STATUS[p.status]}`}><Artwork live={live} post={p} compact/><span className="cal-tile-meta"><Network platform={p.platform}/>{p.time}<span>{p.format}</span></span><strong>{p.title}</strong><Status status={p.status}/></button>)}</div>; })}
        </div> : <div className="cal-agenda">{filtered.map(p => <button className="cal-agenda-post" key={p.id} onClick={e => openPost(p, e)} aria-label={`${p.title}, ${CALENDAR_STATUS[p.status]}`}><span className="cal-agenda-date"><strong>{String(p.day).padStart(2, '0')}</strong><span>{new Date(cursor.getFullYear(), cursor.getMonth(), p.day).toLocaleDateString('en', { weekday: 'short' })}</span></span><Artwork live={live} post={p} compact/><span className="cal-agenda-content"><span className="cal-tile-meta"><Network platform={p.platform} label/> · {p.format} · {p.time}</span><strong>{p.title}</strong><span className="cal-agenda-caption">{p.caption}</span><Status status={p.status}/></span><ArrowRight className="cal-agenda-arrow" size={18} aria-hidden="true"/></button>)}</div>}
      </section>
      {visualEdit}
      {clientView ? <div className="cal-client-finish"><div>
        <h2>{readOnly ? expired ? 'This review link has expired.' : 'Your month, in one place.' : pending.length ? `${pending.length} posts still need your review.` : changes.length ? 'Your feedback is with the agency.' : 'You’re all caught up.'}</h2>
        <p>{readOnly ? 'Contact your agency if you need to make a decision or request an update.' : pending.length ? 'Open a post to check every detail, or approve all remaining posts together.' : changes.length ? 'Updated posts will return here for another look.' : 'Every shared post has been reviewed. Thank you.'}</p>
      </div>{!readOnly && pending.length > 0 && <button className="cal-button cal-primary" onClick={e => { bulkTrigger.current = e.currentTarget; setConfirmAll(true); }}><CheckCheck size={17} aria-hidden="true"/>Approve remaining ({pending.length})</button>}</div> : <section className="cal-bottom"><div className="cal-review-panel"><div className="cal-panel-heading"><span className="cal-eyebrow">CLIENT REVIEW</span><strong aria-label={`${changes.length} posts need attention`}>{changes.length}</strong></div><h2>{changes.length ? `${changes.length} post${changes.length === 1 ? '' : 's'} need${changes.length === 1 ? 's' : ''} your eye.` : 'Everything is moving.'}</h2><p>{changes.length ? 'Open the feedback, revise the post, then return it to the client.' : 'There is no client feedback waiting for you right now.'}</p>{changes.length ? changes.map(p => <button className="cal-feedback-row" key={p.id} onClick={e => openPost(p, e)}><MessageSquare size={17} aria-hidden="true"/><span><strong>{p.title}</strong><small>{p.notes.filter(n => n.kind === 'changes').slice(-1)[0]?.text}</small></span><ArrowRight size={17} aria-hidden="true"/></button>) : <div className="cal-panel-empty"><CheckCheck size={18} aria-hidden="true"/>Nothing needs revising.</div>}</div><div className="cal-activity-panel"><div className="cal-panel-heading"><span className="cal-eyebrow">RECENT ACTIVITY</span><small>Latest decisions</small></div>{data.activity.length ? <ol className="cal-activity">{data.activity.slice(0, 4).map((event, i) => <li key={i}><span>{event.text}</span><time>{new Date(event.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</time></li>)}</ol> : <p>Client decisions and new review rounds will appear here as you test the flow.</p>}<a className="cal-link" href={shareUrl}>Open the client view <ArrowRight size={16} aria-hidden="true"/></a></div></section>}
      <footer className="cal-footer"><img src="/logo-transparent.png" alt=""/><span>{clientView ? 'Powered by Tawaslo' : (live ? `${venue} · ${month}` : 'Sample creative for Marina Social Club')}</span><span>{live ? 'Publishing happens in Publisher. Nothing publishes from this page.' : 'Preview only. No posts will publish.'}</span></footer>
    </>}

    {selected && createPortal(<div className="tw-calendar-experience cal-modal-root" data-calendar-theme={dark ? 'dark' : 'light'}><div className="cal-dialog-backdrop" onClick={e => { if (e.target === e.currentTarget) closePost(); }}><div className="cal-post-dialog" role="dialog" aria-modal="true" aria-labelledby="cal-post-title" tabIndex={-1} ref={detailRef} onKeyDown={e => {
      if (e.key === 'Escape') { e.stopPropagation(); closePost(); }
      if (e.key === 'Tab') { const controls = [...e.currentTarget.querySelectorAll('button:not(:disabled),a[href],input,textarea,select')].filter(el => el.getClientRects().length); const first = controls[0], last = controls[controls.length - 1]; if (e.shiftKey && (document.activeElement === first || document.activeElement === e.currentTarget)) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    }}><div className="cal-detail-top"><button className="cal-link" onClick={closePost}><ArrowLeft size={17} aria-hidden="true"/>Back to calendar</button><Status status={selected.status}/></div><div className="cal-detail-grid"><div><div className={`cal-post-artwork cal-format-${selected.format.toLowerCase()}`}><Artwork live={live} post={selected} slide={slide}/></div>{selected.format === 'Carousel' && <div className="cal-carousel-controls"><button aria-label="Previous slide" disabled={slide === 0} onClick={() => setSlide(slide - 1)}><ChevronLeft size={19}/></button><span>{slide + 1} / 3 slides</span><button aria-label="Next slide" disabled={slide === 2} onClick={() => setSlide(slide + 1)}><ChevronRight size={19}/></button></div>}{selected.format === 'Reel' && <p className="cal-helper">{live?(selected.image?'The cover attached to this post.':'This Reel has no cover yet. Add one in Publisher or Media.'):'Sample Reel cover. No video attached in this design preview.'}</p>}</div><section className="cal-detail-copy"><div className="cal-tile-meta"><Network platform={selected.platform} label/> · {selected.format} · Version {selected.version}</div><h2 id="cal-post-title">{selected.title}</h2><p className="cal-proposed-date"><Clock size={15} aria-hidden="true"/>{dateLabel(cursor, selected.day)} · {selected.time} GMT+3</p><h3>Caption</h3><p className="cal-caption">{selected.caption}</p>
      {selected.notes.length > 0 && <div className="cal-comments"><h3>Conversation</h3>{selected.notes.map((entry, i) => <div key={i}><strong>{entry.author}</strong><p>{entry.text}</p></div>)}</div>}
      {clientView ? readOnly ? <p className="cal-helper">{expired ? 'This link has expired.' : 'This calendar is view only.'}</p> : canReview(selected) ? <div className="cal-review-actions">{requesting ? <form onSubmit={e => { e.preventDefault(); if (!note.trim()) { setNoteError(true); noteRef.current?.focus(); return; } decide([selected.id], 'changes', note); }}><label className="cal-field">What would you like changed?<textarea ref={noteRef} rows={4} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} aria-invalid={noteError && !note.trim()} aria-describedby="cal-note-help" placeholder="Tell the agency what to adjust…"/></label><p id="cal-note-help" className={noteError && !note.trim() ? 'cal-error' : 'cal-helper'}>{noteError && !note.trim() ? 'Add a note so your agency knows what to change.' : 'Be specific about the visual, caption or proposed date.'}</p><div className="cal-action-row"><button type="button" className="cal-button" onClick={() => setRequesting(false)}>Cancel</button><button className="cal-button cal-primary" type="submit">Request changes</button></div></form> : <div className="cal-action-row"><button className="cal-button" onClick={() => { setRequesting(true); setTimeout(() => noteRef.current?.focus(), 0); }}><MessageSquare size={16} aria-hidden="true"/>Request changes</button><button className="cal-button cal-primary" onClick={() => decide([selected.id], 'approved')}><Check size={17} aria-hidden="true"/>Approve post</button></div>}<p className="cal-helper">Approval does not publish this post.</p></div> : <div className="cal-decision-result"><CheckCheck size={20} aria-hidden="true"/><p>{selected.status === 'approved' ? 'You approved this version.' : 'Your changes have been requested.'}</p>{pending.length > 0 && <button className="cal-link" onClick={e => openPost(pending[0], e)}>Review next post <ArrowRight size={16} aria-hidden="true"/></button>}</div> : selected.status === 'changes' ? <form className="cal-revision-form" onSubmit={e => { e.preventDefault(); setData(state => revisePost(state, selected.id, editCaption)); setFeedback('New version ready in the client preview. No notification was sent.'); }}><label className="cal-field">Revise the caption<textarea value={editCaption} onChange={e => setEditCaption(e.target.value)} rows={5} required/></label><button className="cal-button cal-primary" disabled={!editCaption.trim() || editCaption.trim() === selected.caption.trim()}>Save revision for review <ArrowRight size={16} aria-hidden="true"/></button><p className="cal-helper">Try the client view to approve the updated version.</p></form> : <p className="cal-helper">{selected.status === 'draft' ? 'Drafts stay private and are excluded from client review.' : 'Open Client view to test approving this post or requesting a change.'}</p>}
    </section></div></div></div></div>, document.body)}
    {confirmAll && createPortal(<div className="tw-calendar-experience cal-modal-root" data-calendar-theme={dark ? 'dark' : 'light'}><div className="cal-confirm-backdrop"><div role="alertdialog" aria-modal="true" aria-labelledby="cal-confirm-title" className="cal-confirm" onKeyDown={e => { if (e.key === 'Escape') closeBulk(); if (e.key === 'Tab') { const controls = e.currentTarget.querySelectorAll('button'); if (e.shiftKey && document.activeElement === controls[0]) { e.preventDefault(); controls[1].focus(); } else if (!e.shiftKey && document.activeElement === controls[1]) { e.preventDefault(); controls[0].focus(); } } }}><CheckCheck size={28} aria-hidden="true"/><h2 id="cal-confirm-title">Approve {pending.length} remaining posts?</h2><p>This signs off their current visuals, captions and dates. Posts with requested changes stay unchanged. Nothing will publish.</p><div className="cal-action-row"><button autoFocus className="cal-button" onClick={closeBulk}>Keep reviewing</button><button className="cal-button cal-primary" onClick={() => decide(pending.map(p => p.id), 'approved')}>Confirm approval</button></div></div></div></div>, document.body)}
  </div>;
}
