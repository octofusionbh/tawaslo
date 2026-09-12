import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {
  ArrowRight,BadgeDollarSign,BarChart3,BriefcaseBusiness,Building2,CalendarDays,Check,ChevronDown,Coffee,Database,
  CircleCheckBig,Clock3,Globe2,Image as ImageIcon,KeyRound,LayoutDashboard,Link2,LockKeyhole,LogIn,Mail,Menu,MessageCircle,
  MessagesSquare,Pause,Play,PlayCircle,Plus,Send,ShieldCheck,Shirt,ShoppingBag,Store,UsersRound,UtensilsCrossed,X
} from 'lucide-react';
import {FaFacebook,FaInstagram,FaLinkedin,FaTiktok,FaYoutube} from 'react-icons/fa';
import './marketing-experience.css';
import DashboardOverview from './DashboardOverview';
import PlannerExperience from './PlannerExperience';
import InboxExperience from './InboxExperience';
import publisherGoldenHour from './assets/planner-golden-hour.png';

const NAV=[['home','Home'],['platform','Platform'],['solutions','Who it’s for'],['pricing','Pricing']];
const SITE_PATHS={home:'/',platform:'/platform',solutions:'/who-its-for',pricing:'/pricing',security:'/security',faq:'/faq',contact:'/contact',privacy:'/privacy',terms:'/terms'};
const SITE_PAGES=Object.fromEntries(Object.entries(SITE_PATHS).map(([page,path])=>[path,page]));
const SITE_META={
  home:{title:'Tawaslo | Social intelligence for agencies & brands',description:'Plan, publish, respond and measure customer growth in one calm social media workspace.'},
  platform:{title:'Tawaslo Platform | One connected social workspace',description:'See how Tawaslo connects planning, publishing, conversations, customer growth and reporting.'},
  solutions:{title:'Tawaslo for agencies, brands and local businesses',description:'A focused social media workspace shaped for agencies, freelancers, brands, hospitality and service teams.'},
  pricing:{title:'Tawaslo Pricing | Start with 30 days free',description:'Compare clear Tawaslo plans for independent businesses, growing teams, agencies and white-label studios.'},
  security:{title:'Security at Tawaslo | Clear access and control',description:'Learn how Tawaslo approaches workspace separation, roles, connected accounts and human review.'},
  faq:{title:'Tawaslo FAQ | Useful answers before you begin',description:'Answers about Tawaslo workspaces, trials, languages, approvals, teams and connected social accounts.'},
  contact:{title:'Contact Tawaslo | Tell us what you manage',description:'Talk to Tawaslo about your brands, team and social media workflow.'},
  privacy:{title:'Tawaslo Privacy Policy',description:'How Tawaslo handles account details, connected platforms, content and service data.'},
  terms:{title:'Tawaslo Terms of Service',description:'The terms that apply when using Tawaslo and connected social platforms.'},
  notfound:{title:'Page not found | Tawaslo',description:'The page you requested could not be found.'},
};
const PLANS=[
  {id:'starter',name:'Essential',price:49,yearly:39,note:'For independent businesses',limits:'3 social accounts · 1 teammate',features:['Publishing and planning','Unified social inbox','AI captions in English and Arabic','Analytics and monthly reports']},
  {id:'pro',name:'Professional',price:99,yearly:79,note:'For growing teams',limits:'10 social accounts · 5 teammates',featured:true,features:['Everything in Essential','Brand voice and AI tools','Campaigns and approvals','Guest growth tools and priority support']},
  {id:'agency',name:'Enterprise',price:199,yearly:159,note:'For agencies and portfolios',limits:'Unlimited social accounts · 20 teammates',features:['Everything in Professional','Multi-client workspaces','Advanced reports and permissions','Dedicated support']},
  {id:'studio',name:'Studio',price:459,yearly:367,note:'For white-label agencies',limits:'Your identity across the experience',features:['Everything in Enterprise','Your logo and brand colours','Branded dashboards and client pages','Priority onboarding']},
];

const PLAN_COMPARISON=[
  ['Social accounts','3','10','Unlimited','Unlimited'],
  ['Team members','1','5','20','20'],
  ['Publisher and Planner',true,true,true,true],
  ['Unified inbox',true,true,true,true],
  ['AI captions in English and Arabic',true,true,true,true],
  ['Campaigns and approvals',false,true,true,true],
  ['Guest growth tools',false,true,true,true],
  ['Multi-client workspaces',false,false,true,true],
  ['Advanced reports and permissions',false,false,true,true],
  ['White-label workspace',false,false,false,true],
  ['Priority onboarding',false,false,false,true],
];

const PLATFORM_GROUPS=[
  [CalendarDays,'Create and publish','Move every post from first draft to live.',['Publisher','Visual Planner','Client approvals','Campaigns','AI Studio','Media library','Paid ads']],
  [MessagesSquare,'Respond to customers','Keep comments, messages and reviews in one focused queue.',['Unified inbox','Comments and direct messages','Conversation ownership','Suggested replies','Reviews','Social listening']],
  [ShoppingBag,'Turn attention into action','Connect social discovery to links, orders, bookings and loyalty.',['Link in bio','Living menu','Pickup orders','Reservations','Loyalty','Guest CRM','Customer campaigns']],
  [BarChart3,'Measure what moved','See the content, conversations and customer actions that changed the result.',['Live dashboard','Analytics','Reports','Competitor insights','Client workspaces','Team access','Social accounts and billing']],
];

const SOCIAL_PLATFORMS=[[FaInstagram,'Instagram'],[FaFacebook,'Facebook'],[FaLinkedin,'LinkedIn'],[FaTiktok,'TikTok'],[FaYoutube,'YouTube']];

const FAQS=[
  ['Is Tawaslo only for restaurants?','No. Tawaslo supports agencies, shops, product brands, cafés, restaurants, venues and service businesses. Hospitality tools appear only when the business needs them.'],
  ['Can I manage more than one client or brand?','Yes. Each business has its own workspace, connected accounts, permissions, content, customer tools and reporting.'],
  ['Does it work in Arabic?','Yes. The workspace supports English and Arabic content, including AI-assisted writing and right-to-left workflows.'],
  ['What can I manage from one workspace?','Social publishing, planning, approvals, inbox conversations, analytics, link-in-bio pages, campaigns, media and customer journeys. Commerce, booking and loyalty tools can be enabled when relevant.'],
  ['Is there a free trial?','Yes. The preview plan includes 30 days with no card required. Usage limits are shown clearly before you upgrade.'],
  ['How is client and customer data protected?','Workspaces use account-level access controls, scoped team permissions and secure connections. You control which external accounts remain connected.'],
  ['Do I need to use every feature?','No. Tawaslo should feel focused. Your setup journey chooses the modules that match your business, and the rest stay out of the way.'],
  ['Can my team and clients approve content?','Yes. Teams can prepare work while clients review, approve or request changes through a clear, controlled journey.'],
];

const INDUSTRIES=[
  [Shirt,'Retail & products','Launch collections, answer product questions and bring customers back.'],
  [Coffee,'Cafés','Connect content, menus, pickup, loyalty and reviews without operational clutter.'],
  [UtensilsCrossed,'Restaurants & venues','Turn discovery into bookings, orders and better guest relationships.'],
  [BriefcaseBusiness,'Agencies','Move across client workspaces without losing approvals, reporting or context.'],
  [Store,'Local businesses','Stay visible, answer faster and make every link useful.'],
  [UsersRound,'Service brands','Turn conversations into qualified enquiries and measurable customer journeys.'],
];

