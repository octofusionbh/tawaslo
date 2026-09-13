import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Moon, Plus, Sun, Target, X } from 'lucide-react';
import { FaInstagram, FaFacebook, FaLinkedin, FaTiktok } from 'react-icons/fa';
import { Artwork } from './CalendarExperience';
import { CALENDAR_NETWORKS, monthKey, parseCalendarMonth } from './calendarPreviewModel';
import { PLANNER_STAGES, plannerStage, plannerStorageKey, readPlannerMonth } from './plannerPreviewModel';
import { CAMPAIGN_SAMPLE_MONTH, campaignCounts, campaignsInMonth, campaignStorageKey, postsForCampaign, readCampaignBriefs, saveCampaignBrief, validateCampaignBrief, validCampaignMonth } from './campaignsPreviewModel';
import { canPublishOnWeb } from './workspaceResponsive';
import './campaigns-experience.css';

const ICONS = { ig:FaInstagram, fb:FaFacebook, li:FaLinkedin, tt:FaTiktok };
const dateLabel = value => new Date(`${value}T12:00:00`).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const postCount = n => `${n} ${n===1?'post':'posts'}`;
// campaigns.start_date and end_date are nullable, so a range is only claimed when both exist.
const rangeLabel = item => (item.start && item.end ? `${dateLabel(item.start)} to ${dateLabel(item.end)}` : 'No dates set');
const monthLabel = date => date.toLocaleDateString('en-GB',{month:'long',year:'numeric'});
function locationMonth() { const value=new URLSearchParams(window.location.search).get('campaignMonth');return parseCalendarMonth(validCampaignMonth(value)?value:null); }
function Network({platform}) { const Icon=ICONS[platform];return <span className="cp-network"><Icon aria-hidden="true"/>{CALENDAR_NETWORKS[platform]}</span>; }

function MonthPicker({value,onChange}) {
  const [open,setOpen]=useState(false),[year,setYear]=useState(value.getFullYear());
  const rootRef=useRef(null),triggerRef=useRef(null),selectedRef=useRef(null),dialogRef=useRef(null);
  function close(restoreFocus=false){setOpen(false);if(restoreFocus)requestAnimationFrame(()=>triggerRef.current?.focus({preventScroll:true}));}
  useEffect(()=>{
    if(!open)return;
    selectedRef.current?.focus({preventScroll:true});
    dialogRef.current?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
    const fit=()=>{
      const dialog=dialogRef.current;if(!dialog)return;
      dialog.style.marginTop='0px';
      const bounds=dialog.getBoundingClientRect(),overflow=bounds.bottom-window.innerHeight+16;
      if(overflow>0)dialog.style.marginTop=`-${Math.min(overflow,Math.max(0,bounds.top-80))}px`;
    };
    fit();window.addEventListener('resize',fit);
    const outside=event=>{if(!rootRef.current?.contains(event.target))setOpen(false);};
    document.addEventListener('pointerdown',outside);
    return()=>{document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',fit);};
  },[open]);
  return <div className="cp-month-picker" ref={rootRef} onKeyDown={e=>{if(open&&e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}}} onBlur={e=>{if(open&&e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget))close();}}>
    <span className="cp-month-label">Jump to month</span>
    <button ref={triggerRef} className="cp-month-trigger" type="button" aria-label={`Jump to month, ${monthLabel(value)}`} aria-haspopup="dialog" aria-expanded={open} aria-controls={open?'cp-month-dialog':undefined} onClick={()=>{setYear(value.getFullYear());setOpen(!open);}}><span>{monthLabel(value)}</span><CalendarDays size={17} aria-hidden="true"/></button>
    {open&&<div ref={dialogRef} id="cp-month-dialog" className="cp-month-dialog" role="dialog" aria-label="Choose a month">
      <header><strong>Choose a month</strong><button type="button" className="cp-icon" aria-label="Close month picker" onClick={()=>close(true)}><X size={18}/></button></header>
      <div className="cp-picker-year"><button type="button" className="cp-icon" aria-label="Previous year" disabled={year===2000} onClick={()=>setYear(year-1)}><ChevronLeft size={18}/></button><label>Year<select value={year} onChange={e=>setYear(Number(e.target.value))}>{Array.from({length:101},(_,i)=>2000+i).map(y=><option key={y} value={y}>{y}</option>)}</select></label><button type="button" className="cp-icon" aria-label="Next year" disabled={year===2100} onClick={()=>setYear(year+1)}><ChevronRight size={18}/></button></div>
      <div className="cp-picker-months" role="group" aria-label={`Months in ${year}`}>{Array.from({length:12},(_,month)=>{const date=new Date(year,month,1),selected=monthKey(date)===monthKey(value);return <button key={month} ref={month===value.getMonth()?selectedRef:undefined} type="button" aria-label={monthLabel(date)} aria-pressed={selected} onClick={()=>{onChange(date);close(true);}}>{date.toLocaleDateString('en-GB',{month:'short'})}</button>;})}</div>
    </div>}
  </div>;
}

