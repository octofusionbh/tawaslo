import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Clock, Edit3, Eye, LayoutGrid, List, MessageSquare, Moon, Plus, Search, Sun, X } from 'lucide-react';
import { FaInstagram, FaFacebook, FaLinkedin, FaTiktok } from 'react-icons/fa';
import { Artwork } from './CalendarExperience';
import { CALENDAR_NETWORKS, monthKey, parseCalendarMonth } from './calendarPreviewModel';
import { PLANNER_ARTWORK, PLANNER_FORMATS, PLANNER_STAGES, commitPlannerChange, plannerStage, plannerStorageKey, plannerWeeks, readPlannerMonth, readyPlannerPost, savePlannerPost } from './plannerPreviewModel';
import { canPublishOnWeb } from './workspaceResponsive';
import './planner-experience.css';

const NETWORK_ICONS = { ig: FaInstagram, fb: FaFacebook, li: FaLinkedin, tt: FaTiktok };
const formatMonth = date => date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const postDate = (cursor, day) => new Date(cursor.getFullYear(),cursor.getMonth(),day).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
const editFields = post => ({ title:post.title,caption:post.caption,day:post.day,time:post.time,platform:post.platform,format:post.format,art:post.art });
function Network({ platform, full = false }) { const Icon = NETWORK_ICONS[platform]; return <span className="pl-network"><Icon aria-hidden="true"/>{full && CALENDAR_NETWORKS[platform]}</span>; }
function Stage({ post, data }) { const stage = plannerStage(post,data); return <span className={`pl-stage pl-stage-${stage}`}><span aria-hidden="true"/>{stage === 'draft' ? 'Draft' : stage === 'review' && post.status === 'revised' ? 'Updated for review' : PLANNER_STAGES[stage]}</span>; }
const countPosts = count => `${count} ${count === 1 ? 'post' : 'posts'}`;