const CLIENT_BENEFITS=[
  [CalendarDays,'The week stays visible','Plans, approvals and scheduled work stay clear without another status meeting.','Plan with confidence'],
  [Check,'Clients approve faster','Give every client one focused review journey with the right context already attached.','Cut the chasing'],
  [MessagesSquare,'Every reply has an owner','Bring comments and messages into one queue so nothing useful gets lost between people.','Respond with clarity'],
  [BarChart3,'Results are easier to explain','Connect publishing, conversations and customer actions in a view clients can understand.','Show the outcome'],
];

const PUBLISHER_FLOW=[
  {label:'Create',title:'Caption and media ready',detail:'The post takes shape in one focused composer.'},
  {label:'Choose channels',title:'Instagram and Facebook selected',detail:'The preview adapts before anything goes live.'},
  {label:'Approve',title:'Approved by the client',detail:'Feedback and sign off stay beside the post.'},
  {label:'Publish',title:'Published successfully',detail:'The post is live and ready to measure.'},
];

const PLATFORM_TOUR=[
  {id:'planner',Icon:CalendarDays,label:'Planner',kicker:'Build and approve',title:'Build the month without rebuilding the brief.',copy:'Shape the content, keep feedback beside the work and know exactly what is ready to go live.',features:['Visual planner and calendar','AI-assisted captions and media','Client review and approval','Cross-channel scheduling']},
  {id:'inbox',Icon:MessagesSquare,label:'Inbox',kicker:'Answer and own',title:'Turn every message into owned work.',copy:'Bring comments, direct messages, mentions and reviews into one queue with the next reply already in context.',features:['Comments, DMs and mentions','AI replies in your brand voice','Assignment and response status','Reviews and social listening']},
];

const PLATFORM_LOOP=[
  [CalendarDays,'Plan','Shape the month'],
  [ImageIcon,'Create','Caption and media'],
  [CircleCheckBig,'Approve','Client signs off'],
  [Send,'Publish','Every channel'],
  [MessagesSquare,'Respond','One inbox'],
  [BarChart3,'Learn','Next move clear'],
];

function Brand(){return <span className="mk-brand"><img src="/logo192.png" width="32" height="32" alt=""/><i><strong>Tawaslo</strong><small>Social intelligence</small></i></span>}

function Action({children,onClick,kind='primary',Icon=ArrowRight}){return <button type="button" className={`mk-action mk-action-${kind}`} onClick={onClick}>{children}<Icon size={17} aria-hidden="true"/></button>}

// Vercel Web Analytics for the public site only, and only after the visitor
// turns Analytics on in the cookie banner. No script is loaded otherwise.
function SiteAnalytics(){
  useEffect(()=>{
    const storageKey='tw_cookie_preferences_v1';
    const allowed=()=>{try{return !!JSON.parse(localStorage.getItem(storageKey)||'{}').analytics}catch(_){return false}};
    const load=()=>{
      if(typeof document==='undefined')return;
      if(document.getElementById('tw-va'))return;
      const tag=document.createElement('script');
      tag.id='tw-va';tag.defer=true;tag.src='/_vercel/insights/script.js';
      document.head.appendChild(tag);
    };
    if(allowed())load();
    const onChange=event=>{if(event?.detail?.analytics)load()};
    window.addEventListener('tawaslo:consent-changed',onChange);
    return()=>window.removeEventListener('tawaslo:consent-changed',onChange);
  },[]);
  return null;
}

function CookieConsent(){
  const storageKey='tw_cookie_preferences_v1';
  const [open,setOpen]=useState(()=>{try{return !localStorage.getItem(storageKey)}catch(_){return true}});
  const [manage,setManage]=useState(false);
  const [analytics,setAnalytics]=useState(false);
  const [marketing,setMarketing]=useState(false);
  const save=(nextAnalytics,nextMarketing)=>{
    const preferences={necessary:true,analytics:!!nextAnalytics,marketing:!!nextMarketing,updatedAt:new Date().toISOString()};
    try{localStorage.setItem(storageKey,JSON.stringify(preferences))}catch(_){}
    if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('tawaslo:consent-changed',{detail:preferences}));
    setOpen(false);setManage(false);
  };
  useEffect(()=>{
    const show=()=>{let stored={};try{stored=JSON.parse(localStorage.getItem(storageKey)||'{}')}catch(_){}setAnalytics(!!stored.analytics);setMarketing(!!stored.marketing);setOpen(true);setManage(true)};
    window.addEventListener('tawaslo:manage-cookies',show);return()=>window.removeEventListener('tawaslo:manage-cookies',show);
  },[]);
  if(!open)return null;
  return <div className="mk-consent" role="region" aria-label="Cookie preferences">
    <div className="mk-consent-copy"><span>Your privacy, your choice</span><strong>Keep the useful cookies. Choose the rest.</strong><p>Necessary storage keeps the site working. Analytics and marketing stay off unless you switch them on.</p><a href="/privacy" onClick={()=>setOpen(false)}>Read the privacy policy</a></div>
    {manage&&<div className="mk-consent-options">
      <label><span><strong>Necessary</strong><small>Security, navigation and your saved preference.</small></span><input type="checkbox" checked disabled aria-label="Necessary cookies always on"/></label>
      <label><span><strong>Analytics</strong><small>Helps us understand which public pages are useful.</small></span><input type="checkbox" checked={analytics} onChange={event=>setAnalytics(event.target.checked)}/></label>
      <label><span><strong>Marketing</strong><small>Allows campaign attribution when it is introduced.</small></span><input type="checkbox" checked={marketing} onChange={event=>setMarketing(event.target.checked)}/></label>
    </div>}
    <div className="mk-consent-actions">
      {!manage&&<button type="button" onClick={()=>setManage(true)}>Manage</button>}
      <button type="button" onClick={()=>save(false,false)}>Necessary only</button>
      {manage?<button type="button" className="mk-consent-primary" onClick={()=>save(analytics,marketing)}>Save choices</button>:<button type="button" className="mk-consent-primary" onClick={()=>save(true,true)}>Accept all</button>}
    </div>
  </div>;
}

function SignalStage(){
  return <div className="mk-product-stage" aria-label="A preview of the Tawaslo workspace">
    <div className="mk-stage-orbit" aria-hidden="true"/>
    <div className="mk-product-window">
      <header><span className="mk-window-dots"><i/><i/><i/></span><strong>Marina Social Club</strong><span className="mk-live">Live workspace</span></header>
      <div className="mk-product-body">
        <aside aria-label="Workspace tools"><Brand/>{[[BarChart3,'Overview'],[CalendarDays,'Publisher'],[MessagesSquare,'Inbox'],[ShoppingBag,'Customers']].map(([Icon,label],index)=><span key={label} data-active={index===0?'true':'false'} title={label}><Icon size={15}/></span>)}</aside>
        <section className="mk-product-main">
          <div className="mk-product-welcome"><span><small>Monday, 9 September</small><strong>Good morning, Layla.</strong></span><button type="button"><Plus size={13}/>Create</button></div>
          <div className="mk-product-kpis"><article><small>Ready to publish</small><strong>12</strong><span>4 this week</span></article><article><small>Needs a reply</small><strong>5</strong><span>AI drafts ready</span></article><article><small>Customer actions</small><strong>84</strong><span>+18% this month</span></article></div>
          <div className="mk-product-grid">
            <article className="mk-mini-schedule"><header><span><CalendarDays size={14}/>Today’s plan</span><small>View calendar</small></header><div><time>10:30</time><span><i data-tone="coral"/>New collection reel<small>Instagram · Approved</small></span></div><div><time>14:00</time><span><i data-tone="aqua"/>Weekend story<small>Instagram · Ready</small></span></div><div><time>18:30</time><span><i data-tone="violet"/>Launch reminder<small>All channels · Scheduled</small></span></div></article>
            <article className="mk-mini-inbox"><header><span><MessagesSquare size={14}/>Inbox</span><b>5</b></header><div><i>NH</i><span><strong>Noor Hassan</strong><small>Do you deliver to Seef?</small></span></div><p><MessageCircle size={13}/><span><strong>Reply ready</strong><small>Yes, we deliver to Seef. Would you like today’s catalogue?</small></span></p><button type="button">Review reply <ArrowRight size={12}/></button></article>
            <article className="mk-mini-impact"><header><span>Journey impact</span><strong>Attention that moved</strong></header><div className="mk-mini-chart" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/></div><footer><span><i/>Discovery</span><span><i/>Customer action</span><strong>2.4×</strong></footer></article>
          </div>
        </section>
      </div>
    </div>
    <aside className="mk-float mk-float-approval"><span><Check size={13}/></span><div><small>Client approved</small><strong>Autumn launch</strong></div></aside>
    <aside className="mk-float mk-float-result"><span><BarChart3 size={15}/></span><div><small>Monthly impact</small><strong>+28% customer actions</strong></div></aside>
  </div>;
}

