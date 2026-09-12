import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {ArrowLeft,ArrowRight,Check,CheckCheck,ChevronDown,ChevronLeft,ChevronRight,Clock,Edit3,Eye,MessageSquare,Moon,Search,ShieldCheck,Sun} from 'lucide-react';
import {FaInstagram,FaFacebook,FaLinkedin,FaTiktok} from 'react-icons/fa';
import {Artwork} from './CalendarExperience';
import {CALENDAR_NETWORKS,monthKey,parseCalendarMonth} from './calendarPreviewModel';
import {commitPlannerChange,plannerStorageKey,readPlannerMonth} from './plannerPreviewModel';
import {REVIEW_GROUPS,reviewAccess,reviewGroup,reviewLabel,reviseApproval,sharedReviewPosts} from './approvalsPreviewModel';
import {canPublishOnWeb} from './workspaceResponsive';
import './planner-experience.css';
import './approvals-experience.css';

const NETWORKS={ig:FaInstagram,fb:FaFacebook,li:FaLinkedin,tt:FaTiktok};
const APPROVAL_PREF_KEY='tw_preview_marina_client_approval_required';
function Network({platform}) {const Icon=NETWORKS[platform];return <span className="ar-network"><Icon aria-hidden="true"/>{CALENDAR_NETWORKS[platform]}</span>;}
function Status({post}) {return <span className={`ar-status ar-${reviewGroup(post)}`}><span aria-hidden="true"/>{reviewLabel(post)}</span>;}
function Disclosure({className,id,label,children}) {
  const [open,setOpen]=useState(false);
  return <section className={className} data-open={String(open)}><button type="button" className="ar-disclosure-toggle" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(value=>!value)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();if(!event.repeat)setOpen(value=>!value);}}}>{label}</button><div id={id} hidden={!open}>{children}</div></section>;
}
const formatDate=(cursor,day)=>new Date(cursor.getFullYear(),cursor.getMonth(),day).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});