export default function CampaignsExperience({ dark=false, setDark=()=>{}, mobileWeb=false, liveCampaigns=null, clientName='', liveError='', onCreateCampaign=null }) {
  const live = liveCampaigns!==null && liveCampaigns!==undefined;
  const [cursor,setCursor] = useState(locationMonth);
  const [loaded,setLoaded] = useState(()=>live?{campaigns:liveCampaigns,drafts:[],error:liveError}:readCampaignBriefs(cursor));
  // Nothing joins a campaign row to a post row, so a live campaign carries no post set.
  const [planner,setPlanner] = useState(()=>live?{data:{posts:[]},error:''}:readPlannerMonth(cursor));
  const [selected,setSelected] = useState(()=>new URLSearchParams(window.location.search).get('campaign'));
  const [creating,setCreating] = useState(false);
  const [form,setForm] = useState({name:'',goal:'',start:'',end:''});
  const [errors,setErrors] = useState({});
  const [saveError,setSaveError] = useState('');
  const [discard,setDiscard] = useState(false);
  const [notice,setNotice] = useState('');
  const formRef=useRef(null), newRef=useRef(null), detailRef=useRef(null), detailSectionRef=useRef(null), indexRef=useRef(null), monthRef=useRef(null);
  // A saved campaign can have no dates at all; month browsing must never hide it.
  const visibleCampaigns=live
    ?[...campaignsInMonth(loaded.campaigns.filter(item=>item.start&&item.end),cursor),...loaded.campaigns.filter(item=>!item.start||!item.end)]
    :campaignsInMonth(loaded.campaigns,cursor);
  const campaign=visibleCampaigns.find(c=>c.id===selected);
  const campaignIndex=visibleCampaigns.findIndex(c=>c.id===selected);
  const posts=postsForCampaign(campaign,planner.data.posts);
  const counts=campaignCounts(visibleCampaigns,planner.data.posts);
  const approved=posts.filter(p=>p.status==='approved').length;
  const sheet=posts.filter((p,i,all)=>all.findIndex(item=>item.art===p.art)===i).slice(0,2);
  const emptyVisuals=planner.data.posts.filter((post,index,all)=>all.findIndex(item=>item.art===post.art)===index).slice(0,3);
  const heroVisuals=(sheet.length?sheet:emptyVisuals).slice(0,2);
  const dirty=creating && Object.values(form).some(Boolean);
  const canCreate=!mobileWeb && !loaded.error && (!live || !!onCreateCampaign);
  const previewParam=live?'':'occasions=editorial&';
  const plannerUrl=`/?page=planner&${previewParam}plannerMonth=${monthKey(cursor)}`;
  const calendarUrl=`/?page=calendar&${previewParam}calendarMonth=${monthKey(cursor)}`;

  useEffect(()=>{
    const restore=()=>{
      if(new URLSearchParams(window.location.search).get('page')!=='campaigns')return;
      const next=locationMonth();setCursor(next);if(!live){setLoaded(readCampaignBriefs(next));setPlanner(readPlannerMonth(next));}
      setSelected(new URLSearchParams(window.location.search).get('campaign'));setNotice('');
    };
    window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore);
  },[live]);

  useEffect(()=>{if(live)setLoaded({campaigns:liveCampaigns,drafts:[],error:liveError});},[live,liveCampaigns,liveError]);

  useEffect(()=>{
    if(live)return undefined;
    const sync=event=>{
      if(event.key===null || event.key===campaignStorageKey(cursor))setLoaded(readCampaignBriefs(cursor));
      if(event.key===null || event.key===plannerStorageKey(cursor))setPlanner(readPlannerMonth(cursor));
    };
    const refresh=()=>{setLoaded(readCampaignBriefs(cursor));setPlanner(readPlannerMonth(cursor));};
    window.addEventListener('storage',sync);window.addEventListener('focus',refresh);
    return()=>{window.removeEventListener('storage',sync);window.removeEventListener('focus',refresh);};
  },[cursor,live]);
  useEffect(()=>{if(creating)formRef.current?.querySelector('input')?.focus({preventScroll:true});},[creating]);
  useEffect(()=>{
    const warn=event=>{if(dirty){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);

  function remember(date,id=null) {
    const url=new URL(window.location.href);url.searchParams.set('page','campaigns');if(!live)url.searchParams.set('occasions','editorial');url.searchParams.set('campaignMonth',monthKey(date));
    if(id)url.searchParams.set('campaign',id);else url.searchParams.delete('campaign');
    if(url.href!==window.location.href)window.history.pushState({...window.history.state,twApp:1,twPage:'campaigns'},'',url);
  }
  function changeMonth(next) {
    if(!validCampaignMonth(monthKey(next)))return;
    setCursor(next);if(!live){setLoaded(readCampaignBriefs(next));setPlanner(readPlannerMonth(next));}setSelected(null);setNotice('');remember(next);
  }
  function openCampaign(item) {
    setSelected(item.id);setNotice('');remember(cursor,item.id);
    requestAnimationFrame(()=>{detailRef.current?.focus({preventScroll:true});detailSectionRef.current?.scrollIntoView({block:'start',behavior:'instant'});});
  }
  function backToCampaigns() {
    setSelected(null);setNotice('');remember(cursor);
    requestAnimationFrame(()=>{indexRef.current?.focus({preventScroll:true});monthRef.current?.scrollIntoView({block:'start',behavior:'instant'});});
  }

  function openForm(){if(!canCreate || !canPublishOnWeb())return;setCreating(true);setForm({name:'',goal:'',start:'',end:''});setErrors({});setSaveError('');setDiscard(false);setNotice('');}
  function cancel(force=false){if(dirty && !force){setDiscard(true);return;}setCreating(false);setDiscard(false);setErrors({});setSaveError('');requestAnimationFrame(()=>newRef.current?.focus({preventScroll:true}));}
  function update(field,value){setForm(current=>({...current,[field]:value}));setErrors(current=>({...current,[field]:undefined}));setSaveError('');setDiscard(false);}
  async function save(event){
    event.preventDefault();
    if(!canCreate || !canPublishOnWeb()){setSaveError('Creating a campaign is available on desktop web. Your unsaved brief is still here.');return;}
    if(live){
      const invalid=validateCampaignBrief(form);
      if(Object.keys(invalid).length){setErrors(invalid);requestAnimationFrame(()=>formRef.current?.querySelector('[aria-invalid="true"]')?.focus());return;}
      const saved=onCreateCampaign?await onCreateCampaign(form):null;
      if(!saved || saved.error || !saved.campaign){setSaveError((saved&&saved.error)||'The campaign could not be saved.');return;}
      const created=saved.campaign;
      const month=created.start?parseCalendarMonth(created.start.slice(0,7)):cursor;
      setCursor(month);setLoaded(current=>({...current,campaigns:[created,...current.campaigns]}));setSelected(created.id);remember(month,created.id);setCreating(false);setForm({name:'',goal:'',start:'',end:''});setErrors({});setSaveError('');setDiscard(false);setNotice('Campaign saved to this workspace.');
      requestAnimationFrame(()=>detailRef.current?.focus({preventScroll:true}));
      return;
    }
    const result=saveCampaignBrief(cursor,form);
    if(!result.ok){setErrors(result.errors||{});setSaveError(result.error||'');requestAnimationFrame(()=>{if(result.errors)formRef.current?.querySelector('[aria-invalid="true"]')?.focus();});return;}
    const next=campaignsInMonth([result.campaign],cursor).length?cursor:parseCalendarMonth(result.campaign.start.slice(0,7));
    setCursor(next);setPlanner(readPlannerMonth(next));setLoaded(result.loaded);setSelected(result.campaign.id);remember(next,result.campaign.id);setCreating(false);setForm({name:'',goal:'',start:'',end:''});setErrors({});setSaveError('');setDiscard(false);setNotice('Draft brief saved in this browser. No posts were changed and nothing was sent.');
    requestAnimationFrame(()=>detailRef.current?.focus({preventScroll:true}));
  }

  return <main className="tw-campaigns-experience" data-campaigns-theme={dark?'dark':'light'}>
    <div className="cp-preview-line">{live?<span/>:<span>Design preview · Sample briefs · No paid ads</span>}<button className="cp-icon" type="button" onClick={()=>setDark(!dark)} aria-label={dark?'Use light campaigns theme':'Use dark campaigns theme'}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button></div>
    <header className="cp-heading"><div className="cp-heading-copy"><span className="cp-kicker"><img src="/logo-transparent.png" width="22" height="22" alt=""/>{live?`Campaigns${clientName?` / ${clientName}`:''}`:'Campaigns / Marina Social Club'}</span><h1>One idea.<br/><em>Every expression.</em></h1><p>Bring the brief, visuals, posts, and approvals into one clear working campaign.</p></div>{!live&&<div className="cp-heading-art" aria-hidden="true">{heroVisuals.map((post,index)=><div className={`cp-hero-card cp-hero-card-${index+1}`} key={post.id}><Artwork live={live} post={post}/></div>)}<div className="cp-hero-note"><span>{campaign?'Active campaign':'Visual campaign worlds'}</span><strong>{campaign?.name||'Plan it. See it. Ship it.'}</strong></div></div>}<div className="cp-heading-actions"><div className="cp-heading-metrics"><span><strong>{counts.campaigns}</strong> campaign worlds</span>{!live&&<span><strong>{counts.posts}</strong> planned posts</span>}</div>{canCreate && !creating && <button ref={newRef} type="button" className="cp-button cp-primary" data-publishing-action="true" onClick={openForm}><Plus size={18} aria-hidden="true"/>Build campaign</button>}</div></header>
    {(loaded.error || planner.error) && <p className="cp-error" role="alert">{loaded.error || planner.error}</p>}
    {notice && <p className="cp-notice" role="status"><Check size={17} aria-hidden="true"/>{notice}</p>}
    {creating ? <section className="cp-create" aria-labelledby="cp-create-title"><div className="cp-create-intro"><span className="cp-eyebrow">Start with the brief</span><h2 id="cp-create-title">What are we bringing together?</h2><p>Name the idea, set its goal, and give it a date range.</p><p className="cp-safety">{live?'This saves the campaign to this workspace. Linking posts and the full campaign workflow will be designed later.':'This saves a private draft brief in this browser only. Linking posts and the full campaign workflow will be designed later.'}</p></div><form ref={formRef} onSubmit={save} noValidate>
      <div className="cp-field"><label htmlFor="cp-name">Campaign name</label><input id="cp-name" name="name" required maxLength={80} value={form.name} onChange={e=>update('name',e.target.value)} placeholder="For example, the autumn menu" aria-invalid={!!errors.name} aria-describedby={errors.name?'cp-name-error':undefined}/>{errors.name&&<span id="cp-name-error" className="cp-field-error">{errors.name}</span>}</div>
      <div className="cp-field"><label htmlFor="cp-goal">What should this campaign achieve?</label><textarea id="cp-goal" name="goal" required maxLength={400} rows={4} value={form.goal} onChange={e=>update('goal',e.target.value)} placeholder="Describe the purpose, not just the posts." aria-invalid={!!errors.goal} aria-describedby={errors.goal?'cp-goal-error':undefined}/>{errors.goal&&<span id="cp-goal-error" className="cp-field-error">{errors.goal}</span>}</div>
      <div className="cp-date-fields">{[['start','Start date'],['end','End date']].map(([key,label])=><div key={key} className="cp-field"><label htmlFor={`cp-${key}`}>{label}</label><input id={`cp-${key}`} type="date" required min={key==='end' && form.start?form.start:'2000-01-01'} max="2100-12-31" value={form[key]} onChange={e=>update(key,e.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key]?`cp-${key}-error`:undefined}/>{errors[key]&&<span id={`cp-${key}-error`} className="cp-field-error">{errors[key]}</span>}</div>)}</div>
      {saveError&&<p className="cp-error" role="alert">{saveError}</p>}{mobileWeb&&<p className="cp-safety">Desktop is needed to save. Your unsaved brief stays here while this form is open.</p>}
      {discard?<div className="cp-discard" role="group" aria-label="Unsaved campaign brief"><p>Discard this unsaved brief?</p><button type="button" className="cp-button" onClick={()=>setDiscard(false)}>Keep editing</button><button type="button" className="cp-button" onClick={()=>cancel(true)}>Discard brief</button></div>:<div className="cp-form-actions"><button type="button" className="cp-button" onClick={()=>cancel()}>Cancel</button>{canCreate&&<button type="submit" className="cp-button cp-primary" data-publishing-action="true">{live?'Save campaign':'Save draft brief'}<ArrowRight size={17} aria-hidden="true"/></button>}</div>}
    </form></section>:<>
      <div className="cp-campaign-toolbar"><section className="cp-month-bar" ref={monthRef} aria-label="Browse campaigns by month"><div className="cp-month-nav"><button className="cp-icon" type="button" aria-label="Previous month" disabled={monthKey(cursor)==='2000-01'} onClick={()=>changeMonth(new Date(cursor.getFullYear(),cursor.getMonth()-1,1))}><ChevronLeft size={20}/></button><h2>{monthLabel(cursor)}</h2><button className="cp-icon" type="button" aria-label="Next month" disabled={monthKey(cursor)==='2100-12'} onClick={()=>changeMonth(new Date(cursor.getFullYear(),cursor.getMonth()+1,1))}><ChevronRight size={20}/></button></div><div className="cp-month-jump"><MonthPicker value={cursor} onChange={changeMonth}/><button className="cp-button" type="button" onClick={()=>changeMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1))}>This month</button></div></section><div className="cp-collection" role="status"><span><strong>{counts.campaigns}</strong> {counts.campaigns===1?'campaign world':'campaign worlds'}{live?null:<>{' '}<span aria-hidden="true">·</span> <strong>{counts.posts}</strong> planned posts</>}</span><span>Visible throughout the campaign date range</span></div></div>
      {selected&&!campaign&&<p className="cp-error">That campaign is not available in this month. Choose a campaign below or browse another month.</p>}
      {!campaign&&visibleCampaigns.length>0&&<nav className="cp-index" ref={indexRef} tabIndex={-1} aria-label="Choose a campaign">{visibleCampaigns.map((item,index)=>{const related=postsForCampaign(item,planner.data.posts);return <button type="button" key={item.id} aria-label={`View campaign: ${item.name}`} onClick={()=>openCampaign(item)}>{live?(item.statusLabel?<span className="cp-index-top">{item.statusLabel}</span>:null):<span className="cp-index-top">{item.sample?'Sample brief':'Draft brief'}</span>}<i className="cp-index-number" aria-hidden="true">0{index+1}</i><div className="cp-index-art" aria-hidden="true">{related[0]?<Artwork live={live} post={related[0]}/>:<div className="cp-brief-cover"><Target size={28}/><span>Your campaign brief</span></div>}</div><span className="cp-index-name">{item.name}</span><span className="cp-index-meta">{rangeLabel(item)}</span>{!live&&<span className="cp-index-meta">{postCount(related.length)}</span>}<span className="cp-index-action">Open campaign <ArrowRight size={16} aria-hidden="true"/></span></button>;})}</nav>}
      {!campaign&&!visibleCampaigns.length&&<section className="cp-empty-month" aria-labelledby="cp-empty-title"><div className="cp-empty-copy"><span className="cp-eyebrow">A quiet month</span><CalendarDays size={28} aria-hidden="true"/><h2 id="cp-empty-title">No campaigns in {monthLabel(cursor)}.</h2><p>Campaigns appear here when their date range covers this month. Browse another month without changing or deleting anything.</p>{!live&&<><p>The sample campaigns live in August 2026, where you can see how a brief becomes one visual world.</p><button type="button" className="cp-button" onClick={()=>changeMonth(parseCalendarMonth(CAMPAIGN_SAMPLE_MONTH))}>View August 2026 sample campaigns<ArrowRight size={17} aria-hidden="true"/></button></>}</div>{!!emptyVisuals.length&&<div className="cp-empty-visuals" aria-label="Sample campaign visual direction">{emptyVisuals.map((post,index)=><figure key={post.id}><Artwork live={live} post={post}/><figcaption><span>0{index+1}</span>{post.title}</figcaption></figure>)}</div>}</section>}
      {campaign&&<section id="cp-detail" ref={detailSectionRef} className="cp-detail" aria-labelledby="cp-detail-title">
        <div className="cp-detail-nav"><button type="button" className="cp-text-link" onClick={backToCampaigns}><ArrowLeft size={17} aria-hidden="true"/>Back to campaigns</button><div><span>{campaignIndex+1} of {visibleCampaigns.length}</span><button className="cp-icon" type="button" aria-label="Previous campaign" disabled={campaignIndex===0} onClick={()=>openCampaign(visibleCampaigns[campaignIndex-1])}><ChevronLeft size={18}/></button><button className="cp-icon" type="button" aria-label="Next campaign" disabled={campaignIndex===visibleCampaigns.length-1} onClick={()=>openCampaign(visibleCampaigns[campaignIndex+1])}><ChevronRight size={18}/></button></div></div>
        <div className="cp-feature"><div className="cp-brief"><span className="cp-eyebrow">{live?'The campaign brief':(campaign.sample?'The campaign brief':'Private draft brief')}</span><h2 id="cp-detail-title" ref={detailRef} tabIndex={-1}>{campaign.name}</h2>{campaign.goal?<p className="cp-goal">{campaign.goal}</p>:null}<dl className="cp-facts"><div><dt><CalendarDays size={16} aria-hidden="true"/>Dates</dt><dd>{campaign.start&&campaign.end?<>{dateLabel(campaign.start)}<span className="cp-date-to"> to </span>{dateLabel(campaign.end)}</>:'No dates set'}</dd></div>{!live&&<div><dt><Target size={16} aria-hidden="true"/>Content progress</dt><dd>{posts.length?`${approved} of ${posts.length} posts approved`:'No posts linked yet'}</dd></div>}</dl>{posts.length>0&&<><div className="cp-progress" aria-hidden="true"><span style={{width:`${approved/posts.length*100}%`}}/></div><p className="cp-progress-note">Approval is a content status, not a publishing confirmation.</p></>}</div>
      {sheet.length>0?<div className="cp-contact-sheet" aria-label="Campaign artwork">{sheet.map(post=><figure key={post.id}><Artwork live={live} post={post}/><figcaption><span>{post.format}</span><Network platform={post.platform}/></figcaption></figure>)}</div>:live?null:<div className="cp-empty-brief"><span className="cp-eyebrow">The idea is saved</span><h3>The content comes next.</h3><p>This is a draft brief. Post linking is not available in this design yet. Your existing Planner content stays unchanged.</p><a className="cp-text-link" href={plannerUrl}>Browse Planner<ArrowRight size={17} aria-hidden="true"/></a></div>}</div>
      {posts.length>0&&<section className="cp-post-section" aria-labelledby="cp-post-title"><header><h3 id="cp-post-title">Posts in this campaign <span>{posts.length}</span></h3><a className="cp-text-link" href={plannerUrl}>Open Planner<ArrowRight size={17} aria-hidden="true"/></a></header><ul className="cp-posts">{posts.map(post=>{const stage=plannerStage(post,planner.data);return <li key={post.id}><div className="cp-thumbnail"><Artwork live={live} post={post} compact/></div><div className="cp-post-title"><strong>{post.title}</strong><span><Network platform={post.platform}/><span aria-hidden="true">·</span>{post.format}</span></div><span className={`cp-status cp-status-${stage}`}><i aria-hidden="true"/>{PLANNER_STAGES[stage]}</span><time dateTime={`${monthKey(cursor)}-${String(post.day).padStart(2,'0')}T${post.time}:00+03:00`}>{new Date(cursor.getFullYear(),cursor.getMonth(),post.day).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}<span>{post.time} GMT+3</span></time></li>;})}</ul></section>}
      </section>}<footer className="cp-footer"><p>Campaigns organize the idea. Planner holds the posts. Calendar brings them to your client.</p><a className="cp-text-link" href={calendarUrl}>View calendar<ArrowRight size={17} aria-hidden="true"/></a></footer>
    </>}
  </main>;
}