function DashboardSnapshots({setPage}){
  return <section className="mk-showcase" aria-label="Inside the Tawaslo workspace">
    <div className="mk-showcase-heading"><div><Eyebrow Icon={LayoutDashboard}>The product, not promises</Eyebrow><h2>See the work move.</h2></div><p>Every view keeps the next decision obvious: what to publish, who needs an answer, and which activity brought a customer closer.</p></div>
    <div className="mk-snapshot-grid">
      <article className="mk-snapshot mk-snapshot-publisher"><header><span><CalendarDays size={17}/>Publisher</span><small>12 posts ready</small></header><div className="mk-snap-toolbar"><span>This week</span><b>Plan · Create · Approve</b></div><div className="mk-snap-calendar">{['MON 09','TUE 10','WED 11','THU 12','FRI 13'].map((day,index)=><section key={day}><small>{day}</small>{index===0&&<i data-tone="coral">Collection launch<strong>10:30</strong></i>}{index===1&&<i data-tone="violet">Behind the brand<strong>14:00</strong></i>}{index===2&&<i data-tone="aqua">Customer story<strong>12:15</strong></i>}{index===3&&<i data-tone="coral">Weekend edit<strong>18:30</strong></i>}{index===4&&<i data-tone="violet">Friday recap<strong>16:00</strong></i>}</section>)}</div><footer><span><i/>Approved</span><span><i/>Ready</span><span><i/>Scheduled</span></footer></article>
      <article className="mk-snapshot mk-snapshot-inbox"><header><span><MessagesSquare size={17}/>Unified inbox</span><small>5 need replies</small></header><div className="mk-snap-conversation"><aside><span data-active="true"><i>NH</i><b>Noor Hassan<small>Product question</small></b></span><span><i>MA</i><b>Mariam Ali<small>Brand mention</small></b></span><span><i>Y</i><b>Yousef<small>Direct message</small></b></span></aside><section><small>Instagram comment</small><p>Do you deliver this collection to Seef?</p><div><MessageCircle size={14}/><span><strong>A reply in your brand voice</strong><small>Yes, we deliver to Seef. I can share the collection link with you now.</small></span></div><button type="button">Use this reply</button></section></div></article>
      <article className="mk-snapshot mk-snapshot-insights"><header><span><BarChart3 size={17}/>Analytics room</span><small>Last 30 days</small></header><div className="mk-snap-score"><span><small>Customer actions</small><strong>1,284</strong><em>+18.4%</em></span><span><small>Meaningful conversations</small><strong>346</strong><em>+12.1%</em></span></div><div className="mk-snap-bars" aria-hidden="true">{[42,58,49,73,67,86,94,78,100,92,116,125].map((height,index)=><i key={index} style={{'--height':`${height}px`}}/>)}</div><footer><span>Content → conversation → action</span><strong>Best result: Autumn launch</strong></footer></article>
    </div>
    <Action kind="outline" onClick={()=>setPage('platform')}>Explore the complete platform</Action>
  </section>;
}

const MARKETING_DASHBOARD_CLIENT={id:'preview-marina',name:'Marina Social Club',currency:'USD'};
const MARKETING_DASHBOARD_ACCOUNTS=[
  {id:'mk-ig',platform:'ig',account_name:'Marina Social Club',username:'marinasocialclub',followers_count:48600},
  {id:'mk-fb',platform:'fb',account_name:'Marina Social Club',username:'marinasocialclub',followers_count:21400},
  {id:'mk-li',platform:'li',account_name:'Marina Social Club',username:'marinasocialclub',followers_count:8200},
  {id:'mk-tt',platform:'tt',account_name:'Marina Social Club',username:'marinasocialclub',followers_count:31700},
];

function ScaledProductPreview({children,className='',desktopWidth=1480,mobileWidth=720,tabletWidth=1080,fitHeight=false}){
  const hostRef=useRef(null);
  const canvasRef=useRef(null);
  const [fit,setFit]=useState({source:desktopWidth,scale:.5,height:null});
  useLayoutEffect(()=>{
    const host=hostRef.current;
    if(!host)return undefined;
    const measure=()=>{
      const width=Math.max(1,host.clientWidth);
      const source=width<420?mobileWidth:width<650?tabletWidth:desktopWidth;
      const scale=Math.min(1,width/source);
      const canvas=canvasRef.current;
      const naturalHeight=canvas?Math.max(canvas.scrollHeight,canvas.offsetHeight):0;
      const height=fitHeight&&naturalHeight?Math.ceil(naturalHeight*scale):null;
      setFit(current=>current.source===source&&Math.abs(current.scale-scale)<.0001&&current.height===height?current:{source,scale,height});
    };
    measure();
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;
    observer?.observe(host);
    if(fitHeight&&canvasRef.current)observer?.observe(canvasRef.current);
    window.addEventListener('resize',measure);
    return()=>{observer?.disconnect();window.removeEventListener('resize',measure)};
  },[desktopWidth,fitHeight,mobileWidth,tabletWidth]);
  return <div className={`mk-scale-host ${className}`} ref={hostRef} style={fitHeight&&fit.height?{height:fit.height}:undefined}><div className="mk-scale-canvas" ref={canvasRef} style={{width:fit.source,transform:`scale(${fit.scale})`}} inert={true} aria-hidden="true">{children}</div></div>;
}

function RealDashboardStage({full=false}){
  return <div className={`mk-real-dashboard-stage${full?' mk-real-dashboard-stage-full':''}`} aria-label="The real Tawaslo dashboard">
    <div className="mk-real-window-bar"><span aria-hidden="true"><img src="/logo192.png" alt=""/></span><strong>Dashboard · Marina Social Club</strong><small>Actual product view</small></div>
    <div className="mk-real-dashboard-crop" data-tw-theme="light">
      <ScaledProductPreview className="mk-auto-dashboard" desktopWidth={full?2200:1480} tabletWidth={full?2200:1080} mobileWidth={full?2200:720} fitHeight={full}><DashboardOverview client={MARKETING_DASHBOARD_CLIENT} accounts={MARKETING_DASHBOARD_ACCOUNTS} onNavigate={()=>{}} lang="en" aiCredits={{used:18,remaining:32,limit:50,extra:0,unlimited:false}}/></ScaledProductPreview>
    </div>
  </div>;
}