export default function PlannerExperience({ dark = false, setDark = () => {}, mobileWeb = false, store = null, live = false, clientName = '' }) {
  // `store` swaps the browser-storage backing for the workspace's real posts.
  // The model only needs getItem/setItem, so the calling side can persist
  // wherever it likes while this screen stays unchanged.
  const [cursor,setCursor] = useState(() => parseCalendarMonth(new URLSearchParams(window.location.search).get('plannerMonth')));
  const [loaded,setLoaded] = useState(() => readPlannerMonth(cursor, store));
  const data = loaded.data;
  const [view,setView] = useState('list');
  const [stage,setStage] = useState('all');
  const [network,setNetwork] = useState('all');
  const [week,setWeek] = useState('all');
  const [query,setQuery] = useState('');
  const [notice,setNotice] = useState('');
  const [detail,setDetail] = useState(null);
  const [editing,setEditing] = useState(false);
  const [draft,setDraft] = useState(null);
  const [original,setOriginal] = useState(null);
  const [baseline,setBaseline] = useState(null);
  const [error,setError] = useState('');
  const [discard,setDiscard] = useState(false);
  const [slide,setSlide] = useState(0);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const headingRef = useRef(null);
  const resultsRef = useRef(null);
  const editingAllowed = !mobileWeb && !loaded.error;
  const dirty = editing && draft && JSON.stringify(draft) !== JSON.stringify(original);
  const weeks = plannerWeeks(cursor);
  const chosenWeek = weeks.find(item => item.key === week);
  const counts = Object.fromEntries(Object.keys(PLANNER_STAGES).map(key => [key, key === 'all' ? data.posts.length : data.posts.filter(p => plannerStage(p,data) === key).length]));
  const sorted = [...data.posts].sort((a,b) => a.day-b.day || a.time.localeCompare(b.time));
  const visualRun = sorted.slice(0,4);
  const filtered = sorted.filter(p => (stage === 'all' || plannerStage(p,data) === stage) && (network === 'all' || p.platform === network) && (!chosenWeek || (p.day >= chosenWeek.first && p.day <= chosenWeek.last)) && `${p.title} ${p.caption}`.toLowerCase().includes(query.trim().toLowerCase()));
  const feedbackPosts = sorted.filter(p => p.status === 'changes');
  const draftPosts = sorted.filter(p => p.status === 'draft');
  const calendarUrl = `/?page=calendar&occasions=editorial&calendarMonth=${monthKey(cursor)}`;
  const selectedPost = detail === 'new' ? null : data.posts.find(p => p.id === detail);
  const previewPost = editing && draft ? { ...draft, title: draft.title || 'Your next post' } : selectedPost;

  useEffect(() => {
    const sync = event => { if (event.key === plannerStorageKey(cursor)) setLoaded(readPlannerMonth(cursor, store)); };
    window.addEventListener('storage',sync);
    return () => window.removeEventListener('storage',sync);
  },[cursor]);
  useEffect(() => {
    if (!detail) return;
    const background = document.getElementById('root'), previous = background?.inert;
    if (background) background.inert = true;
    dialogRef.current?.focus();
    return () => { if (background) background.inert = previous; };
  },[detail]);
  useEffect(() => {
    const warn = event => { if (dirty) { event.preventDefault();event.returnValue=''; } };
    window.addEventListener('beforeunload',warn);
    return () => window.removeEventListener('beforeunload',warn);
  },[dirty]);
  useEffect(() => {
    if (!detail) return;
    if (editing && editingAllowed) dialogRef.current?.querySelector('input')?.focus();
    else dialogRef.current?.focus();
  },[editing,editingAllowed,detail]);

  function changeMonth(direction) {
    const next = direction === 0 ? new Date(new Date().getFullYear(),new Date().getMonth(),1) : new Date(cursor.getFullYear(),cursor.getMonth()+direction,1);
    setCursor(next);setLoaded(readPlannerMonth(next));setWeek('all');setStage('all');setQuery('');setNotice('');
    const url = new URL(window.location.href);url.searchParams.set('plannerMonth',monthKey(next));window.history.replaceState(window.history.state,'',url);
  }
  function openPost(post,event) {
    setNotice('');
    triggerRef.current=event.currentTarget;setDetail(post.id);setEditing(false);setDraft(editFields(post));setOriginal(editFields(post));setError('');setDiscard(false);setSlide(0);
  }
  function addDraft(event) {
    if (!editingAllowed || !canPublishOnWeb()) return;
    setNotice('');setBaseline(null);
    const seed = { title:'',caption:'',day:chosenWeek?.first || 1,time:'18:00',platform:network === 'all' ? 'ig' : network,format:network === 'tt' ? 'Reel' : 'Post',art:'sea' };
    triggerRef.current=event.currentTarget;setDetail('new');setEditing(true);setDraft(seed);setOriginal(seed);setError('');setDiscard(false);setSlide(0);
  }
  function closeDetail(force = false) {
    if (dirty && !force) { setDiscard(true); return; }
    setDetail(null);setEditing(false);setDraft(null);setOriginal(null);setDiscard(false);setError('');
    requestAnimationFrame(() => (triggerRef.current?.isConnected ? triggerRef.current : headingRef.current)?.focus({preventScroll:true}));
  }
  function beginEdit() {
    if (!editingAllowed || !canPublishOnWeb()) return;
    setBaseline({version:selectedPost.version,status:selectedPost.status});
    setDraft(editFields(selectedPost));setOriginal(editFields(selectedPost));setEditing(true);setError('');
  }
  function save(event) {
    event.preventDefault();
    if (!editingAllowed || !canPublishOnWeb()) { setError('Editing is available on desktop web. Your draft has not been changed.');return; }
    const result = commitPlannerChange(cursor, state => savePlannerPost(state,draft,selectedPost?.id,baseline?.version,baseline?.status), store);
    if (!result.ok) { setError(result.error); return; }
    setLoaded({data:result.data,error:''});setDetail(result.post.id);setDraft(editFields(result.post));setOriginal(editFields(result.post));setEditing(false);setError('');
    setNotice(result.post.status === 'draft' ? (live ? 'Draft saved. It is private until you share it.' : 'Draft saved in this browser. It is private until you share it.') : 'New version saved. Previous approval no longer applies. No notification was sent.');
  }
  function markReady() {
    if (!editingAllowed || !canPublishOnWeb()) return;
    const result = commitPlannerChange(cursor, state => readyPlannerPost(state,selectedPost.id,selectedPost.version), store);
    if (!result.ok) { setError(result.error);return; }
    setLoaded({data:result.data,error:''});setNotice('Ready for review. Open the review calendar to choose what the client sees. Nothing was sent.');setError('');
  }
  function field(key,value) {
    setDraft(current => ({ ...current,[key]:value,...(key==='platform' && !PLANNER_FORMATS[value].includes(current.format) ? {format:PLANNER_FORMATS[value][0]} : {}) }));setError('');
  }
  function clearFilters() { setStage('all');setNetwork('all');setWeek('all');setQuery(''); }
  function showDrafts() { clearFilters();setStage('draft');requestAnimationFrame(()=>resultsRef.current?.focus()); }

  return <div className="tw-planner-experience" data-planner-theme={dark?'dark':'light'}>
    <div className="pl-preview-line"><span>{live?`${clientName||'Workspace'} · Drafts and schedule save to your workspace`:'Design preview · Sample content · Changes stay in this browser'}</span><button type="button" className="pl-icon-button" onClick={()=>setDark(!dark)} aria-label={dark?'Use light planner theme':'Use dark planner theme'}>{dark?<Sun size={17}/>:<Moon size={17}/>}</button></div>
    <header className="pl-heading"><div><span className="pl-kicker"><img src="/logo-transparent.png" alt=""/>{live?`${clientName||'Workspace'} / Planner`:'Marina Social Club / Planner'}</span><h1 ref={headingRef} tabIndex={-1}>The work behind the month.</h1><p>Shape the content, settle the details, then bring your client into the conversation.</p></div><div className="pl-heading-actions"><a className="pl-link" href={calendarUrl}><Eye size={16} aria-hidden="true"/>Review calendar</a>{editingAllowed && <button className="pl-button pl-primary" type="button" data-publishing-action="true" onClick={addDraft}><Plus size={17} aria-hidden="true"/>Add draft</button>}</div></header>
    {loaded.error && <p className="pl-error" role="alert">{loaded.error}</p>}
    {mobileWeb && <p className="pl-mobile-note">Browse your content and feedback here. Editing is available on desktop web.</p>}
    <div className="pl-notice" role="status">{notice}</div>
    {!!visualRun.length && <section className="pl-visual-run" aria-labelledby="pl-visual-run-title">
      <div className="pl-visual-run-copy"><span className="pl-kicker">The month in pictures</span><h2 id="pl-visual-run-title">See the rhythm before the schedule.</h2><p>Open any frame to shape its caption, date and review status.</p></div>
      <div className="pl-visual-run-art">{visualRun.map((post,index)=><a href={`#planner-${post.id}`} key={post.id} onClick={event=>{event.preventDefault();openPost(post,event);}} aria-label={`Open ${post.title}`}><Artwork post={post}/><span><strong>{String(post.day).padStart(2,'0')}</strong><small>{post.title}</small></span><i aria-hidden="true">0{index+1}</i></a>)}</div>
    </section>}
    <section className="pl-month-section" aria-label="Month overview"><div className="pl-month-toolbar"><div className="pl-month-title"><h2>{formatMonth(cursor)}</h2><div><button type="button" className="pl-icon-button" aria-label="Previous month" onClick={()=>changeMonth(-1)}><ChevronLeft size={19}/></button><button type="button" className="pl-icon-button" aria-label="Next month" onClick={()=>changeMonth(1)}><ChevronRight size={19}/></button><button type="button" className="pl-link" onClick={()=>changeMonth(0)}>This month</button></div></div><span className="pl-timezone"><Clock size={14} aria-hidden="true"/>Workspace time · UTC</span></div>
      <div className="pl-week-rail" aria-label="Choose a week"><button type="button" aria-pressed={week==='all'} onClick={()=>setWeek('all')}><span>Whole month</span><strong>{data.posts.length}<small>{data.posts.length===1?'post':'posts'}</small></strong></button>{weeks.map((item,index)=>{const amount=data.posts.filter(p=>p.day>=item.first&&p.day<=item.last).length;return <button type="button" key={item.key} aria-pressed={week===item.key} onClick={()=>setWeek(item.key)} aria-label={`Week ${index+1}, ${item.first} to ${item.last}, ${countPosts(amount)}`}><span>{String(item.first).padStart(2,'0')} to {String(item.last).padStart(2,'0')}</span><strong>{amount}<small>{amount===1?'post':'posts'}</small></strong><span className="pl-week-track" aria-hidden="true">{Array.from({length:item.last-item.first+1},(_,i)=><i key={i} className={data.posts.some(p=>p.day===item.first+i)?'has-post':''}/>)}</span></button>;})}</div>
    </section>
    <div className="pl-workspace"><main className="pl-main"><div className="pl-stage-tabs" aria-label="Filter content status">{Object.entries(PLANNER_STAGES).map(([key,label])=><button type="button" key={key} aria-pressed={stage===key} onClick={()=>setStage(key)}>{label}<span>{counts[key]}</span></button>)}</div>
      <div className="pl-tools"><label className="pl-search"><Search size={16} aria-hidden="true"/><span className="pl-sr-only">Search planned content</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a post or caption"/></label><label className="pl-network-filter"><span className="pl-sr-only">Filter network</span><select value={network} onChange={e=>setNetwork(e.target.value)}><option value="all">All networks</option>{Object.entries(CALENDAR_NETWORKS).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label><div className="pl-view-switch" role="group" aria-label="Content view"><button type="button" aria-pressed={view==='list'} onClick={()=>setView('list')} aria-label="List view"><List size={17}/></button><button type="button" aria-pressed={view==='visual'} onClick={()=>setView('visual')} aria-label="Visual view"><LayoutGrid size={17}/></button></div></div>
      <div className="pl-results-heading" ref={resultsRef} tabIndex={-1}><span role="status">{countPosts(filtered.length)}{chosenWeek?` · ${chosenWeek.first} to ${chosenWeek.last} ${cursor.toLocaleDateString('en',{month:'short'})}`:' · whole month'}</span>{(stage!=='all'||network!=='all'||week!=='all'||query) && <button className="pl-link" type="button" onClick={clearFilters}>Clear filters</button>}{view==='visual' && <span>Creative overview, not a live social feed</span>}</div>
      {!filtered.length ? <div className="pl-empty"><Search size={26} aria-hidden="true"/><h3>A little space in the plan.</h3><p>No content matches this view. Try another week, network or status.</p><button className="pl-link" type="button" onClick={clearFilters}>Show all content <ArrowRight size={16} aria-hidden="true"/></button></div> : <div className={view==='visual'?'pl-visual-grid':'pl-content-list'}>{filtered.map(post=><button type="button" className="pl-post" key={post.id} onClick={event=>openPost(post,event)} aria-label={`Open ${post.title}, ${postDate(cursor,post.day)}, ${PLANNER_STAGES[plannerStage(post,data)]}`}><span className="pl-post-date"><strong>{String(post.day).padStart(2,'0')}</strong><span>{new Date(cursor.getFullYear(),cursor.getMonth(),post.day).toLocaleDateString('en',{weekday:'short'})}</span></span><span className="pl-art"><Artwork post={post} compact/></span><span className="pl-post-content"><span className="pl-post-meta"><Network platform={post.platform} full/><span>{post.format} · {post.time}</span></span><strong>{post.title}</strong><span className="pl-caption-excerpt">{post.caption}</span><Stage post={post} data={data}/></span><ArrowRight className="pl-post-arrow" size={17} aria-hidden="true"/></button>)}</div>}
    </main><aside className="pl-desk" aria-label="Planning notes"><section><span className="pl-kicker">On your desk</span><h2>{counts.changes ? 'A few details to settle.' : 'Keep the good work moving.'}</h2>{feedbackPosts.length ? feedbackPosts.slice(0,2).map(post=><button type="button" className="pl-attention" key={post.id} onClick={event=>openPost(post,event)}><span><MessageSquare size={16} aria-hidden="true"/>Client feedback</span><strong>{post.title}</strong><p>{post.notes.filter(note=>note.kind==='changes').at(-1)?.text || 'Open the post to review the client’s feedback.'}</p><span className="pl-attention-action">Review feedback <ArrowRight size={15} aria-hidden="true"/></span></button>):<p className="pl-muted">No change requests in this month. New feedback will stay attached to the content.</p>}
      {draftPosts.length>0 && <div className="pl-drafts-note"><strong>{draftPosts.length} {draftPosts.length===1?'draft':'drafts'} to finish</strong><p>Private to your team until you mark them ready and include them in a review.</p><button className="pl-link" type="button" onClick={showDrafts}>See drafts <ArrowRight size={15} aria-hidden="true"/></button></div>}</section>
      <section className="pl-mix"><span className="pl-kicker">The channel mix</span><p>Planned content for {cursor.toLocaleDateString('en',{month:'long'})}.</p>{Object.entries(CALENDAR_NETWORKS).map(([key,name])=>{const amount=data.posts.filter(post=>post.platform===key).length;return <div className="pl-mix-row" key={key}><span><Network platform={key}/>{name}<strong>{amount}</strong></span><div className="pl-mix-track" aria-hidden="true"><span style={{width:`${data.posts.length?amount/data.posts.length*100:0}%`}}/></div></div>;})}</section>
      <section className="pl-handoff"><span className="pl-kicker">Next, the client</span><h3>{counts.ready?`${counts.ready} ready for a fresh pair of eyes.`:'One clear calendar. One conversation.'}</h3><p>Pick the content in Calendar, add your note and preview exactly what your client receives.</p><a className="pl-link" href={calendarUrl}>Open review calendar <ArrowRight size={16} aria-hidden="true"/></a></section>
    </aside></div><footer className="pl-footer"><span>{live?`Planner for ${clientName||'your workspace'}.`:'Sample content for Marina Social Club.'}</span><span>{live?'Drafts and scheduling save here. Publishing still happens from Publisher.':'No posts are sent, scheduled or published.'}</span></footer>

    {detail && previewPost && createPortal(<div className="tw-planner-experience pl-modal-root" data-planner-theme={dark?'dark':'light'} onClick={e=>{if(e.target===e.currentTarget)closeDetail();}}><div className="pl-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pl-detail-title" tabIndex={-1} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();closeDetail();}if(e.key==='Tab'){const controls=[...e.currentTarget.querySelectorAll('button:not(:disabled),a[href],input,textarea,select')].filter(el=>el.getClientRects().length);const first=controls[0],last=controls.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===e.currentTarget)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}>
      <div className="pl-detail-top"><span className="pl-kicker">{detail==='new'?'New private draft':'Content details'}</span><button className="pl-icon-button" type="button" aria-label="Close post details" onClick={()=>closeDetail()}><X size={21}/></button></div>
      {notice && <p className="pl-inline-notice" role="status">{notice}</p>}
      {discard && <div className="pl-discard" role="alert"><strong>You have unsaved edits.</strong><span>Keep editing, or close without saving them.</span><div><button type="button" className="pl-button" onClick={()=>setDiscard(false)}>Keep editing</button><button type="button" className="pl-button" onClick={()=>closeDetail(true)}>Discard edits</button></div></div>}
      <div className="pl-detail-layout"><div className="pl-detail-visual"><div className={`pl-preview-art pl-format-${previewPost.format.toLowerCase()}`}><Artwork post={previewPost} slide={slide}/></div>{previewPost.format==='Carousel' && <div className="pl-slides"><button className="pl-icon-button" type="button" disabled={slide===0} aria-label="Previous slide" onClick={()=>setSlide(slide-1)}><ChevronLeft size={19}/></button><span>{slide+1} / 3{live?'':' sample'} slides</span><button className="pl-icon-button" type="button" disabled={slide===2} aria-label="Next slide" onClick={()=>setSlide(slide+1)}><ChevronRight size={19}/></button></div>}<p className="pl-muted">{live?(previewPost.image?'The image attached to this post.':'This post has no image yet. Add one in Publisher or Media.'):(previewPost.format==='Reel'?'Sample Reel cover. No video is attached.':'Sample creative. Review the full caption and proposed date alongside it.')}</p></div>
      <section className="pl-detail-copy"><span className="pl-post-meta"><Network platform={previewPost.platform} full/> · {previewPost.format}{selectedPost && ` · Version ${selectedPost.version}`}</span><h2 id="pl-detail-title">{detail==='new'?'Make room for an idea.':selectedPost?.title}</h2>
        {editing && editingAllowed ? <form onSubmit={save}><label className="pl-field">Working title<input required maxLength={100} value={draft.title} onChange={e=>field('title',e.target.value)} placeholder="A name your team will recognize"/></label><div className="pl-fields"><label className="pl-field">Channel<select value={draft.platform} onChange={e=>{field('platform',e.target.value);setSlide(0);}}>{Object.entries(CALENDAR_NETWORKS).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label><label className="pl-field">Format<select value={draft.format} onChange={e=>{field('format',e.target.value);setSlide(0);}}>{PLANNER_FORMATS[draft.platform].map(format=><option key={format}>{format}</option>)}</select></label></div><label className="pl-field">Caption<textarea required rows={5} maxLength={2200} value={draft.caption} onChange={e=>field('caption',e.target.value)} placeholder="What would you like to say?"/></label><div className="pl-caption-count">{draft.caption.length.toLocaleString()} / 2,200</div><div className="pl-fields"><label className="pl-field">Proposed date<input required type="date" min={`${monthKey(cursor)}-01`} max={`${monthKey(cursor)}-${new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate()}`} value={`${monthKey(cursor)}-${String(draft.day).padStart(2,'0')}`} onChange={e=>field('day',e.target.value.startsWith(monthKey(cursor)+'-')?Number(e.target.value.slice(-2)):0)}/></label><label className="pl-field">Time (workspace timezone)<input required type="time" value={draft.time} onChange={e=>field('time',e.target.value)}/></label></div>{!live && <label className="pl-field">Sample artwork<select value={draft.art} onChange={e=>field('art',e.target.value)}>{Object.entries(PLANNER_ARTWORK).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>}
          {selectedPost && selectedPost.status!=='draft' && <p className="pl-revision-note">Saving creates a new version. If this post was already shared, the client will need to review it again. No notification is sent.</p>}{error && <p className="pl-error" role="alert">{error}</p>}<button className="pl-button pl-primary pl-save" type="submit" data-publishing-action="true" disabled={!dirty}><Check size={16} aria-hidden="true"/>{selectedPost && selectedPost.status!=='draft'?'Save new version':'Save draft'}</button></form> : <>
          {selectedPost && <><div className="pl-detail-status"><Stage post={selectedPost} data={data}/><span><Clock size={14} aria-hidden="true"/>{postDate(cursor,selectedPost.day)} · {selectedPost.time} GMT+3</span></div><h3>Caption</h3><p className="pl-full-caption">{selectedPost.caption}</p>{selectedPost.notes.length>0 && <div className="pl-conversation"><h3>Conversation</h3>{selectedPost.notes.map((note,index)=><div key={index}><strong>{note.author}</strong><p>{note.text}</p></div>)}</div>}{error && <p className="pl-error" role="alert">{error}</p>}
          {editingAllowed && <div className="pl-detail-actions"><button className="pl-button" type="button" data-publishing-action="true" onClick={beginEdit}><Edit3 size={16} aria-hidden="true"/>Edit content</button>{selectedPost.status==='draft' && <button className="pl-button pl-primary" type="button" data-publishing-action="true" onClick={markReady}>Mark ready for review <ArrowRight size={16} aria-hidden="true"/></button>}</div>}
          {plannerStage(selectedPost,data)==='ready' && <div className="pl-ready-message"><Check size={18} aria-hidden="true"/><div><strong>Ready, and still private.</strong><p>Choose this post when preparing the client calendar.</p><a className="pl-link" href={calendarUrl}>Continue to review calendar <ArrowRight size={16} aria-hidden="true"/></a></div></div>}</>}
          {mobileWeb && <p className="pl-mobile-note">Editing is available on desktop web. {dirty?'Your unsaved edits are kept while this detail view stays open.':''}</p>}
        </>}
        <p className="pl-detail-safety">A proposed date is a plan, not a publishing schedule. Nothing goes live from this preview.</p>
      </section></div></div></div>,document.body)}
  </div>;
}
