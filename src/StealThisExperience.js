import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Bookmark,Check,ChevronLeft,ChevronRight,Heart,Layers,MessageCircle,Moon,Play,Search,Sun} from 'lucide-react';
import {FaInstagram,FaTiktok} from 'react-icons/fa';
import {COMPETITOR_KEY,COMPETITOR_MONTHS,COMPETITOR_NETWORKS,monthName,readCompetitorSaved,saveCompetitorIdea} from './competitorPreviewModel';
import {INSPIRATION_FORMATS,inspirationPosts,inspirationById,filterInspiration,inspirationTakeaway,inspirationBrief,saveInspirationBrief,readInspirationRoute} from './inspirationPreviewModel';
import './steal-this-experience.css';

function IdeaArt({post,decorative=false}) {
  return <div className={`sp-art sp-look-${post.look}`} role={decorative?undefined:'img'} aria-hidden={decorative?true:undefined} aria-label={decorative?undefined:`Illustrative artwork for ${post.accountName}: ${post.title}`}>
    <span className="sp-art-brand">{post.accountName}</span>
    <svg className="sp-art-lines" viewBox="0 0 400 460" aria-hidden="true">
      {post.look==='olive'?<><path d="M90 460V278 M65 242V291Q90 338 115 291V242 M240 190Q375 228 260 390Q145 289 240 190 M240 220L283 459"/><path d="M290 142Q368 171 319 256Q230 221 290 142"/></>:post.look==='afterglow'?<><circle cx="294" cy="210" r="72"/><path d="M-50 325Q50 265 150 325T350 325T550 325 M-50 350Q50 290 150 350T350 350T550 350 M-50 375Q50 315 150 375T350 375T550 375 M-50 400Q50 340 150 400T350 400T550 400"/></>:<><path d="M0 280Q90 215 180 280T360 280T540 280 M0 310Q90 245 180 310T360 310T540 310 M0 340Q90 275 180 340T360 340T540 340 M0 370Q90 305 180 370T360 370T540 370 M0 400Q90 335 180 400T360 400T540 400"/><path d="M291 35V177M219 106H363"/></>}
    </svg>
    <strong>{post.title}</strong><span className="sp-art-note">A little inspiration.<br/>A direction of your own.</span>
    <span className="sp-format-mark">{['Reel','Video'].includes(post.format)?<Play size={14}/>:post.format==='Carousel'?<Layers size={14}/>:null}{post.format}</span>
  </div>;
}
function IdeaFace({post,decorative=false,live=false}) {
  if(!live)return <IdeaArt post={post} decorative={decorative}/>;
  return post.thumbnail
    ?<img className="sp-art sp-art-live" src={post.thumbnail} alt={decorative?'':`Post by ${post.accountName}`} loading="lazy"/>
    :<div className="sp-art sp-art-live sp-art-empty" role={decorative?undefined:'img'} aria-hidden={decorative?true:undefined} aria-label={decorative?undefined:`No image for this post by ${post.accountName}`}><span>No image</span></div>;
}
// Live posts carry only a caption, an account and their counts, so that is all the search reads.
function filterLivePosts(posts,query) {
  const search=String(query||'').trim().toLowerCase();
  return (posts||[]).filter(post=>!search||`${post.title} ${post.accountName} ${post.caption}`.toLowerCase().includes(search));
}
// Live mode has no title, format, month, takeaway or ready-made brief behind a post, so
// the format filter, month selector, illustration and pre-filled brief stay sample-only.
export default function StealThisExperience({dark=false,setDark=()=>{},onOpenStudio=()=>{},onOpenCompetitors=()=>{},livePosts=null,liveSaved=null,liveError='',liveLoading=false,clientName='',onSaveIdea=null,onSaveBrief=null,onPlatformChange=null}) {
  const [route,setRoute]=useState(()=>readInspirationRoute(window.location.search));
  const [saved,setSaved]=useState(readCompetitorSaved);
  const [drafts,setDrafts]=useState({}),[savedDrafts,setSavedDrafts]=useState({});
  const [notice,setNotice]=useState(''),[error,setError]=useState('');
  const titleRef=useRef(null),briefRef=useRef(null),galleryRef=useRef(null),lastPost=useRef('');
  const live=livePosts!==null&&livePosts!==undefined;
  const savedItems=live?(liveSaved||[]):saved.ideas,storeError=live?'':saved.error;
  const post=live?([...(livePosts||[]),...(liveSaved||[])].find(item=>item.id===route.postId)||null):inspirationById(route.postId);
  const dirty=Object.keys(drafts).some(id=>drafts[id]!==savedDrafts[id]);
  const base=route.view==='saved'?(live?savedItems:saved.ideas.map(idea=>inspirationById(idea.id)).filter(Boolean)):(live?livePosts:inspirationPosts(route.platform,route.month));
  const posts=live?filterLivePosts(base,route.query):filterInspiration(base,route.format,route.query);
  const isSaved=id=>savedItems.some(idea=>idea.id===id);
  const draft=post?(drafts[post.id]??(live?'':inspirationBrief(post))):'';
  const emptyKind=posts.length?'':(route.view==='saved'&&!savedItems.length?'saved':(live&&route.view==='discover'&&!route.query.trim()?'nolive':'filters'));
  useEffect(()=>{const pop=()=>{setRoute(readInspirationRoute(window.location.search));setError('');setNotice('');};window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);},[]);
  useEffect(()=>{const refresh=()=>setSaved(readCompetitorSaved());const sync=e=>{if(e.key===COMPETITOR_KEY||e.key===null)refresh();};window.addEventListener('focus',refresh);window.addEventListener('storage',sync);return()=>{window.removeEventListener('focus',refresh);window.removeEventListener('storage',sync);};},[]);
  useEffect(()=>{if(live&&onPlatformChange)onPlatformChange(route.platform);},[live,route.platform]);
  useEffect(()=>{if(!dirty)return;const warn=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  useEffect(()=>{if(route.postId){titleRef.current?.focus();lastPost.current=route.postId;}else if(lastPost.current){const target=[...(galleryRef.current?.querySelectorAll('[data-idea-id]')||[])].find(item=>item.dataset.ideaId===lastPost.current);(target||titleRef.current)?.focus();}},[route.postId]);
  function navigate(patch,push=false) {
    const next={...route,...patch};setRoute(next);setError('');setNotice('');
    const url=new URL(window.location.href);
    Object.entries({ideaPlatform:next.platform,ideaMonth:next.month,ideaView:next.view,ideaFormat:next.format,ideaSearch:next.query,idea:next.postId}).forEach(([key,value])=>value?url.searchParams.set(key,value):url.searchParams.delete(key));
    window.history[push?'pushState':'replaceState']({},'',url);
  }
  function saveIdea(item) {if(live){const outcome=onSaveIdea?onSaveIdea(item):null;if(!outcome||!outcome.ok){setError((outcome&&outcome.error)||'This post could not be saved.');return;}setError('');setNotice(outcome.alreadySaved?'This post is already in your saved ideas.':`“${item.title}” saved. Find it in Saved ideas or Competitor Insights.`);return;}const result=saveCompetitorIdea(item);if(!result.ok){setError(result.error);return;}setSaved({accounts:result.accounts,ideas:result.ideas,error:''});setError('');setNotice(`“${item.title}” saved. Find it in Saved ideas or Competitor Insights.`);}
  function saveBrief(open=false) {
    // saveInspirationBrief only accepts sample ids, so live briefs take the wrapper's path.
    if(live){const outcome=onSaveBrief?onSaveBrief(post,draft):null;if(!outcome||!outcome.ok){setError((outcome&&outcome.error)||'This brief could not be saved.');briefRef.current?.focus();return;}setSavedDrafts(current=>({...current,[post.id]:draft}));setError('');setNotice(outcome.alreadySaved?'This version is already saved.':'Brief saved in this browser.');if(open)onOpenStudio(outcome.id||'');return;}
    const result=saveInspirationBrief(post.id,draft);if(!result.ok){setError(result.error);briefRef.current?.focus();return;}
    setSavedDrafts(current=>({...current,[post.id]:draft}));setError('');setNotice(result.alreadySaved?'This version is already saved in AI Studio.':'Brief saved in AI Studio. Your earlier versions are kept.');
    if(open)onOpenStudio(result.id);
  }
  return <main className="tw-steal-experience" data-inspiration-theme={dark?'dark':'light'}>
    <div className="sp-preview"><span>{live?(liveLoading?'Reading your competitors’ recent posts…':`Public posts from your competitors${clientName?` · ${clientName}`:''}`):'Design preview · Fictional examples · No live scans'}</span><button className="sp-icon" aria-label={dark?'Use light inspiration theme':'Use dark inspiration theme'} onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button></div>
    <header className="sp-heading"><div><span className="sp-kicker"><img src="/logo-transparent.png" alt="" width="22" height="22"/>{live?(clientName?`${clientName} / The inspiration shelf`:'The inspiration shelf'):'Marina Social Club / The inspiration shelf'}</span><h1>Steal This</h1><p>Borrow the spark. Make something that’s yours.</p></div><button className="sp-text" onClick={onOpenCompetitors}>Manage competitors<ArrowRight size={16} aria-hidden="true"/></button></header>
    <div className="sp-feedback" role="status">{notice}</div>
    {(error||storeError||liveError)&&<p id="sp-error" className="sp-error" role="alert">{error||storeError||liveError}</p>}
    {route.postId?<>
      <button className="sp-text sp-back" onClick={()=>navigate({postId:''},true)}><ArrowLeft size={17} aria-hidden="true"/>Back to {route.view==='saved'?'saved ideas':'Discover'}</button>
      {!post?<section className="sp-empty"><h2 ref={titleRef} tabIndex={-1}>This example isn’t available.</h2><p>Return to Discover to choose an example from the preview library.</p></section>:<section className="sp-detail" aria-label="Adapt an example">
        <figure><IdeaFace post={post} live={live}/><figcaption>{live?'Their post, shown for reference. Create your own image.':'Illustrative artwork, not an imported social post.'}</figcaption><button className="sp-text" disabled={isSaved(post.id)||!!storeError} onClick={()=>saveIdea(post)}>{isSaved(post.id)?<Check size={17} aria-hidden="true"/>:<Bookmark size={17} aria-hidden="true"/>}{isSaved(post.id)?'Idea saved':'Save idea for later'}</button></figure>
        <div className="sp-adapt"><span className="sp-eyebrow">{[post.accountName,COMPETITOR_NETWORKS[post.platform],live?null:monthName(post.month)].filter(Boolean).join(' · ')}</span><h2 ref={titleRef} tabIndex={-1}>{post.title}</h2>{post.caption&&(!live||post.caption!==post.title)?<p className="sp-reference-caption">{post.caption}</p>:null}
          <details className="sp-source"><summary>{live?'About this post':'About this example'}</summary><p>{live?'A public post from an account on your competitor list, with the likes and comments its profile showed when we read it. It is not proof that a format performs better.':'Fictional account and sample numbers. This is not a live ranking or proof that a format performs better.'}</p><div className="sp-example-stats">{post.likes!=null?<span><Heart size={15} aria-hidden="true"/>{post.likes.toLocaleString()} {live?'likes':'sample likes'}</span>:null}{post.comments!=null?<span><MessageCircle size={15} aria-hidden="true"/>{post.comments} {live?'comments':'sample comments'}</span>:null}{live&&post.url?<a className="sp-text" href={post.url} target="_blank" rel="noreferrer noopener">Open the original</a>:null}</div></details>
          {!live&&<div className="sp-takeaway"><span className="sp-eyebrow">The idea to borrow</span><p>{inspirationTakeaway(post)}</p></div>}
          <form onSubmit={e=>{e.preventDefault();saveBrief(true);}}><div className="sp-brief-heading"><h3>{live?(clientName?`Make it ${clientName}.`:'Make it yours.'):'Make it Marina.'}</h3><span>Your original direction</span></div><label htmlFor="sp-brief">Creative brief</label><textarea id="sp-brief" ref={briefRef} value={draft} rows={9} maxLength={6000} aria-invalid={error?true:undefined} aria-describedby={error?'sp-brief-help sp-error':'sp-brief-help'} onChange={e=>{setDrafts(current=>({...current,[post.id]:e.target.value}));setError('');setNotice('');}}/><p id="sp-brief-help" className="sp-help">{live?'Write your own direction for this client. Save to keep it in this browser. No content is generated or published here.':'Edit the idea for your client. Save to keep it in this browser. No content is generated or published here.'}</p><div className="sp-actions"><button type="submit" className="sp-button sp-primary">Continue in AI Studio<ArrowRight size={17} aria-hidden="true"/></button><button type="button" className="sp-text" onClick={()=>saveBrief(false)}><Bookmark size={16} aria-hidden="true"/>Save brief</button></div></form>
        </div>
      </section>}
    </>:<>
      <nav className="sp-tabs" aria-label="Inspiration library"><button aria-pressed={route.view==='discover'} onClick={()=>navigate({view:'discover'})}>Discover</button><button aria-pressed={route.view==='saved'} onClick={()=>navigate({view:'saved'})}><Bookmark size={16} aria-hidden="true"/>Saved ideas <span>{savedItems.length}</span></button></nav>
      <div className="sp-controls"><div className="sp-search"><label htmlFor="sp-search">Find an idea</label><div><Search size={17} aria-hidden="true"/><input id="sp-search" type="search" placeholder="Search ideas or accounts" maxLength={100} value={route.query} onChange={e=>navigate({query:e.target.value})}/></div></div>{route.view==='discover'?<><div className="sp-platforms" role="group" aria-label="Inspiration platform"><button aria-pressed={route.platform==='ig'} onClick={()=>navigate({platform:'ig',format:'all'})}><FaInstagram aria-hidden="true"/>Instagram</button><button aria-pressed={route.platform==='tt'} onClick={()=>navigate({platform:'tt',format:'all'})}><FaTiktok aria-hidden="true"/>TikTok</button></div>{!live&&<div className="sp-month"><label htmlFor="sp-month">Sample month</label><div><button className="sp-icon" aria-label="Previous inspiration month" disabled={route.month===COMPETITOR_MONTHS[0]} onClick={()=>navigate({month:COMPETITOR_MONTHS[0]})}><ChevronLeft size={18}/></button><select id="sp-month" value={route.month} onChange={e=>navigate({month:e.target.value})}>{COMPETITOR_MONTHS.map(month=><option key={month} value={month}>{monthName(month)}</option>)}</select><button className="sp-icon" aria-label="Next inspiration month" disabled={route.month===COMPETITOR_MONTHS[1]} onClick={()=>navigate({month:COMPETITOR_MONTHS[1]})}><ChevronRight size={18}/></button></div></div>}</>:<p className="sp-saved-hint">{live?'Kept in this browser for this client.':'Kept across months and platforms.'}<br/>Shared with your Competitor Insights saved ideas.</p>}</div>
      <div className="sp-filterbar">{live?null:<div role="group" aria-label="Content format">{INSPIRATION_FORMATS.filter(([key])=>route.view==='saved'||route.platform!=='tt'||['all','video'].includes(key)).map(([key,label])=><button key={key} aria-pressed={route.format===key} onClick={()=>navigate({format:key})}>{label}</button>)}</div>}<span role="status">{posts.length} {route.view==='saved'?'saved ideas':(live?(posts.length===1?'post':'posts'):'examples')}</span></div>
      <section className="sp-gallery" ref={galleryRef} aria-label={route.view==='saved'?'Saved inspiration':'Content inspiration'}>{posts.map(item=><article key={item.id} className="sp-item"><button className="sp-open" data-idea-id={item.id} aria-label={`Explore ${item.title}`} onClick={()=>navigate({postId:item.id},true)}><IdeaFace post={item} decorative live={live}/><span className="sp-item-source">{item.accountName}<span>{COMPETITOR_NETWORKS[item.platform]}</span></span><h2>{item.title}</h2><span className="sp-item-action">Make it yours<ArrowRight size={17} aria-hidden="true"/></span></button><button className="sp-save sp-icon" aria-label={`${isSaved(item.id)?'Saved':'Save idea'}: ${item.title}`} disabled={isSaved(item.id)||!!storeError} onClick={()=>saveIdea(item)}>{isSaved(item.id)?<Check size={18}/>:<Bookmark size={18}/>}</button></article>)}</section>
      {!posts.length&&<section className="sp-empty"><Bookmark size={27} aria-hidden="true"/><h2 ref={titleRef} tabIndex={-1}>{emptyKind==='saved'?'Build your own inspiration shelf.':emptyKind==='nolive'?(liveLoading?'Reading their posts…':'No competitor posts yet.'):'No ideas match these filters.'}</h2><p>{emptyKind==='saved'?(live?'Save a post in Discover, then return to it when you are ready to create.':'Save an example in Discover, then return to it when you are ready to create.'):emptyKind==='nolive'?(liveLoading?'This takes a moment.':'Add competitor handles in Competitor Insights. Their most engaging recent posts appear here.'):(live?'Try another account, or clear your search to see everything we could read.':'Try another format or account, or clear your search to see the full selection.')}</p>{emptyKind==='nolive'?<button className="sp-button" onClick={onOpenCompetitors}>Manage competitors<ArrowRight size={17} aria-hidden="true"/></button>:<button className="sp-button" onClick={()=>navigate({query:'',format:'all',...(!savedItems.length?{view:'discover'}:{})})}>{emptyKind==='saved'?'Explore examples':'Clear filters'}</button>}</section>}
    </>}
    <footer className="sp-footer"><span>Ideas to adapt. Never content to copy.</span><span>{live?'Public posts · Saved in this browser only':'Sample library · Saved in this browser only'}</span></footer>
  </main>;
}