function PublisherJourney(){
  const sectionRef=useRef(null);
  const visibleRef=useRef(false);
  const [activeStep,setActiveStep]=useState(0);
  const [playing,setPlaying]=useState(true);

  useEffect(()=>{
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    if(reduced.matches){setActiveStep(PUBLISHER_FLOW.length-1);setPlaying(false)}
    const section=sectionRef.current;
    if(!section)return undefined;
    const observer=new IntersectionObserver(([entry])=>{visibleRef.current=entry.isIntersecting},{threshold:.28});
    observer.observe(section);
    return()=>observer.disconnect();
  },[]);

  useEffect(()=>{
    if(!playing||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return undefined;
    const timer=window.setInterval(()=>{
      if(visibleRef.current&&document.visibilityState==='visible')setActiveStep(step=>(step+1)%PUBLISHER_FLOW.length);
    },2600);
    return()=>window.clearInterval(timer);
  },[playing]);

  const chooseStep=index=>{setActiveStep(index);setPlaying(false)};
  const progress=((activeStep+1)/PUBLISHER_FLOW.length)*100;

  return <section className="mk-publisher-journey" ref={sectionRef} aria-labelledby="mk-publisher-title">
    <header className="mk-publisher-heading">
      <Eyebrow Icon={CalendarDays}>Publisher</Eyebrow>
      <h2 id="mk-publisher-title">From an idea to a live post.</h2>
      <p>Create once, choose the channels, collect approval and publish without leaving the workspace.</p>
    </header>
    <div className="mk-publisher-flow" aria-label="Publisher workflow steps">
      {PUBLISHER_FLOW.map((step,index)=><button type="button" key={step.label} data-state={index===activeStep?'active':index<activeStep?'complete':'waiting'} aria-current={index===activeStep?'step':undefined} onClick={()=>chooseStep(index)}><span>{index<activeStep?<Check size={14}/>:index+1}</span><small>{step.label}</small></button>)}
      <button type="button" className="mk-publisher-play" aria-label={playing?'Pause Publisher animation':'Play Publisher animation'} aria-pressed={playing} onClick={()=>setPlaying(value=>!value)}>{playing?<Pause size={15}/>:<Play size={15}/>}<small>{playing?'Playing':'Play'}</small></button>
    </div>
    <div className="mk-publisher-demo" data-step={activeStep} style={{'--publisher-progress':`${progress}%`}}>
      <div className="mk-publisher-demo-bar"><span><CalendarDays size={15}/>Publisher</span><strong>Marina Social Club</strong><small>{activeStep===3?'Live':'Create post'}</small></div>
      <div className="mk-publisher-workspace">
        <section className="mk-publisher-composer" aria-label="Publisher composer preview">
          <header><span><small>Create post</small><strong>Sunday at Marina</strong></span><b>Step {activeStep+1} of {PUBLISHER_FLOW.length}</b></header>
          <article className="mk-pub-block mk-pub-caption" data-state={activeStep===0?'active':'complete'}>
            <span><MessageCircle size={15}/>Caption</span>
            <p>Sunday slows down at Marina. Join us for a long lunch by the water and stay for golden hour.</p>
            <small>#MarinaSocialClub&nbsp;&nbsp; #SundayLunch</small>
          </article>
          <div className="mk-pub-row">
            <article className="mk-pub-block mk-pub-media" data-state={activeStep===0?'active':'complete'}><span><ImageIcon size={15}/>Media</span><div><img src={publisherGoldenHour} alt="Sunlit outdoor dining at Marina Social Club" loading="lazy" width="320" height="400"/><small>Golden hour lunch.jpg</small></div></article>
            <article className="mk-pub-block mk-pub-channels" data-state={activeStep===1?'active':activeStep>1?'complete':'waiting'}><span><Globe2 size={15}/>Channels</span><div><b data-selected={activeStep>=1?'true':'false'}><FaInstagram/>Instagram</b><b data-selected={activeStep>=1?'true':'false'}><FaFacebook/>Facebook</b><b><FaLinkedin/>LinkedIn</b></div></article>
          </div>
          <article className="mk-pub-block mk-pub-approval" data-state={activeStep===2?'active':activeStep>2?'complete':'waiting'}><span><CircleCheckBig size={15}/>Client approval</span><div><i>SH</i><p><strong>{activeStep>=2?'Approved by Sara':'Waiting for Sara'}</strong><small>{activeStep>=2?'Looks perfect. Ready to publish.':'The client receives one focused review link.'}</small></p><b>{activeStep>=2?<Check size={14}/>:<Clock3 size={14}/>}</b></div></article>
          <footer data-state={activeStep===3?'active':'waiting'}><span><Clock3 size={15}/><i><small>When to post</small><strong>Publish now</strong></i></span><button type="button" tabIndex={-1}>{activeStep===3?<><CircleCheckBig size={16}/>Published</>:<><Send size={16}/>Publish now</>}</button></footer>
        </section>
        <aside className="mk-publisher-preview" aria-label="Social post preview">
          <header><span><FaInstagram/>Instagram preview</span><b>{activeStep===3?'Published':activeStep===2?'Approved':'Preview'}</b></header>
          <div className="mk-publisher-post"><div className="mk-publisher-post-user"><i>M</i><span><strong>marinasocialclub</strong><small>Marina Social Club</small></span><b>•••</b></div><img src={publisherGoldenHour} alt="Sunlit outdoor dining prepared for a social post" loading="lazy" width="520" height="650"/><div className="mk-publisher-post-copy"><strong>marinasocialclub</strong> Sunday slows down at Marina. Join us for a long lunch by the water and stay for golden hour.</div></div>
          <div className="mk-publisher-preview-status" data-state={activeStep===3?'published':'progress'}>{activeStep===3?<CircleCheckBig size={18}/>:activeStep===2?<Check size={18}/>:activeStep===1?<Globe2 size={18}/>:<ImageIcon size={18}/>}<span><strong>{PUBLISHER_FLOW[activeStep].title}</strong><small>{PUBLISHER_FLOW[activeStep].detail}</small></span></div>
        </aside>
      </div>
      <div className="mk-publisher-progress" aria-hidden="true"><i/></div>
    </div>
  </section>;
}

function RealProductSnapshots({setPage}){
  return <section className="mk-showcase mk-real-showcase" aria-label="Real Tawaslo product views">
    <div className="mk-showcase-heading mk-real-showcase-heading"><div><Eyebrow Icon={LayoutDashboard}>The daily work</Eyebrow><h2>From the plan to the conversation.</h2></div><div className="mk-real-showcase-intro"><p>These are the same Planner and Inbox views your team opens every day.</p><Action onClick={()=>setPage('platform')}>Explore the complete platform</Action></div></div>
    <div className="mk-real-snapshot-grid">
      <article className="mk-real-snapshot mk-real-snapshot-planner"><header><span><CalendarDays size={17}/>Planner</span><small>Content moves without chasing</small></header><div className="mk-real-snapshot-crop" data-tw-theme="dark"><ScaledProductPreview className="mk-auto-planner" desktopWidth={1260}><PlannerExperience dark mobileWeb={false}/></ScaledProductPreview></div></article>
      <article className="mk-real-snapshot mk-real-snapshot-inbox"><header><span><MessagesSquare size={17}/>Unified inbox</span><small>Every message has an owner</small></header><div className="mk-real-snapshot-crop" data-tw-theme="dark"><ScaledProductPreview className="mk-auto-inbox" desktopWidth={820}><InboxExperience/></ScaledProductPreview></div></article>
    </div>
  </section>;
}

function ClientBenefits({setPage}){
  return <section className="mk-client-benefits" aria-labelledby="mk-client-benefits-title">
    <div className="mk-benefits-heading"><Eyebrow Icon={UsersRound}>What you gain</Eyebrow><h2 id="mk-client-benefits-title">Less chasing. More clarity.</h2><p>Tawaslo keeps the agency, the client and the next customer action in the same picture.</p></div>
    <div className="mk-benefit-grid">{CLIENT_BENEFITS.map(([Icon,title,copy,note],index)=><article key={title} data-benefit={index+1}><span><Icon size={21} aria-hidden="true"/></span><small>{note}</small><h3>{title}</h3><p>{copy}</p></article>)}</div>
    <Action kind="outline" onClick={()=>setPage('solutions')}>See who Tawaslo is for</Action>
  </section>;
}

function PlatformOverview({setPage}){
  return <section className="mk-platform-overview" aria-labelledby="mk-platform-overview-title">
    <div className="mk-platform-overview-heading"><Eyebrow Icon={LayoutDashboard}>The complete workspace</Eyebrow><h2 id="mk-platform-overview-title">Everything the work actually needs.</h2><p>Start with the tools your team uses today. Add the customer and hospitality tools only when the business needs them.</p></div>
    <div className="mk-platform-groups">{PLATFORM_GROUPS.map(([Icon,label,copy,features],index)=><article key={label} data-group={index+1} data-word={['PUBLISH','RESPOND','GROW','MEASURE'][index]}><div className="mk-platform-group-copy"><span className="mk-platform-group-icon"><Icon size={25} aria-hidden="true"/></span><div><h3>{label}</h3><p>{copy}</p></div></div><ul>{features.map(feature=><li key={feature}><span aria-hidden="true"/>{feature}</li>)}</ul></article>)}</div>
    <Action kind="outline" onClick={()=>setPage('platform')}>See how the platform works</Action>
  </section>;
}

function SiteHeader({page,setPage,onLogin,onGetStarted,isAuthenticated=false}){
  const [open,setOpen]=useState(false);
  const go=id=>{setPage(id);setOpen(false);window.scrollTo({top:0,behavior:'smooth'});};
  const follow=(event,id)=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();go(id)};
  return <header className="mk-nav"><div className="mk-nav-inner"><a className="mk-logo-button" href={SITE_PATHS.home} onClick={event=>follow(event,'home')} aria-label="Tawaslo home"><Brand/></a><nav aria-label="Main navigation" data-open={open}>{NAV.map(([id,label])=><a key={id} href={SITE_PATHS[id]} aria-current={page===id?'page':undefined} onClick={event=>follow(event,id)}>{label}</a>)}</nav><div className="mk-nav-actions"><button type="button" className="mk-start" onClick={onGetStarted}>Join the waitlist <ArrowRight size={15}/></button><button type="button" className="mk-login" onClick={onLogin}>{isAuthenticated?<LayoutDashboard size={15} aria-hidden="true"/>:<LogIn size={15} aria-hidden="true"/>}{isAuthenticated?'Open workspace':'Sign in'}</button><button type="button" className="mk-menu" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} onClick={()=>setOpen(value=>!value)}>{open?<X size={21}/>:<Menu size={21}/>}</button></div></div></header>;
}