export default function ApprovalsExperience({dark=false,setDark=()=>{},mobileWeb=false,store=null,clientName=''}) {
  const [cursor,setCursor]=useState(()=>parseCalendarMonth(new URLSearchParams(window.location.search).get('reviewMonth')));
  const [loaded,setLoaded]=useState(()=>readPlannerMonth(cursor, store));
  const [group,setGroup]=useState('all');
  const [query,setQuery]=useState('');
  const [network,setNetwork]=useState('all');
  const [selectedId,setSelectedId]=useState(null);
  const [detailOpen,setDetailOpen]=useState(false);
  const [revision,setRevision]=useState(null);
  const [caption,setCaption]=useState('');
  const [note,setNote]=useState('');
  const [compare,setCompare]=useState(false);
  const [slide,setSlide]=useState(0);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [discard,setDiscard]=useState(false);
  const [clientApprovalRequired,setClientApprovalRequired]=useState(()=>{try{return localStorage.getItem(APPROVAL_PREF_KEY)!=='false';}catch(_){return true;}});
  const pendingAction=useRef(null),queueHeading=useRef(null),detailHeading=useRef(null),captionRef=useRef(null),discardRef=useRef(null),focusBeforeDiscard=useRef(null),reviewPanel=useRef(null);
  const state=loaded.data,shared=sharedReviewPosts(state);
  const counts=Object.fromEntries(Object.keys(REVIEW_GROUPS).map(key=>[key,shared.filter(p=>reviewGroup(p)===key).length]));
  const filtered=shared.filter(p=>(group==='all'||reviewGroup(p)===group)&&(network==='all'||p.platform===network)&&`${p.title} ${p.caption} ${p.notes.map(n=>n.text).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selected=selectedId ? shared.find(p=>p.id===selectedId)||null : filtered[0]||null;
  const selectedIndex=filtered.findIndex(post=>post.id===selected?.id);
  const clientNote=selected?.notes.filter(n=>n.author==='Client').at(-1);
  const access=reviewAccess(state);
  const dirty=Boolean(revision&&(caption!==revision.caption||note));
  const editable=!mobileWeb&&!loaded.error;
  const calendarUrl=`/?page=calendar&occasions=editorial&calendarMonth=${monthKey(cursor)}`;
  const clientUrl=`${calendarUrl}&calendarView=client`;
  const plannerUrl=`/?page=planner&occasions=editorial&plannerMonth=${monthKey(cursor)}`;
  const month=cursor.toLocaleDateString('en-GB',{month:'long',year:'numeric'});
  const shortMonth=cursor.toLocaleDateString('en-GB',{month:'short',year:'numeric'});

  useEffect(()=>{const sync=e=>{if(e.key===plannerStorageKey(cursor))setLoaded(readPlannerMonth(cursor, store));};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[cursor]);
  useEffect(()=>{try{localStorage.setItem(APPROVAL_PREF_KEY,String(clientApprovalRequired));}catch(_){}},[clientApprovalRequired]);
  useEffect(()=>{const warn=e=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  useEffect(()=>{
    const confirmNavigation=event=>{if(dirty&&typeof event.detail?.proceed==='function'){event.preventDefault();pendingAction.current=event.detail.proceed;setDiscard(true);}};
    window.addEventListener('tw-preview-navigation',confirmNavigation);
    return()=>window.removeEventListener('tw-preview-navigation',confirmNavigation);
  },[dirty]);
  useEffect(()=>{if(revision&&editable)captionRef.current?.focus();},[revision,editable]);
  useEffect(()=>{
    const panel=reviewPanel.current,scroller=panel?.closest('.tw-scroll-area'),page=panel?.closest('.tw-review-experience');
    if(!panel||!scroller)return;
    let frame=0,disposed=false;
    const measure=()=>{
      if(disposed)return;
      const scrollerStyle=window.getComputedStyle(scroller);
      const inset=parseFloat(scrollerStyle.paddingTop)||0;
      const bottomInset=parseFloat(scrollerStyle.paddingBottom)||0;
      const pageStyle=window.getComputedStyle(page);
      const stationary=page.clientWidth-(parseFloat(pageStyle.paddingLeft)||0)-(parseFloat(pageStyle.paddingRight)||0)>800;
      let available;
      page.dataset.stationary=String(stationary);
      if(stationary){
        // The stage shares the first grid row with the left heading. Using the
        // page inset as its sticky threshold keeps those top edges identical.
        const stageTop=Math.max(0,parseFloat(pageStyle.paddingTop)||0);
        page.style.setProperty('--ar-stage-top',`${stageTop}px`);
        available=Math.max(0,scroller.clientHeight-inset-bottomInset-stageTop-2);
        panel.style.setProperty('--ar-viewport-height',`${available}px`);
      }else{
        page.style.removeProperty('--ar-stage-top');
        available=Math.max(0,scroller.clientHeight-inset-bottomInset);
        panel.style.setProperty('--ar-viewport-height',`${available}px`);
      }
      // Long copy stays scrollable inside the stationary desktop review.
      panel.dataset.fits=String(panel.scrollHeight<=available+1);
    };
    const schedule=()=>{if(disposed)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
    const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(schedule);
    observer?.observe(scroller);observer?.observe(panel);observer?.observe(page);
    window.addEventListener('resize',schedule);
    document.fonts?.ready.then(schedule);
    schedule();
    return()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',schedule);};
  },[selected?.id,revision,notice]);
  useEffect(()=>{if(reviewPanel.current)reviewPanel.current.scrollTop=0;},[selected?.id]);
  useEffect(()=>{
    if(!discard)return;
    focusBeforeDiscard.current=document.activeElement;
    const root=document.getElementById('root'),before=root?.inert;
    if(root)root.inert=true;
    discardRef.current?.querySelector('button')?.focus();
    return()=>{if(root)root.inert=before;focusBeforeDiscard.current?.focus?.();};
  },[discard]);
  function guard(action){if(dirty){pendingAction.current=action;setDiscard(true);}else{setRevision(null);action();}}
  function navigate(event,url){if(dirty){event.preventDefault();guard(()=>window.location.assign(url));}}
  function focusReview(){detailHeading.current?.focus({preventScroll:reviewPanel.current?.closest('.tw-review-experience')?.dataset.stationary==='true'});}
  function openPost(id){guard(()=>{if(!filtered.some(p=>p.id===id)){setGroup('all');setQuery('');setNetwork('all');}setSelectedId(id);setDetailOpen(true);setSlide(0);setError('');setNotice('');requestAnimationFrame(focusReview);});}
  function changeGroup(value){guard(()=>{setGroup(value);setSelectedId(null);setDetailOpen(false);setSlide(0);setError('');setNotice('');});}
  function changeMonth(direction){guard(()=>{const next=new Date(cursor.getFullYear(),cursor.getMonth()+direction,1);setCursor(next);setLoaded(readPlannerMonth(next, store));setGroup('all');setQuery('');setNetwork('all');setSelectedId(null);setDetailOpen(false);setNotice('');setError('');setSlide(0);const url=new URL(window.location.href);url.searchParams.set('reviewMonth',monthKey(next));window.history.replaceState(window.history.state,'',url);});}
  function clearFilters(){guard(()=>{setGroup('all');setQuery('');setNetwork('all');setSelectedId(null);setDetailOpen(false);});}
  function beginRevision(){if(!editable||!canPublishOnWeb()||selected?.status!=='changes')return;setSelectedId(selected.id);setRevision({id:selected.id,version:selected.version,caption:selected.caption});setCaption(selected.caption);setNote('');setCompare(false);setNotice('');setError('');}
  function cancelRevision(){guard(()=>{setRevision(null);setError('');requestAnimationFrame(focusReview);});}
  function saveRevision(event){
    event.preventDefault();
    if(!editable||!canPublishOnWeb()){setError('Revisions are available on desktop web. Your edits have not been saved.');return;}
    const result=commitPlannerChange(cursor,data=>reviseApproval(data,revision.id,caption,note,revision.version),store);
    if(!result.ok){setError(result.error);return;}
    setLoaded({data:result.data,error:''});setGroup('all');setQuery('');setNetwork('all');setSelectedId(result.post.id);setRevision(null);setError('');setCompare(false);
    setNotice(`Version ${result.post.version} saved for client review. No notification was sent and nothing was published.`);
    requestAnimationFrame(focusReview);
  }
  function nextFeedback(){const next=shared.find(p=>p.status==='changes'&&p.id!==selected?.id);if(next)openPost(next.id);else changeGroup('waiting');}
  function approveByMe(){
    if(!editable||!selected||selected.status==='approved')return;
    const result=commitPlannerChange(cursor,data=>{
      const post=data.posts.find(item=>item.id===selected.id);
      if(!post)return {ok:false,error:'This post is no longer available in the review.'};
      const updated={...post,status:'approved',approvedBy:'Agency',approvedAt:Date.now(),notes:[...post.notes,{author:'Agency',kind:'approved',version:post.version,text:'Approved by me.'}]};
      return {ok:true,post:updated,data:{...data,posts:data.posts.map(item=>item.id===post.id?updated:item),activity:[{text:`${post.title} approved by your team`,at:Date.now()},...data.activity].slice(0,20)}};
    },store);
    if(!result.ok){setError(result.error);return;}
    setLoaded({data:result.data,error:''});setSelectedId(result.post.id);setError('');setNotice(`Version ${result.post.version} approved by you. Nothing was published.`);requestAnimationFrame(focusReview);
  }

  return <div className="tw-planner-experience tw-review-experience" data-planner-theme={dark?'dark':'light'}>
    <header className="pl-heading ar-heading">
      <div className="ar-heading-copy">
        <span className="pl-kicker"><img src="/logo-transparent.png" alt=""/>Marina Social Club</span>
        <div className="ar-heading-title"><h1>Approvals</h1><p><strong>{counts.changes}</strong> {counts.changes===1?'needs':'need'} action</p></div>
      </div>
      <div className="ar-heading-tools">
        <button type="button" className="pl-icon-button ar-theme-toggle" aria-label={dark?'Use light approvals theme':'Use dark approvals theme'} onClick={()=>setDark(!dark)}>{dark?<Sun size={17}/>:<Moon size={17}/>}</button>
        <div className="ar-month-line"><button type="button" className="pl-icon-button" aria-label="Previous review month" onClick={()=>changeMonth(-1)}><ChevronLeft size={18}/></button><h2><span className="ar-month-full">{month}</span><span className="ar-month-short">{shortMonth}</span></h2><button type="button" className="pl-icon-button" aria-label="Next review month" onClick={()=>changeMonth(1)}><ChevronRight size={18}/></button></div>
        <a className="pl-link" href={calendarUrl} onClick={e=>navigate(e,calendarUrl)}>Calendar <ArrowRight size={16} aria-hidden="true"/></a>
      </div>
    </header>
    {loaded.error&&<p className="pl-error" role="alert">{loaded.error}</p>}
    <div className="ar-review-tools"><div className="ar-summary" role="group" aria-label="Filter review status"><button type="button" aria-pressed={group==='all'} onClick={()=>changeGroup('all')}><span>All shared</span><strong>{shared.length}</strong></button>{Object.entries(REVIEW_GROUPS).map(([key,label])=><button type="button" key={key} aria-pressed={group===key} onClick={()=>changeGroup(key)} className={`ar-summary-${key}`}><span>{label}</span><strong>{counts[key]}</strong></button>)}</div><div className="ar-mode-tools">{clientApprovalRequired?<a className="pl-link ar-client-link" href={clientUrl} onClick={e=>navigate(e,clientUrl)}><Eye size={15} aria-hidden="true"/>Client view</a>:<span className="ar-client-disabled"><ShieldCheck size={15} aria-hidden="true"/>Team sign-off</span>}<button type="button" className="ar-approval-toggle" aria-pressed={clientApprovalRequired} aria-label="This client needs approval" onClick={()=>setClientApprovalRequired(value=>!value)}><span><strong>{clientApprovalRequired?'Approval needed':'No client approval'}</strong><small>{clientApprovalRequired?'Client decides':'Your team decides'}</small></span><i aria-hidden="true"><b/></i></button></div></div>
    {(access.kind==='expired'||access.kind==='view')&&<p className="ar-access-warning"><ShieldCheck size={16} aria-hidden="true"/><span><strong>{access.label}.</strong> {access.detail}</span></p>}
    <div className="ar-workbench" data-detail-open={String(detailOpen)}>
      <section className="ar-queue" aria-label="Review queue"><div className="ar-queue-heading"><h2 ref={queueHeading} tabIndex={-1}>Review queue</h2><span>Needs action first</span></div>
        <label className="ar-search"><Search size={16} aria-hidden="true"/><span className="pl-sr-only">Search approval content</span><input type="search" value={query} disabled={Boolean(revision)} placeholder="Search posts or feedback" onChange={e=>{setQuery(e.target.value);setSelectedId(null);setDetailOpen(false);}}/></label>
        <div className="ar-queue-tools"><span role="status">{filtered.length} {filtered.length===1?'post':'posts'} in view</span><label><span className="pl-sr-only">Approval network</span><select value={network} disabled={Boolean(revision)} onChange={e=>{setNetwork(e.target.value);setSelectedId(null);setDetailOpen(false);}}><option value="all">All networks</option>{Object.entries(CALENDAR_NETWORKS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label></div>
        {revision&&<p className="ar-quiet">Finish or cancel your revision to use search and network filters.</p>}
        {filtered.length?<div className="ar-queue-list">{filtered.map(post=><button type="button" className="ar-queue-post" key={post.id} aria-pressed={selected?.id===post.id} aria-label={`Review ${post.title}, ${reviewLabel(post)}`} onClick={()=>openPost(post.id)}><span className="ar-thumbnail"><Artwork post={post} compact/></span><span className="ar-queue-copy"><Status post={post}/><strong>{post.title}</strong><span><Network platform={post.platform}/> · {formatDate(cursor,post.day)}</span><small>Version {post.version} · {post.format}</small></span><ArrowRight size={15} aria-hidden="true"/></button>)}</div>:<div className="ar-empty"><CheckCheck size={24} aria-hidden="true"/><h3>{shared.length?'Nothing in this view.':'No content shared yet.'}</h3><p>{shared.length?'Try another status, network or search.':'Finish your drafts in Planner, then choose what the client sees in Calendar.'}</p>{shared.length?<button className="pl-link" type="button" onClick={clearFilters}>Show all shared content <ArrowRight size={15}/></button>:<a className="pl-link" href={plannerUrl}>Open Planner <ArrowRight size={15}/></a>}</div>}
      </section>
      <section className="ar-detail" ref={reviewPanel} tabIndex={0} data-review-format={selected?.format.toLowerCase()} data-review-status={selected?reviewGroup(selected):'empty'} aria-label="Selected review" aria-labelledby="ar-detail-title">
        <button type="button" className="pl-link ar-back" onClick={()=>guard(()=>{setDetailOpen(false);requestAnimationFrame(()=>queueHeading.current?.focus());})}><ArrowLeft size={16} aria-hidden="true"/>Back to review queue</button>
        {selected?<><span className="ar-stage-kicker"><Eye size={13} aria-hidden="true"/>Live review stage</span><div className="ar-detail-topline"><Status post={selected}/><div className="ar-post-navigation" role="group" aria-label="Move through review queue"><span>{selectedIndex<0?'Outside this filter':`${selectedIndex+1} of ${filtered.length}`}</span><button type="button" className="pl-icon-button" aria-label="Previous review post" disabled={selectedIndex<=0} onClick={()=>openPost(filtered[selectedIndex-1].id)}><ChevronLeft size={17}/></button><button type="button" className="pl-icon-button" aria-label="Next review post" disabled={selectedIndex<0||selectedIndex>=filtered.length-1} onClick={()=>openPost(filtered[selectedIndex+1].id)}><ChevronRight size={17}/></button></div></div><div className="ar-detail-heading"><h2 id="ar-detail-title" ref={detailHeading} tabIndex={-1}>{selected.title}</h2><span className="ar-version">Version {selected.version}</span></div>
          {notice&&<p className="ar-saved" role="status"><Check size={16} aria-hidden="true"/>{notice}</p>}
          <div className="ar-post-info"><Network platform={selected.platform}/><span>{selected.format}</span><span><Clock size={14} aria-hidden="true"/>{formatDate(cursor,selected.day)} · {selected.time} GMT+3</span></div>
          <div className="ar-review-body"><div className="ar-creative"><div className={`ar-artwork ar-format-${selected.format.toLowerCase()}`}><Artwork post={selected} slide={slide}/></div>{selected.format==='Carousel'&&<div className="ar-slides"><button type="button" className="pl-icon-button" disabled={slide===0} aria-label="Previous review slide" onClick={()=>setSlide(slide-1)}><ChevronLeft size={18}/></button><span>{slide+1} / 3 sample slides</span><button type="button" className="pl-icon-button" disabled={slide===2} aria-label="Next review slide" onClick={()=>setSlide(slide+1)}><ChevronRight size={18}/></button></div>}<p className="ar-quiet">{selected.format==='Reel'?'Sample Reel cover. No video attached.':'Sample creative for this review.'}</p></div>
            <div className="ar-review-content">{selected.status==='changes'&&clientNote?<div className="ar-client-note"><span><MessageSquare size={15} aria-hidden="true"/>1 · Client feedback</span><blockquote>{clientNote.text}</blockquote></div>:<div className={`ar-decision ar-decision-${reviewGroup(selected)}`}><span aria-hidden="true">{selected.status==='approved'?<CheckCheck size={20}/>:<Clock size={20}/>}</span><div><strong>{selected.status==='approved'?(selected.approvedBy==='Agency'?'Approved by you.':'This version is signed off.'):selected.status==='revised'?'The update is with your client.':clientApprovalRequired?'Waiting for the client’s decision.':'Ready for your sign-off.'}</strong><p>{selected.status==='approved'?'Approval applies to this version. It does not publish the post.':!clientApprovalRequired?'This client does not need to approve content. Review it here and sign off for your team.':access.kind==='expired'?'The link has expired. Prepare a new review in Calendar so the client can respond.':access.kind==='view'?'This calendar is view only. Enable client decisions when preparing a new review.':'The client can approve this version or leave a change request in Calendar.'}</p></div></div>}
              {revision&&editable?<form className="ar-revision-form" onSubmit={saveRevision}><label className="ar-field" htmlFor="ar-caption">3 · Revised caption</label><textarea id="ar-caption" ref={captionRef} required maxLength={2200} rows={7} value={caption} onChange={e=>{setCaption(e.target.value);setError('');}} aria-describedby="ar-caption-help"/><span className="ar-caption-count">{caption.length.toLocaleString()} / 2,200</span><p className="ar-quiet" id="ar-caption-help">Address the feedback. Saving creates a new version for the client to review.</p><button type="button" className="pl-link ar-compare-toggle" aria-expanded={compare} onClick={()=>setCompare(!compare)}>{compare?'Hide previous caption':'Compare with previous caption'}</button>{compare&&<div className="ar-before"><strong>Version {revision.version} · Previous caption</strong><p>{revision.caption}</p></div>}<label className="ar-field" htmlFor="ar-note">What changed? <span>Optional</span></label><input id="ar-note" maxLength={500} value={note} onChange={e=>{setNote(e.target.value);setError('');}} placeholder="For example, added the lunch days"/>{error&&<p className="pl-error" role="alert">{error}</p>}<div className="ar-revision-actions"><button type="submit" className="pl-button pl-primary" data-publishing-action="true" disabled={caption.trim()===revision.caption.trim()||!caption.trim()}>Save revision <ArrowRight size={16} aria-hidden="true"/></button><button type="button" className="pl-link" onClick={cancelRevision}>Cancel</button></div><p className="ar-quiet">Saved in this browser only. No notification is sent.</p></form>:<><h3 className="ar-caption-label">2 · Current caption</h3><p className="ar-full-caption">{selected.caption}</p>{selected.status!=='approved'&&editable&&<div className="ar-primary-actions">{selected.status==='changes'&&<button type="button" className="pl-button pl-primary ar-revise" data-publishing-action="true" onClick={beginRevision}><Edit3 size={16} aria-hidden="true"/>3 · Revise caption</button>}<button type="button" className="pl-button ar-approve-self" onClick={approveByMe}><CheckCheck size={16} aria-hidden="true"/>Approve by me</button></div>}{mobileWeb&&<p className="ar-mobile-note">Read the feedback here. Content revisions are available on desktop web.</p>}{revision&&!editable&&<div className="ar-unsaved-mobile"><p>Your unsaved revision is kept while this page stays open.</p><button type="button" className="pl-link" onClick={cancelRevision}>Cancel revision</button></div>}</>}
            </div></div>
          {selected.notes.length>0&&<Disclosure className="ar-conversation" id="ar-conversation-content" key={selected.id} label={<><span><MessageSquare size={16} aria-hidden="true"/>Conversation</span><span>{selected.notes.length} {selected.notes.length===1?'update':'updates'}<ChevronDown size={16} aria-hidden="true"/></span></>}><ol>{selected.notes.map((entry,index)=><li key={index}><span className={`ar-author ${entry.author==='Client'?'ar-author-client':''}`} aria-hidden="true">{entry.author==='Client'?'C':'T'}</span><div><header><strong>{entry.author==='Agency'?'Your team':entry.author}</strong><span>{entry.kind==='changes'?'Requested changes':entry.kind==='approved'?'Approved':`Revision${entry.version?' '+entry.version:''}`}</span></header><p>{entry.text}</p></div></li>)}</ol></Disclosure>}
          <div className="ar-detail-footer"><p>Approval and publishing are separate. Nothing goes live from this preview.</p>{!revision&&<button type="button" className="pl-link" onClick={nextFeedback}>{shared.some(p=>p.status==='changes'&&p.id!==selected.id)?'Next change request':'See posts with client'}<ArrowRight size={15} aria-hidden="true"/></button>}</div>
        </>:<div className="ar-detail-empty"><img src="/logo-transparent.png" alt=""/><h2 id="ar-detail-title">Every decision, in context.</h2>{revision?<><p role="alert">This post is no longer in the shared review. Your unsaved revision has been kept. Cancel it to continue.</p><button type="button" className="pl-link" onClick={cancelRevision}>Cancel revision</button></>:<><p>Select a shared post to read the caption, follow the conversation and prepare a revision.</p><a className="pl-link" href={calendarUrl}>Review calendar <ArrowRight size={15} aria-hidden="true"/></a></>}</div>}
      </section>
    </div>
    <Disclosure className="ar-access" id="ar-access-content" label={<><ShieldCheck size={16} aria-hidden="true"/><span>Review access</span><strong>{access.label}</strong><ChevronDown size={16} aria-hidden="true"/></>}><p>{access.detail} Private drafts stay in Planner.</p><a className="pl-link" href={calendarUrl} onClick={e=>navigate(e,calendarUrl)}>Review calendar <ArrowRight size={15} aria-hidden="true"/></a></Disclosure>
    <footer className="pl-footer"><span>Sample workspace · Marina Social Club</span><span>Client decisions stay attached to the post and version.</span></footer>
    {discard&&createPortal(<div className="tw-planner-experience ar-discard-root" data-planner-theme={dark?'dark':'light'}><div role="alertdialog" aria-modal="true" aria-labelledby="ar-discard-title" aria-describedby="ar-discard-description" ref={discardRef} onKeyDown={e=>{if(e.key==='Escape'){setDiscard(false);pendingAction.current=null;}if(e.key==='Tab'){const buttons=[...e.currentTarget.querySelectorAll('button')];if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0].focus();}}}}><h2 id="ar-discard-title">Keep your revision?</h2><p id="ar-discard-description">You have unsaved edits. Keep editing, or discard them to continue.</p><div><button type="button" className="pl-button pl-primary" onClick={()=>{setDiscard(false);pendingAction.current=null;}}>Keep editing</button><button type="button" className="pl-button" onClick={()=>{const action=pendingAction.current;pendingAction.current=null;setDiscard(false);setRevision(null);setError('');action?.();}}>Discard edits</button></div></div></div>,document.body)}
  </div>;
}