function Eyebrow({children,Icon=Link2}){return <span className="mk-eyebrow"><Icon size={15} aria-hidden="true"/>{children}</span>}

function HomePage({setPage,onGetStarted}){
  return <>
    <main className="mk-home">
      <section className="mk-home-hero">
        <img className="mk-logo-motif mk-logo-motif-hero" src="/logo192.png" alt="" aria-hidden="true"/>
        <div className="mk-home-hero-copy">
          <h1>See the work. <span>Show the result.</span></h1>
          <p>Plan content, move approvals, answer customers and show what changed in one calm workspace.</p>
          <div className="mk-home-hero-actions"><Action onClick={onGetStarted}>Join the waitlist</Action><Action kind="text" Icon={PlayCircle} onClick={()=>setPage('platform')}>See the platform</Action></div>
          <ul className="mk-assurance"><li><Check size={15}/>No card required</li><li><Check size={15}/>English and Arabic</li><li><Check size={15}/>For agencies and businesses</li></ul>
        </div>
        <div className="mk-home-hero-product"><RealDashboardStage/></div>
      </section>
      <PublisherJourney/>
      <ClientBenefits setPage={setPage}/>
      <PlatformOverview setPage={setPage}/>
      <RealProductSnapshots setPage={setPage}/>
      <section className="mk-final mk-channel-strip"><img className="mk-logo-motif mk-logo-motif-channel" src="/logo192.png" alt="" aria-hidden="true"/><span>Connected channels</span><h2>Every channel. One calm workspace.</h2><p>Plan, publish and answer customers across the platforms your team already uses.</p><div className="mk-social-platforms" aria-label="Supported social platforms">{SOCIAL_PLATFORMS.map(([Icon,label])=><span key={label}><Icon aria-hidden="true"/><small>{label}</small></span>)}</div></section>
    </main>
  </>;
}

function PlatformTour(){
  const [active,setActive]=useState('planner');
  const item=PLATFORM_TOUR.find(entry=>entry.id===active)||PLATFORM_TOUR[0];
  const ActiveIcon=item.Icon;
  const renderPreview=()=>{
    if(active==='planner')return <ScaledProductPreview className="mk-platform-tour-planner mk-auto-planner" desktopWidth={1260} mobileWidth={360}><PlannerExperience dark mobileWeb={false}/></ScaledProductPreview>;
    return <ScaledProductPreview className="mk-platform-tour-inbox mk-auto-inbox" desktopWidth={980} mobileWidth={360}><InboxExperience/></ScaledProductPreview>;
  };
  return <section className="mk-platform-tour" aria-labelledby="mk-platform-tour-title">
    <header className="mk-platform-tour-heading"><div><Eyebrow Icon={LayoutDashboard}>Open the real workspace</Eyebrow><h2 id="mk-platform-tour-title">Plan it. Then own the response.</h2></div><p>Planner moves the content from first draft to live. Inbox picks up the customer response with the context still attached.</p></header>
    <div className="mk-platform-tour-tabs" aria-label="Choose a product view">{PLATFORM_TOUR.map(({id,Icon,label,kicker},index)=><button type="button" key={id} aria-pressed={active===id} onClick={()=>setActive(id)}><span>{String(index+1).padStart(2,'0')}</span><Icon size={18}/><i><strong>{label}</strong><small>{kicker}</small></i></button>)}</div>
    <div className="mk-platform-tour-stage" id="mk-platform-tour-panel" aria-live="polite">
      <div className="mk-platform-tour-product" key={active} data-view={active} data-tw-theme="dark"><div className="mk-platform-tour-bar"><span><ActiveIcon size={15}/>{item.label}</span><small>Actual product view</small></div><div className="mk-platform-tour-crop">{renderPreview()}</div></div>
      <aside className="mk-platform-tour-copy" key={`${active}-copy`}><span>{item.kicker}</span><h3>{item.title}</h3><p>{item.copy}</p><ul>{item.features.map(feature=><li key={feature}><Check size={15}/>{feature}</li>)}</ul></aside>
    </div>
  </section>;
}

function PlatformSystemMap(){
  const modules=[
    {id:'publish',tone:'aqua',Icon:CalendarDays,label:'Plan & publish',copy:'Move content from first draft to live.',value:'12 ready',kicker:'Publisher',title:'Autumn collection',status:'On track',steps:[['Draft','Caption and media','Ready for review'],['Approval','Client signed off','Today · 10:42'],['Scheduled','Friday · 6:30 PM','Instagram + Facebook']],moment:{Icon:CircleCheckBig,title:'Client approval',meta:'Sara · 10:42',quote:'“Looks perfect. Ready to publish.”',label:'Approval stays beside the post',detail:'No email thread to chase.'},outcome:{metric:'12',label:'scheduled posts',footer:'Draft → approval → live',bars:[38,46,52,61,68,76,84,92,100]}},
    {id:'conversations',tone:'coral',Icon:MessagesSquare,label:'Conversations',copy:'Give every message a clear owner.',value:'5 replies',kicker:'Unified inbox',title:'Today’s conversations',status:'5 need replies',steps:[['Incoming','Comment received','Instagram · 09:18'],['Assigned','Sara owns it','Reply target · 15 min'],['Replied','Customer answered','Resolved · 09:24']],moment:{Icon:MessageCircle,title:'Current conversation',meta:'Owned by Sara',quote:'“Do you deliver this collection to Seef?”',label:'Reply ready in the brand voice',detail:'Sara owns the next action.'},outcome:{metric:'94%',label:'replies within target',footer:'Incoming → owned → resolved',bars:[48,58,51,70,76,72,88,93,96]}},
    {id:'growth',tone:'aqua',Icon:ShoppingBag,label:'Customer growth',copy:'Turn attention into useful action.',value:'84 actions',kicker:'Customer journey',title:'Autumn collection',status:'Journey active',steps:[['Discovery','Launch post opened','Instagram · 09:18'],['Useful page','Collection viewed','Link in bio · 09:31'],['Action','Order completed','Customer · 09:36']],moment:{Icon:Link2,title:'Journey signal',meta:'Source attached',quote:'“Collection page opened from Instagram.”',label:'Intent stays connected to its source',detail:'Ready for the next customer step.'},outcome:{metric:'84',label:'customer actions',footer:'Discovery → page → action',bars:[34,43,49,61,58,74,81,89,100]}},
    {id:'insights',tone:'violet',Icon:BarChart3,label:'Insights',copy:'See what changed and why.',value:'+18.4%',kicker:'Analytics',title:'What is shaping results',status:'30-day view',steps:[['Signals','Content and replies','Every connected channel'],['Pattern','Carousels lead','Saves + enquiries'],['Next move','Repeat the format','Brief ready for team']],moment:{Icon:BarChart3,title:'Insight ready',meta:'Last 30 days',quote:'“Carousels drive the most saves and enquiries.”',label:'The recommendation keeps its evidence',detail:'Ready for the next content brief.'},outcome:{metric:'+18.4%',label:'customer actions',footer:'Signal → pattern → next move',bars:[36,44,41,55,63,69,78,88,100]}},
  ];
  const [active,setActive]=useState(modules[0].id);
  const item=modules.find(module=>module.id===active)||modules[0];
  const ActiveIcon=item.Icon;
  const MomentIcon=item.moment.Icon;
  const onModuleKeyDown=(event,index)=>{
    let next=index;
    if(['ArrowDown','ArrowRight'].includes(event.key))next=(index+1)%modules.length;
    else if(['ArrowUp','ArrowLeft'].includes(event.key))next=(index-1+modules.length)%modules.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=modules.length-1;
    else return;
    event.preventDefault();
    setActive(modules[next].id);
    event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[next]?.focus();
  };
  return <section className="mk-platform-system" aria-label="How the Tawaslo workspace connects daily customer work">
    <header className="mk-platform-system-bar"><span><Brand/><b>Marina Social Club</b></span><small>Live workspace map</small></header>
    <div className="mk-platform-system-body">
      <aside className="mk-platform-system-modules" role="tablist" aria-label="Connected parts of the platform">{modules.map((module,index)=>{const ModuleIcon=module.Icon;return <button type="button" role="tab" id={`mk-module-${module.id}`} aria-selected={active===module.id} aria-controls="mk-platform-system-panel" tabIndex={active===module.id?0:-1} key={module.id} data-tone={module.tone} onClick={()=>setActive(module.id)} onKeyDown={event=>onModuleKeyDown(event,index)}><ModuleIcon size={18}/><span><strong>{module.label}</strong><small>{module.copy}</small></span><b>{module.value}</b></button>})}</aside>
      <div className="mk-platform-system-work" id="mk-platform-system-panel" role="tabpanel" aria-labelledby={`mk-module-${item.id}`} data-module={item.id} key={item.id}>
        <section className="mk-platform-system-publisher">
          <header><span><ActiveIcon size={17}/><i><small>{item.kicker}</small><strong>{item.title}</strong></i></span><b>{item.status}</b></header>
          <div className="mk-platform-system-flow" aria-label={`${item.label} workflow`}>{item.steps.map(([label,title,meta],index)=><article key={label}><span>{String(index+1).padStart(2,'0')}</span><small>{label}</small><strong>{title}</strong><i>{meta}</i></article>)}</div>
        </section>
        <div className="mk-platform-system-lower">
          <section className="mk-platform-system-inbox" data-tone={item.tone}>
            <header><span><MomentIcon size={17}/>{item.moment.title}</span><small>{item.moment.meta}</small></header>
            <blockquote>{item.moment.quote}</blockquote>
            <footer><MomentIcon size={16}/><span><small>{item.moment.label}</small><strong>{item.moment.detail}</strong></span></footer>
          </section>
          <section className="mk-platform-system-result">
            <header><span><BarChart3 size={17}/>What moved</span><small>Last 30 days</small></header>
            <strong>{item.outcome.metric}<small>{item.outcome.label}</small></strong>
            <div aria-hidden="true">{item.outcome.bars.map((height,index)=><i key={index} style={{'--bar':`${height}%`}}/>)}</div>
            <footer>{item.outcome.footer}</footer>
          </section>
        </div>
      </div>
      <aside className="mk-platform-system-thread">
        <header><span><Link2 size={17}/>One customer thread</span><small>Context stays attached</small></header>
        <ol>
          <li><i data-tone="aqua"/><span><small>09:18 · Instagram</small><strong>Customer comments on launch post</strong></span></li>
          <li><i data-tone="violet"/><span><small>09:24 · Inbox</small><strong>Sara sends the approved reply</strong></span></li>
          <li><i data-tone="coral"/><span><small>09:31 · Link in bio</small><strong>Collection page opened</strong></span></li>
          <li><i data-tone="aqua"/><span><small>09:36 · Customer action</small><strong>Order completed · $86</strong></span></li>
        </ol>
        <footer><CircleCheckBig size={17}/><span><small>Nothing lost between tools</small><strong>The result stays linked to the work.</strong></span></footer>
      </aside>
    </div>
  </section>;
}

function PlatformPage({onGetStarted}){
  return <main className="mk-subpage mk-platform-page">
    <section className="mk-platform-hero" aria-label="Tawaslo platform overview">
      <div className="mk-platform-intro"><div><Eyebrow Icon={LayoutDashboard}>The Tawaslo platform</Eyebrow><h1>Every customer move, in one living view.</h1></div><p>Plan what people see, answer what they say and understand what happens next without losing the thread between tools.</p></div>
      <PlatformSystemMap/>
    </section>
    <section className="mk-platform-loop" aria-labelledby="mk-platform-loop-title"><header><div><Eyebrow Icon={Link2}>One operating loop</Eyebrow><h2 id="mk-platform-loop-title">Nothing gets handed off into the dark.</h2></div><p>The work moves forward in a visible sequence, with the decision, owner and result still attached.</p></header><ol>{PLATFORM_LOOP.map(([Icon,label,detail],index)=><li key={label}><span>{index+1}</span><Icon size={19}/><strong>{label}</strong><small>{detail}</small></li>)}</ol></section>
    <PlatformTour/>
    <section className="mk-platform-register" aria-labelledby="mk-platform-register-title"><header><div><Eyebrow Icon={LayoutDashboard}>Inside each workspace</Eyebrow><h2 id="mk-platform-register-title">The tools behind the work.</h2></div><p>Start with the social workspace. Add customer, commerce and hospitality tools only when they serve the business.</p></header><div>{PLATFORM_GROUPS.map(([Icon,label,copy,features],index)=><article key={label} data-tone={index}><span><Icon size={19}/>{label}</span><p>{copy}</p><ul>{features.map(feature=><li key={feature}><i aria-hidden="true"/>{feature}</li>)}</ul></article>)}</div></section>
    <section className="mk-platform-channels"><div><Eyebrow Icon={Globe2}>Connected channels</Eyebrow><h2>Meet customers where they already are.</h2><p>Plan, publish and respond across the networks your team uses without splitting the customer story.</p></div><div className="mk-social-platforms" aria-label="Supported social platforms">{SOCIAL_PLATFORMS.map(([Icon,label])=><span key={label}><Icon aria-hidden="true"/><small>{label}</small></span>)}</div></section>
    <section className="mk-final mk-platform-final"><img className="mk-logo-motif mk-logo-motif-channel" src="/logo192.png" alt="" aria-hidden="true"/><span>One connected platform</span><h2>Keep the context. Move the work forward.</h2><p>Start with the tools your business needs and add more when the customer journey calls for them.</p><div><Action onClick={onGetStarted}>Join the waitlist</Action></div></section>
  </main>;
}

function SolutionsPage({onGetStarted}){
  const featureSets=[
    ['Collections and product launches','Social inbox and enquiries','Link-in-bio catalogues'],
    ['Content and local discovery','Menus, pickup and loyalty','Reviews and repeat visits'],
    ['Bookings and guest journeys','Menus, orders and reviews','Loyalty and customer context'],
    ['Multi-client workspaces','Approvals and reporting','Roles and white-label options'],
    ['Simple content planning','Messages and reviews','Useful links and campaigns'],
    ['Campaigns and enquiries','Conversation management','Lead and impact reporting'],
  ];
  return <main className="mk-subpage"><section className="mk-subhero"><Eyebrow Icon={Building2}>Who it’s for</Eyebrow><h1>Different businesses. One calm operating idea.</h1><p>Choose what the organisation actually needs. Social tools stay universal; customer, commerce and hospitality modules appear only when they add value.</p><Action onClick={onGetStarted}>Shape your workspace</Action></section><section className="mk-solution-grid">{INDUSTRIES.map(([Icon,title,copy],index)=><article key={title}><span><Icon size={23}/>{String(index+1).padStart(2,'0')}</span><h2>{title}</h2><p>{copy}</p><ul>{featureSets[index].map(item=><li key={item}><Check size={15}/>{item}</li>)}</ul></article>)}</section></main>;
}

function PricingPage({onGetStarted}){
  const [yearly,setYearly]=useState(false);
  const begin=id=>{try{sessionStorage.setItem('tw_signup_plan',id);sessionStorage.setItem('tw_signup_billing',yearly?'yearly':'monthly')}catch(_){}onGetStarted();};
  return <main className="mk-subpage mk-pricing-page">
    <section className="mk-subhero mk-pricing-head"><Eyebrow Icon={BadgeDollarSign}>Pricing</Eyebrow><h1>Choose the workspace that fits.</h1><p>Clear plans for one business, a growing team or a complete client portfolio.</p><div className="mk-billing" role="group" aria-label="Billing period"><button type="button" aria-pressed={!yearly} onClick={()=>setYearly(false)}>Monthly</button><button type="button" aria-pressed={yearly} onClick={()=>setYearly(true)}>Yearly <span>Save 20%</span></button></div></section>
    <section className="mk-plans" aria-label="Subscription plans">{PLANS.map((plan,index)=><article key={plan.id} data-plan={plan.id} data-index={String(index+1).padStart(2,'0')} data-featured={plan.featured?'true':'false'}>{plan.featured&&<em>Recommended</em>}<span>{plan.name}</span><h2>${yearly?plan.yearly:plan.price}<small>/month</small></h2><p>{plan.note}</p><strong>{plan.limits}</strong><ul>{plan.features.map(item=><li key={item}><Check size={15}/>{item}</li>)}</ul><Action kind={plan.featured?'primary':'outline'} onClick={()=>begin(plan.id)}>Choose {plan.name}</Action>{yearly&&<small>Billed yearly</small>}</article>)}</section>
    <section className="mk-price-note"><strong className="mk-trial-number"><b>30</b><small>days</small></strong><span><strong>Explore the whole workspace before deciding.</strong><small>No card required. Start with sample data, invite the team and connect live accounts only when you are ready.</small><i><Check size={13}/>Full product access</i><i><Check size={13}/>Cancel anytime</i></span><ShieldCheck className="mk-trial-shield" size={24}/></section>
    <section className="mk-plan-compare" aria-labelledby="mk-plan-compare-title"><header><Eyebrow Icon={Check}>Compare plans</Eyebrow><h2 id="mk-plan-compare-title">See what each plan includes.</h2><p>The essentials are included from day one. Team, portfolio and branding controls grow with the plan.</p></header><div className="mk-compare-scroll"><table><thead><tr><th scope="col">Feature</th>{PLANS.map(plan=><th scope="col" data-plan={plan.id} key={plan.id}>{plan.name}{plan.featured&&<small>Best fit</small>}</th>)}</tr></thead><tbody>{PLAN_COMPARISON.map(([feature,...values])=><tr key={feature}><th scope="row">{feature}</th>{values.map((value,index)=><td data-plan={PLANS[index].id} key={PLANS[index].id}>{value===true?<span className="mk-compare-yes"><Check size={15} aria-hidden="true"/><span className="mk-visually-hidden">Included</span></span>:value===false?<span className="mk-compare-no">Not included</span>:value}</td>)}</tr>)}</tbody></table></div></section>
  </main>;
}

function SecurityPage({onGetStarted}){
  const points=[[LockKeyhole,'Access that follows responsibility','Owners, managers, creators, analysts and billing roles do not need the same reach.'],[Database,'Workspace separation','Client content, connections and reporting remain inside the correct business context.'],[KeyRound,'Connection control','External social accounts can be reviewed and disconnected by authorised users.'],[ShieldCheck,'Human review where it matters','AI suggestions, replies, approvals and customer actions keep a visible review step.']];
  return <main className="mk-subpage"><section className="mk-subhero"><Eyebrow Icon={ShieldCheck}>Security</Eyebrow><h1>Move quickly without losing control.</h1><p>Tawaslo is designed around clear ownership, separate workspaces and visible actions, not security theatre.</p><Action onClick={onGetStarted}>Start a secure workspace</Action></section><section className="mk-security-grid">{points.map(([Icon,title,copy])=><article key={title}><Icon size={24}/><h2>{title}</h2><p>{copy}</p></article>)}</section><section className="mk-security-detail"><div><span>Account</span><h2>Authentication and recovery</h2><p>Secure sign-in, email verification, password recovery and session controls form one complete account journey.</p></div><div><span>Workspace</span><h2>Roles and auditability</h2><p>Permissions should be limited to the work a teammate owns, with important changes visible to the right people.</p></div><div><span>External services</span><h2>Purpose-limited connections</h2><p>Tawaslo requests and uses platform access to perform the actions the customer chooses.</p></div></section></main>;
}

function FAQPage({onGetStarted}){
  const [open,setOpen]=useState(0);
  return <main className="mk-subpage"><section className="mk-subhero"><Eyebrow Icon={MessageCircle}>Frequently asked questions</Eyebrow><h1>Useful answers before you begin.</h1><p>Understand the workspace, who it serves and how the parts fit together.</p></section><section className="mk-faq-list">{FAQS.map(([question,answer],index)=><article key={question} data-open={open===index?'true':'false'}><button type="button" aria-expanded={open===index} onClick={()=>setOpen(open===index?-1:index)}><span>{question}</span><ChevronDown size={19}/></button>{open===index&&<p>{answer}</p>}</article>)}</section><section className="mk-faq-cta"><span><Mail size={20}/><i><strong>Still deciding?</strong><small>Start with sample data and explore the workflow before connecting anything live.</small></i></span><Action onClick={onGetStarted}>Join the waitlist</Action></section></main>;
}

function ContactPage(){
  const [sent,setSent]=useState(false);
  const [error,setError]=useState('');
  const started=useRef(Date.now());
  const submit=event=>{
    event.preventDefault();setSent(false);setError('');
    const form=event.currentTarget;const data=new FormData(form);
    if(data.get('website'))return;
    if(Date.now()-started.current<1200){setError('That was impressively fast. Take one breath and try again.');return}
    if(!form.checkValidity()){form.reportValidity();setError('A tiny detail is missing above.');return}
    setSent(true);
  };
  return <main className="mk-subpage"><section className="mk-subhero"><Eyebrow Icon={Mail}>Contact</Eyebrow><h1>Tell us what you manage.</h1><p>Share the number of brands, markets and people involved. This preview keeps the form local and sends nothing.</p></section><form className="mk-contact" onSubmit={submit} noValidate><label>Your name<input name="name" required minLength="2" autoComplete="name"/></label><label>Work email<input name="email" required type="email" inputMode="email" autoComplete="email"/></label><label>Organisation<input name="organisation" required minLength="2" autoComplete="organization"/></label><label>What do you want to bring together?<textarea name="message" required minLength="12" maxLength="2000" rows="5"/></label><label className="mk-contact-trap" aria-hidden="true">Website<input name="website" tabIndex="-1" autoComplete="off"/></label><button type="submit">Review message <ArrowRight size={17}/></button>{sent&&<p role="status">Preview complete. No message was transmitted.</p>}{error&&<p role="alert" className="mk-contact-error">{error}</p>}</form></main>;
}

function NotFoundPage({onHome}){
  return <main className="mk-subpage mk-not-found"><section><span aria-hidden="true">404</span><Eyebrow Icon={Globe2}>Wrong turn, good recovery</Eyebrow><h1>This page wandered off.</h1><p>The useful part is that the rest of Tawaslo is still exactly where you left it.</p><Action onClick={onHome}>Return home</Action></section></main>;
}

function LegalPage({type}){
  const privacy=type==='privacy';
  return <main className="mk-subpage"><section className="mk-legal"><Eyebrow Icon={ShieldCheck}>Legal</Eyebrow><h1>{privacy?'Privacy policy':'Terms of service'}</h1><small>Preview copy · requires final legal review before publication</small><h2>{privacy?'Information and connected accounts':'Using Tawaslo'}</h2><p>{privacy?'Tawaslo processes account details, connected-platform permissions and the content needed to provide the service. We do not sell customer data.':'You remain responsible for the content, accounts and customer information you manage through Tawaslo and must follow each connected platform’s rules.'}</p><h2>{privacy?'How information is used':'Account responsibilities'}</h2><p>{privacy?'Information is used to authenticate users, deliver requested publishing and customer workflows, generate requested AI assistance and provide analytics and reports.':'Keep credentials secure, provide accurate account information and use the service only for lawful business activity.'}</p><h2>{privacy?'Your control':'Subscriptions and cancellation'}</h2><p>{privacy?'Authorised users can disconnect external accounts and request deletion. Retention and deletion terms will be confirmed in the final legal policy.':'Plans renew according to the selected billing period until cancelled. Final billing, refund and liability language requires legal approval.'}</p><h2>Contact</h2><p>Questions can be sent to support@tawaslo.com.</p></section></main>;
}

function SiteFooter({setPage}){
  const go=id=>{setPage(id);window.scrollTo({top:0,behavior:'smooth'})};
  const follow=(event,id)=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();go(id)};
  const link=(id,label)=><a href={SITE_PATHS[id]} onClick={event=>follow(event,id)}>{label}</a>;
  return <footer className="mk-footer"><div><Brand/><p>Social intelligence and customer growth for agencies and businesses worldwide.</p><span><Globe2 size={15}/>Designed for teams everywhere</span></div><nav aria-label="Footer navigation"><section><strong>Product</strong>{link('platform','Platform')}{link('solutions','Who it’s for')}{link('pricing','Pricing')}</section><section><strong>Trust</strong>{link('security','Security')}{link('privacy','Privacy')}{link('terms','Terms')}<button type="button" onClick={()=>window.dispatchEvent(new Event('tawaslo:manage-cookies'))}>Cookie choices</button></section><section><strong>Support</strong>{link('faq','FAQ')}{link('contact','Contact')}</section></nav><small>© 2026 Tawaslo. All rights reserved.</small></footer>;
}

export default function MarketingExperience({onGetStarted=()=>{},onLogin=()=>{},isAuthenticated=false}){
  const validPages=[...NAV.map(([id])=>id),'security','faq','contact','privacy','terms'];
  const readLocation=()=>{if(typeof window==='undefined')return'home';const path=window.location.pathname.replace(/\/+$/,'')||'/';if(SITE_PAGES[path])return SITE_PAGES[path];const legacy=window.location.hash.startsWith('#site-')?window.location.hash.replace('#site-',''):'';return validPages.includes(legacy)?legacy:'notfound'};
  const [page,setPage]=useState(readLocation);
  const navigate=next=>{if(!validPages.includes(next))return;setPage(next);if(typeof window!=='undefined'){const path=SITE_PATHS[next]||'/';if(window.location.pathname!==path||window.location.hash)window.history.pushState(null,'',path)}};
  useEffect(()=>{if(typeof window==='undefined')return undefined;const sync=()=>{setPage(readLocation());window.scrollTo({top:0,behavior:'auto'})};window.addEventListener('popstate',sync);window.addEventListener('hashchange',sync);const current=readLocation();const canonical=SITE_PATHS[current];if(canonical&&(window.location.pathname!==canonical||window.location.hash))window.history.replaceState(null,'',canonical);return()=>{window.removeEventListener('popstate',sync);window.removeEventListener('hashchange',sync)}},[]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{
    if(typeof document==='undefined')return;
    const meta=SITE_META[page]||SITE_META.notfound;document.title=meta.title;
    const setMeta=(selector,attribute,value)=>{let node=document.head.querySelector(selector);if(!node){node=document.createElement('meta');const match=selector.match(/\[(name|property)="([^"]+)"\]/);if(match)node.setAttribute(match[1],match[2]);document.head.appendChild(node)}node.setAttribute(attribute,value)};
    const url=page==='notfound'?window.location.href:`https://tawaslo.com${SITE_PATHS[page]||'/'}`;
    setMeta('meta[name="description"]','content',meta.description);setMeta('meta[property="og:title"]','content',meta.title);setMeta('meta[property="og:description"]','content',meta.description);setMeta('meta[property="og:url"]','content',url);setMeta('meta[name="twitter:title"]','content',meta.title);setMeta('meta[name="twitter:description"]','content',meta.description);setMeta('meta[name="robots"]','content',page==='notfound'?'noindex, nofollow':'index, follow, max-image-preview:large');
    let canonical=document.head.querySelector('link[rel="canonical"]');if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical)}canonical.href=url;
  },[page]);
  return <div className="mk-site" data-site-page={page}><a className="mk-skip" href="#marketing-main">Skip to main content</a><SiteHeader page={page} setPage={navigate} onLogin={onLogin} onGetStarted={onGetStarted} isAuthenticated={isAuthenticated}/><div id="marketing-main">{page==='home'&&<HomePage setPage={navigate} onGetStarted={onGetStarted}/>} {page==='platform'&&<PlatformPage onGetStarted={onGetStarted}/>} {page==='solutions'&&<SolutionsPage onGetStarted={onGetStarted}/>} {page==='pricing'&&<PricingPage onGetStarted={onGetStarted}/>} {page==='security'&&<SecurityPage onGetStarted={onGetStarted}/>} {page==='faq'&&<FAQPage onGetStarted={onGetStarted}/>} {page==='contact'&&<ContactPage/>} {['privacy','terms'].includes(page)&&<LegalPage type={page}/>} {page==='notfound'&&<NotFoundPage onHome={()=>navigate('home')}/>}</div><SiteFooter setPage={navigate}/><CookieConsent/><SiteAnalytics/></div>;
}
