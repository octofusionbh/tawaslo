import {useEffect,useRef,useState} from 'react';
import {
  ArrowLeft,ArrowRight,BriefcaseBusiness,Building2,Check,CheckCircle2,ChevronLeft,Coffee,
  Eye,EyeOff,Globe2,KeyRound,Loader2,LockKeyhole,Mail,ShieldCheck,
  Store,Upload,UserRound
} from 'lucide-react';
import {
  signIn,signUp,resendConfirmation,resetPassword,updatePassword,supabase
} from './supabase';
import {buildSignupSetup} from './accountSetup';
import {saveLogoDraft,clearLogoDraft} from './logoDraftStore';
import './auth-experience.css';

// Public sign-ups are closed until launch. Flip to true to re-open self-serve signup.
const SIGNUPS_OPEN=false;

const PLANS=[
  {id:'starter',name:'Essential',monthly:49,yearly:39,fit:'One focused business',detail:'3 accounts · 1 teammate'},
  {id:'professional',name:'Professional',monthly:99,yearly:79,fit:'A growing team',detail:'10 accounts · 5 teammates',recommended:true},
  {id:'agency',name:'Enterprise',monthly:199,yearly:159,fit:'An agency or portfolio',detail:'Unlimited accounts · 20 teammates'},
  {id:'studio',name:'Studio',monthly:459,yearly:367,fit:'A white-label agency',detail:'Your identity across the experience'},
];

const ACCOUNT_TYPES=[
  {id:'agency',Icon:BriefcaseBusiness,title:'Agency',copy:'I manage work for client brands.'},
  {id:'corporate',Icon:Store,title:'Business or brand',copy:'I manage my own shop, venue, product or service.'},
  {id:'freelancer',Icon:UserRound,title:'Freelancer',copy:'I manage brands independently.'},
];

const BUSINESS_TYPES=[
  {id:'restaurant',Icon:Coffee,title:'Restaurant or café'},
  {id:'hospitality',Icon:Building2,title:'Hotel or hospitality'},
  {id:'shop',Icon:Store,title:'Shop or retail'},
  {id:'services',Icon:BriefcaseBusiness,title:'Services or appointments'},
  {id:'other',Icon:Globe2,title:'Other business'},
];

const SPOTLIGHTS=[
  {tab:'Trend',kicker:'What is moving',title:'Social moves quickly. This corner moves with it.',copy:'Fresh platform shifts, formats and creative signals—shared without filling your inbox.',action:'Visit @tawaslo',href:'https://www.instagram.com/tawaslo',external:true},
  {tab:'Community',kicker:'Coming to the community',title:'Grow Your Page Week.',copy:'Community spotlights, shared audiences and one featured brand at a time. Follow for the first drop.',action:'Follow @tawaslo',href:'https://www.instagram.com/tawaslo',external:true},
  {tab:'Tawaslo tip',kicker:'Try this today',title:'One review link beats six “approved?” messages.',copy:'A small workflow change can give the whole team a much calmer publishing week.',action:'Explore the platform',href:'/platform',external:false},
];

const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendlyError(error,action='sign in'){
  const raw=String(error?.message||error||'').toLowerCase();
  if(raw.includes('invalid login')||raw.includes('invalid credentials'))return 'Check your email and password, then try again. You can reset your password if it has slipped your mind.';
  if(raw.includes('email not confirmed'))return 'Confirm your email before signing in. Check the confirmation message we sent you.';
  if(raw.includes('already registered')||raw.includes('already exists'))return 'An account already uses this email. Sign in or reset the password instead.';
  if(raw.includes('rate')||raw.includes('too many'))return 'Too many attempts were made. Wait a few minutes, then try again.';
  if(raw.includes('password'))return 'That password cannot be used. Choose at least 8 characters and try again.';
  if(raw.includes('fetch')||raw.includes('network')||raw.includes('failed to'))return 'We could not reach Tawaslo. Check your connection and try again.';
  return `We could not ${action}. Try again, or contact support if the problem continues.`;
}

function Brand({compact=false}){
  return <span className={`ax-brand${compact?' ax-brand-compact':''}`}><img src="/logo-transparent.png" alt=""/><span><strong>Tawaslo</strong><small>Social intelligence</small></span></span>;
}

function Field({id,label,Icon,type='text',value,onChange,onFocus,onBlur,autoComplete,placeholder,error,hint,show,onToggle,disabled=false,required=false}){
  const described=[error&&`${id}-error`,hint&&`${id}-hint`].filter(Boolean).join(' ')||undefined;
  return <div className="ax-field" data-field={id} data-error={error?'true':'false'} onFocus={onFocus} onBlur={onBlur?event=>{if(!event.currentTarget.contains(event.relatedTarget))onBlur(event)}:undefined}>
    <label htmlFor={id}>{label}</label>
    <div className="ax-input"><Icon size={18} aria-hidden="true"/><input id={id} name={id} type={type==='password'&&show?'text':type} value={value} onChange={onChange} autoComplete={autoComplete} placeholder={placeholder} aria-invalid={error?'true':undefined} aria-describedby={described} aria-required={required?'true':undefined} required={required} disabled={disabled} autoCapitalize={type==='email'?'none':undefined} spellCheck={type==='email'?false:undefined}/>{type==='password'&&<button type="button" className="ax-eye" onClick={onToggle} aria-label={show?'Hide password':'Show password'} disabled={disabled}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button>}</div>
    {hint&&!error&&<small id={`${id}-hint`}>{hint}</small>}
    {error&&<small id={`${id}-error`} role="alert">{error}</small>}
  </div>;
}

function LogoField({file,preview,error,disabled,onChoose,onRemove}){
  const inputRef=useRef(null);
  return <div className="ax-field ax-logo-field" data-field="logo" data-error={error?'true':'false'}>
    <label htmlFor="organisation-logo">Organisation logo</label>
    <div className="ax-logo" data-error={error?'true':'false'} data-disabled={disabled?'true':'false'}>
      <span className="ax-logo-preview">{preview?<img src={preview} alt="Selected organisation logo"/>:<Building2 size={20} aria-hidden="true"/>}</span>
      <span className="ax-logo-details"><strong title={file?.name}>{file?.name||'Make it yours'}</strong><small id="organisation-logo-hint">Optional · PNG, JPG or WebP · up to 5 MB</small></span>
      <input ref={inputRef} id="organisation-logo" name="organisationLogo" type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled} tabIndex={-1} aria-describedby={error?'organisation-logo-error organisation-logo-hint':'organisation-logo-hint'} aria-invalid={error?'true':undefined} onChange={event=>{onChoose(event.target.files?.[0]);event.target.value=''}}/>
      <button type="button" className="ax-logo-upload" disabled={disabled} onClick={()=>inputRef.current?.click()} aria-label={preview?'Change organisation logo':'Upload organisation logo'}><Upload size={16} aria-hidden="true"/><span>{preview?'Change logo':'Upload logo'}</span></button>
    </div>
    {preview&&<button className="ax-text-button ax-logo-remove" type="button" disabled={disabled} onClick={onRemove}>Remove logo</button>}
    {error&&<small id="organisation-logo-error" role="alert">{error}</small>}
  </div>;
}

const DUO_EXPRESSION_ART="url('/characters/tawaslo-duo-sprite-v1.png')";
const DUO_INTERACTION_ART="url('/characters/tawaslo-duo-interactions-v2.png')";

function TawasloDuo({mood='happy',className=''}){
  const isInteraction=mood==='look-down'||mood==='cover-eyes';
  return <span className={`ax-login-duo ${className}`} data-mood={mood} aria-hidden="true" style={{'--ax-duo-art':isInteraction?DUO_INTERACTION_ART:DUO_EXPRESSION_ART}}>
    <span className="ax-duo-character" data-character="boy" data-tear-x=".69" data-tear-y=".44"/>
    <span className="ax-duo-character" data-character="girl" data-tear-x=".60" data-tear-y=".48"/>
  </span>;
}

function ErrorBuddy(){
  return <span className="ax-feedback-character" aria-hidden="true"><TawasloDuo mood="teary" className="ax-error-buddy"/></span>;
}

function LoginTears({panelRef}){
  const [geometry,setGeometry]=useState(null);
  useEffect(()=>{
    const panel=panelRef.current;
    if(!panel)return;
    let active=true;
    const measure=()=>{
      const characters=Array.from(panel.querySelectorAll('.ax-error-buddy .ax-duo-character'));
      const heading=panel.querySelector('.ax-heading h1');
      if(characters.length!==2||!heading||heading.firstChild?.nodeType!==3)return;
      const panelBox=panel.getBoundingClientRect();
      const range=document.createRange();
      range.setStart(heading.firstChild,0);range.setEnd(heading.firstChild,1);
      const firstLetter=typeof range.getBoundingClientRect==='function'?range.getBoundingClientRect():heading.getBoundingClientRect();
      if(!panelBox.width||!firstLetter.width)return;
      const endX=firstLetter.left-panelBox.left+firstLetter.width*.4;
      const endY=firstLetter.top-panelBox.top+firstLetter.height*.55;
      const paths=[characters[0],characters[1],characters[0]].map((character,index)=>{
        const face=character.getBoundingClientRect();
        const x=face.left-panelBox.left+face.width*Number(character.dataset.tearX);
        const y=face.top-panelBox.top+face.height*Number(character.dataset.tearY);
        const finish=endX+(index-1)*4;
        return face.width&&face.height?{path:`M ${x} ${y} C ${x-14} ${y+22}, ${finish-23} ${endY-32}, ${finish} ${endY}`,x:finish,y:endY,delay:.12+index*.18}:null;
      }).filter(Boolean);
      if(active)setGeometry({width:panelBox.width,height:panelBox.height,paths});
    };
    // Let the feedback card finish its brief entrance before measuring the face.
    const timer=setTimeout(measure,240);
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;
    observer?.observe(panel);
    return ()=>{active=false;clearTimeout(timer);observer?.disconnect()};
  },[panelRef]);
  return <svg className="ax-login-tears" aria-hidden="true" focusable="false" viewBox={geometry?`0 0 ${geometry.width} ${geometry.height}`:undefined}>
    {geometry?.paths.map(({path,x,y,delay},index)=><g key={index}>
      <g opacity="0" className="ax-falling-tear">
        <path d="M0 -7C-2 -3-5 0-5 3A5 5 0 0 0 5 3C5 0 2 -3 0 -7Z" fill="#76bffc" stroke="#5899d5" strokeWidth=".8"/>
        <path d="M-2 1L-2 3" stroke="#f4fbff" strokeWidth="1.5" strokeLinecap="round"/>
        <animateMotion path={path} begin={`${delay}s`} dur=".95s" fill="freeze" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines=".3 0 .65 1"/>
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.08;.85;1" begin={`${delay}s`} dur=".95s" fill="freeze"/>
      </g>
      <g transform={`translate(${x} ${y})`} opacity="0">
        <path d="M-3 -2L-7 -6M3 -2L7 -6M0 0L0 -5" stroke="#76bffc" strokeWidth="2" strokeLinecap="round"/>
        <animate attributeName="opacity" values="0;.8;0" keyTimes="0;.15;1" begin={`${delay+.8}s`} dur=".28s" fill="freeze"/>
      </g>
    </g>)}
  </svg>;
}

function ErrorSummary({message,summaryRef,kind,onReset}){
  if(!message)return null;
  const playful=kind==='credentials'||kind==='email'||kind==='missing';
  const title=kind==='credentials'?'That duo didn’t click.':kind==='email'?'That email took a wrong turn.':kind==='missing'?'One tiny thing before you’re in.':'We could not finish that';
  return <div id="ax-auth-feedback" className={`ax-alert ax-alert-error${playful?' ax-login-feedback':''}`} role="alert" tabIndex="-1" ref={summaryRef}>
    {playful?<ErrorBuddy/>:<ShieldCheck size={18} aria-hidden="true"/>}
    <span><strong>{title}</strong><span>{message}</span>{kind==='credentials'&&<button className="ax-feedback-reset" type="button" onClick={onReset}>Reset password<ArrowRight size={14} aria-hidden="true"/></button>}</span>
  </div>;
}

function Spotlight({compact=false}){
  const [spotlightIndex,setSpotlightIndex]=useState(0);
  const spotlight=SPOTLIGHTS[spotlightIndex];
  return <section className={`ax-story-spotlight${compact?' ax-story-spotlight-compact':''}`} aria-label="Tawaslo Spotlight">
    <header><span>Tawaslo Spotlight</span><small>Open to everyone</small></header>
    <div className="ax-spotlight-tabs" role="group" aria-label="Choose a spotlight">{SPOTLIGHTS.map((item,index)=><button type="button" key={item.tab} aria-pressed={spotlightIndex===index} onClick={()=>setSpotlightIndex(index)}>{item.tab}</button>)}</div>
    <article key={spotlight.tab}><small>{spotlight.kicker}</small><h3>{spotlight.title}</h3><p>{spotlight.copy}</p><a href={spotlight.href} target={spotlight.external?'_blank':undefined} rel={spotlight.external?'noreferrer':undefined}>{spotlight.action}<ArrowRight size={15}/></a></article>
    <footer>Trends, community moments, useful tips—and the occasional surprise.</footer>
  </section>;
}

function AuthStory({mode,onBack}){
  const stories={
    login:{eyebrow:'Secure workspace access',title:'Continue where the work left off.',copy:'Your brands, approvals, conversations and reports stay in the workspace that owns them.',steps:[['Identity','Your account'],['Workspace','The right business'],['Control','Only your access']]},
    register:{eyebrow:'A calmer first setup',title:'Set the workspace once. Keep every brand clear.',copy:'Choose the business shape first. Connections, channels and optional tools wait until you are safely inside.',steps:[['About you','Business shape'],['Plan','Room to grow'],['Account','Secure access']]},
    forgot:{eyebrow:'Account recovery',title:'A private route back to your workspace.',copy:'We send one time-limited recovery link. Your password is never shown to teammates or support.',steps:[['Request','Your email'],['Verify','Private link'],['Return','New password']]},
    recovery:{eyebrow:'Account recovery',title:'Choose a new key. Keep everything else.',copy:'Your workspace and client data remain unchanged while your account password is updated.',steps:[['Verified','Recovery link'],['Protect','New password'],['Continue','Your workspace']]},
  };
  const story=stories[mode]||stories.login;
  return <aside className="ax-story"><button type="button" className="ax-story-brand" onClick={onBack} aria-label="Back to Tawaslo website"><Brand/></button><div className="ax-orbit" aria-hidden="true"/>{mode==='login'&&<Spotlight/>}<div className="ax-story-copy"><span className="ax-eyebrow">{story.eyebrow}</span><h2>{story.title}</h2><p>{story.copy}</p></div>{mode!=='login'&&<div className="ax-route" aria-label="Account journey">{story.steps.map(([label,value],index)=><div key={label}><i>{index+1}</i><span><small>{label}</small><strong>{value}</strong></span>{index<story.steps.length-1&&<b/>}</div>)}</div>}<footer><Globe2 size={16}/><span>Designed for teams everywhere</span></footer></aside>;
}

function StepProgress({step}){
  const stops=[['Shape','Tell us how you work'],['Choose','Pick your plan'],['Launch','Open your workspace']];
  const percent=step===3?90:Math.round((step/3)*100);
  return <div className="ax-progress" style={{'--ax-route-progress':`${((step-1)/2)*100}%`}}>
    <div className="ax-progress-head"><span><small>Your setup route</small><strong>{stops[step-1][1]}</strong></span><em>{percent}% ready</em></div>
    <ol aria-label="Account setup progress">{stops.map(([name,description],index)=>{const state=index+1<step?'done':index+1===step?'current':'next';return <li key={name} data-state={state} aria-current={state==='current'?'step':undefined}><i>{state==='done'?<Check size={15} aria-hidden="true"/>:index+1}</i><span><strong>{name}</strong><em className="ax-visually-hidden">{description}</em></span></li>})}</ol>
  </div>;
}

export default function AuthExperience({authPage='login',setAuthPage=()=>{},setIsAuthed=()=>{},setRecovery=()=>{},setShowLanding=()=>{},recoveryVerified=false,authLinkError=false}){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [remember,setRemember]=useState(()=>{try{return localStorage.getItem('tw_remember')!=='0'}catch(_){return true}});
  const [loading,setLoading]=useState(false);
  const [generalError,setGeneralError]=useState('');
  const [fieldErrors,setFieldErrors]=useState({});
  const [signupStep,setSignupStep]=useState(1);
  const [accountType,setAccountType]=useState('');
  const [businessType,setBusinessType]=useState([]);
  const [selectedPlan,setSelectedPlan]=useState(()=>{try{const raw=sessionStorage.getItem('tw_signup_plan');sessionStorage.removeItem('tw_signup_plan');const map={pro:'professional',starter:'starter',professional:'professional',agency:'agency',studio:'studio'};return map[raw]||''}catch(_){return ''}});
  const [billing,setBilling]=useState(()=>{try{const raw=sessionStorage.getItem('tw_signup_billing');sessionStorage.removeItem('tw_signup_billing');return raw==='yearly'?'yearly':'monthly'}catch(_){return 'monthly'}});
  const [companyName,setCompanyName]=useState('');
  const [fullName,setFullName]=useState('');
  const [logoFile,setLogoFile]=useState(null);
  const [logoPreview,setLogoPreview]=useState('');
  const [terms,setTerms]=useState(false);
  const [resetSent,setResetSent]=useState(false);
  const [accountCreated,setAccountCreated]=useState(false);
  const [waitlistJoined,setWaitlistJoined]=useState(false);
  const [waitlistTrap,setWaitlistTrap]=useState('');
  const [passwordUpdated,setPasswordUpdated]=useState(false);
  const [resendWait,setResendWait]=useState(0);
  const [notice,setNotice]=useState('');
  const [feedbackKind,setFeedbackKind]=useState('');
  const [feedbackTick,setFeedbackTick]=useState(0);
  const [loginActiveField,setLoginActiveField]=useState('');
  const submittingRef=useRef(false);
  const signupSetupRef=useRef(null);
  const summaryRef=useRef(null);
  const panelRef=useRef(null);
  const firstViewRef=useRef(true);

  const displayMode=accountCreated?'created':resetSent?'reset-sent':passwordUpdated?'updated':authPage;
  const storyMode=(authPage==='register'&&SIGNUPS_OPEN)?'register':authPage==='forgot'?'forgot':authPage==='recovery'?(recoveryVerified&&!authLinkError?'recovery':'forgot'):'login';
  const playfulLoginError=authPage==='login'&&generalError&&['credentials','email','missing'].includes(feedbackKind);
  const loginCharacterMood=loginActiveField==='password'?'cover-eyes':loginActiveField==='email'?'look-down':'happy';

  useEffect(()=>{
    if(!resendWait)return;
    const timer=setTimeout(()=>setResendWait(value=>Math.max(0,value-1)),1000);
    return ()=>clearTimeout(timer);
  },[resendWait]);

  useEffect(()=>{window.scrollTo({top:0,left:0,behavior:'auto'})},[]);
  useEffect(()=>{const label={login:'Sign in',register:SIGNUPS_OPEN?'Create account':'Join the waitlist',forgot:'Reset password',recovery:'Set new password',created:'Check your email','reset-sent':'Check your inbox',updated:'Password updated'}[displayMode]||'Account';document.title=`${label} | Tawaslo`},[displayMode]);
  useEffect(()=>{
    if(firstViewRef.current){firstViewRef.current=false;return}
    window.scrollTo({top:0,left:0,behavior:'auto'});
    panelRef.current?.closest('.ax-workspace')?.scrollTo({top:0,left:0,behavior:'auto'});
    requestAnimationFrame(()=>{
      const heading=panelRef.current?.querySelector('h1');
      if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}
    });
  },[signupStep,displayMode]);

  const clearMessages=()=>{setGeneralError('');setFieldErrors({});setNotice('');setFeedbackKind('');setLoginActiveField('')};
  const update=(setter,key)=>(event)=>{setter(event.target.value);setFieldErrors(old=>({...old,[key]:''}));setGeneralError('');setFeedbackKind('')};
  const showErrors=(fields,message='Check the highlighted information and try again.')=>{setFieldErrors(fields);setGeneralError(message);setFeedbackKind(authPage==='login'?(fields.email&&email.trim()?'email':'missing'):'');setFeedbackTick(value=>value+1);requestAnimationFrame(()=>summaryRef.current?.focus())};
  const changeMode=(mode)=>{if(loading)return;clearMessages();setPassword('');setConfirmPassword('');setShowPassword(false);setResetSent(false);setAccountCreated(false);setPasswordUpdated(false);if(mode==='register')setSignupStep(1);if(authPage==='recovery'||authPage==='confirm-error'){setRecovery(false);window.history.replaceState({},'', '/')}setAuthPage(mode)};
  const backToSite=()=>{try{sessionStorage.removeItem('tw_in_app');window.history.replaceState({},'', '/#site-home')}catch(_){}setRecovery(false);setAuthPage('login');setShowLanding(true)};

  const submitWaitlist=async event=>{
    event.preventDefault();
    if(loading)return;
    const cleanEmail=email.trim().toLowerCase();
    if(!cleanEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)){showErrors({email:'Enter a valid email address.'});return}
    // Spam guards: a hidden field only bots fill in, and one submission per minute.
    if(waitlistTrap){setWaitlistJoined(true);return}
    try{
      const last=Number(localStorage.getItem('tw_waitlist_last')||0);
      if(last&&Date.now()-last<60000){setWaitlistJoined(true);return}
      localStorage.setItem('tw_waitlist_last',String(Date.now()));
    }catch(_){}
    clearMessages();setLoading(true);
    try{
      const {error}=await supabase.from('waitlist').insert({email:cleanEmail,source:'signup'});
      const raw=String(error?.message||'').toLowerCase();
      if(error&&error.code!=='23505'&&!raw.includes('duplicate')){
        setLoading(false);setGeneralError('We could not save that just now. Please try again in a moment.');setFeedbackTick(value=>value+1);
        requestAnimationFrame(()=>summaryRef.current?.focus());return;
      }
    }catch(_){}
    setLoading(false);setWaitlistJoined(true);
  };

  const submitSignIn=async event=>{
    event.preventDefault();
    if(submittingRef.current)return;
    const fields={};if(!EMAIL_RE.test(email.trim()))fields.email='Enter a valid email address.';if(!password)fields.password='Enter your password.';
    if(Object.keys(fields).length){showErrors(fields);return}
    clearMessages();setLoading(true);submittingRef.current=true;
    try{
      const {data,error}=await signIn(email.trim().toLowerCase(),password);
      if(error){
        if(error.code==='email_not_confirmed'||/email not confirmed/i.test(error.message||'')){setPassword('');setAccountCreated(true);return}
        if(error.code==='invalid_credentials'||/invalid login|invalid credentials/i.test(error.message||'')){setFeedbackKind('credentials');setFeedbackTick(value=>value+1)}
        setGeneralError(friendlyError(error));requestAnimationFrame(()=>summaryRef.current?.focus());return;
      }
      if(!data?.session?.user&&!data?.user)throw new Error('Missing session');
      try{localStorage.setItem('tw_remember',remember?'1':'0');sessionStorage.setItem('tw_in_app','1')}catch(_){}
      setPassword('');setIsAuthed(true);
    }catch(error){setGeneralError(friendlyError(error));requestAnimationFrame(()=>summaryRef.current?.focus())}finally{submittingRef.current=false;setLoading(false)}
  };

  const continueAccountType=()=>{const fields={};if(!accountType)fields.accountType='Choose the option that best matches how you work.';if(!businessType.length)fields.businessType='Choose at least one industry for the first workspace.';if(Object.keys(fields).length){showErrors(fields);return}clearMessages();setSignupStep(2)};
  const continuePlan=()=>{if(!selectedPlan){showErrors({plan:'Choose a plan to continue. You will not be charged during the trial.'});return}clearMessages();setSignupStep(3)};
  const chooseLogo=file=>{if(!file)return;if(!/^image\/(png|jpeg|webp)$/.test(file.type)){showErrors({logo:'Choose a PNG, JPG or WebP logo.'});return}if(file.size>5*1024*1024){showErrors({logo:'Choose a logo smaller than 5 MB.'});return}setLogoFile(file);setFieldErrors(old=>({...old,logo:''}));setGeneralError('');const reader=new FileReader();reader.onload=()=>setLogoPreview(String(reader.result||''));reader.readAsDataURL(file)};

  const submitSignup=async event=>{
    event.preventDefault();
    if(submittingRef.current)return;
    const fields={};if(!companyName.trim()||companyName.trim().length>200)fields.companyName='Enter a workspace name of 200 characters or fewer.';if(!fullName.trim()||fullName.trim().length>150)fields.fullName='Enter your full name, up to 150 characters.';if(!EMAIL_RE.test(email.trim()))fields.email='Enter a valid work email address.';if(password.length<8)fields.password='Use at least 8 characters.';if(!terms)fields.terms='Agree to the Terms and Privacy Policy to create the account.';
    if(Object.keys(fields).length){showErrors(fields);return}
    clearMessages();setLoading(true);submittingRef.current=true;
    try{
      const cleanEmail=email.trim().toLowerCase();
      const setup=buildSignupSetup({fullName,companyName,accountType,selectedPlan,billing,industries:businessType,logoFile});
      // Reuse the initial workspace identity when a network failure is retried.
      if(signupSetupRef.current?.email===cleanEmail)setup.initialClientId=signupSetupRef.current.setup.initialClientId;
      signupSetupRef.current={email:cleanEmail,setup};
      if(logoFile){
        try{await saveLogoDraft(setup.initialClientId,logoFile)}
        catch(_){showErrors({logo:'Your browser could not keep this logo for confirmation. Remove it to continue, or try another browser.'});return}
      }
      const {data,error}=await signUp(cleanEmail,password,fullName.trim(),setup);
      if(error){setGeneralError(friendlyError(error,'create the account'));requestAnimationFrame(()=>summaryRef.current?.focus());return}
      if(!data?.user)throw new Error('Missing signup response');
      setPassword('');setShowPassword(false);
      if(data.session?.user){try{sessionStorage.setItem('tw_in_app','1')}catch(_){}setIsAuthed(true);return}
      setResendWait(60);setAccountCreated(true);
    }catch(error){setGeneralError(friendlyError(error,'create the account'));requestAnimationFrame(()=>summaryRef.current?.focus())}finally{submittingRef.current=false;setLoading(false)}
  };

  const sendConfirmation=async event=>{
    event?.preventDefault();
    if(submittingRef.current||resendWait)return;
    if(!EMAIL_RE.test(email.trim())){showErrors({email:'Enter the email you used to create the account.'});return}
    clearMessages();setLoading(true);submittingRef.current=true;
    try{
      const {error}=await resendConfirmation(email.trim().toLowerCase());
      if(error){if(error.status===429||error.code==='over_email_send_rate_limit')setResendWait(60);throw error}
      setAccountCreated(true);setResendWait(60);setNotice('If this account needs confirmation, a fresh link is on its way. Check your spam folder too.');
    }catch(error){setGeneralError(friendlyError(error,'resend the confirmation email'))}finally{submittingRef.current=false;setLoading(false)}
  };

  const submitReset=async event=>{
    if(submittingRef.current){event.preventDefault();return}
    event.preventDefault();const fields={};if(!EMAIL_RE.test(email.trim()))fields.email='Enter the email used for your Tawaslo account.';if(Object.keys(fields).length){showErrors(fields);return}clearMessages();setLoading(true);
    submittingRef.current=true;
    try{const {error}=await resetPassword(email.trim().toLowerCase());if(error){setGeneralError(friendlyError(error,'send the recovery link'));requestAnimationFrame(()=>summaryRef.current?.focus());return}setResendWait(60);setResetSent(true)}catch(error){setGeneralError(friendlyError(error,'send the recovery link'));requestAnimationFrame(()=>summaryRef.current?.focus())}finally{submittingRef.current=false;setLoading(false)}
  };

  const submitNewPassword=async event=>{
    if(submittingRef.current||!recoveryVerified||authLinkError){event.preventDefault();return}
    event.preventDefault();const fields={};if(password.length<8)fields.password='Use at least 8 characters.';if(confirmPassword!==password)fields.confirmPassword='The passwords do not match.';if(Object.keys(fields).length){showErrors(fields);return}clearMessages();setLoading(true);
    submittingRef.current=true;
    try{const {error}=await updatePassword(password);if(error){setGeneralError(friendlyError(error,'update the password'));requestAnimationFrame(()=>summaryRef.current?.focus());return}setPassword('');setConfirmPassword('');setShowPassword(false);try{sessionStorage.removeItem('tw_recovery_verified')}catch(_){}setPasswordUpdated(true)}catch(error){setGeneralError(friendlyError(error,'update the password'));requestAnimationFrame(()=>summaryRef.current?.focus())}finally{submittingRef.current=false;setLoading(false)}
  };

  const enterAfterReset=()=>{try{window.history.replaceState({},'', '/');sessionStorage.setItem('tw_in_app','1')}catch(_){}setRecovery(false);setIsAuthed(true)};

  return <main className={`ax-shell ax-shell-${storyMode} ax-shell-light`} data-auth-step={storyMode==='register'?signupStep:undefined}>
    <AuthStory mode={storyMode} onBack={backToSite}/>
    <section className="ax-workspace" aria-label="Tawaslo account access">
      <div className="ax-mobile-brand"><Brand compact/><button type="button" onClick={backToSite}><ArrowLeft size={16}/>Website</button></div>
      {storyMode==='login'&&<div className="ax-mobile-spotlight"><Spotlight compact/></div>}
      <div className={`ax-panel ax-panel-${displayMode}`} ref={panelRef}>
        <button type="button" className="ax-back-site" onClick={backToSite}><ChevronLeft size={16}/>Back to website</button>
        <ErrorSummary key={`feedback-${feedbackTick}`} message={generalError} summaryRef={summaryRef} kind={feedbackKind} onReset={()=>changeMode('forgot')}/>
        {playfulLoginError&&<LoginTears key={`tears-${feedbackTick}`} panelRef={panelRef}/>}
        {notice&&<p className="ax-inline-notice" role="status">{notice}</p>}

        {authPage==='login'&&!accountCreated&&!resetSent&&!passwordUpdated&&<form onSubmit={submitSignIn} noValidate aria-describedby={generalError?'ax-auth-feedback':undefined}>
          <header className="ax-heading ax-login-heading"><span>Workspace access</span><h1>Welcome back.</h1><p>Sign in to continue to your Tawaslo workspace.</p>{!playfulLoginError&&<TawasloDuo key={loginCharacterMood} mood={loginCharacterMood} className="ax-welcome-duo"/>}</header>
          <Field id="email" label="Email address" Icon={Mail} type="email" value={email} onChange={update(setEmail,'email')} onFocus={()=>setLoginActiveField('email')} onBlur={()=>setLoginActiveField(current=>current==='email'?'':current)} autoComplete="username" placeholder="you@company.com" error={fieldErrors.email} disabled={loading} required/>
          <Field id="password" label="Password" Icon={LockKeyhole} type="password" value={password} onChange={update(setPassword,'password')} onFocus={()=>setLoginActiveField('password')} onBlur={()=>setLoginActiveField(current=>current==='password'?'':current)} autoComplete="current-password" placeholder="Enter your password" error={fieldErrors.password} show={showPassword} onToggle={()=>setShowPassword(value=>!value)} disabled={loading} required/>
          <div className="ax-form-options"><label><input type="checkbox" checked={remember} disabled={loading} onChange={event=>setRemember(event.target.checked)}/><span><strong>Keep me signed in</strong><small>Only on a device you trust.</small></span></label><button type="button" onClick={()=>changeMode('forgot')}>Forgot password?</button></div>
          <button className="ax-primary" type="submit" disabled={loading}>{loading?<><Loader2 className="ax-spin" size={18}/>Signing in…</>:<>Sign in securely<ArrowRight size={18}/></>}</button>
          <p className="ax-switch">{SIGNUPS_OPEN?<>New to Tawaslo? <button type="button" onClick={()=>changeMode('register')}>Create an account</button></>:<>Not on Tawaslo yet? <button type="button" onClick={()=>changeMode('register')}>Join the waitlist</button></>}</p>
          <div className="ax-trust"><ShieldCheck size={17}/><span><strong>Private by default</strong><small>Your password is handled by secure authentication and is never shown to teammates.</small></span></div>
        </form>}

        {authPage==='register'&&!SIGNUPS_OPEN&&!waitlistJoined&&<form className="ax-step" onSubmit={submitWaitlist} noValidate aria-busy={loading?'true':undefined}>
          <header className="ax-heading"><span>Launching soon</span><h1>Tawaslo opens to everyone soon.</h1><p>We are in a private beta with a small group of brands and agencies. Leave your email and we will invite you the moment new workspaces open.</p></header>
          <Field id="email" label="Work email" Icon={Mail} type="email" value={email} onChange={update(setEmail,'email')} autoComplete="email" placeholder="you@company.com" error={fieldErrors.email} disabled={loading} required/>
          <div aria-hidden="true" style={{position:'absolute',left:'-9999px',width:1,height:1,overflow:'hidden'}}><label htmlFor="tw-company-url">Leave this empty</label><input id="tw-company-url" name="company_url" type="text" tabIndex={-1} autoComplete="off" value={waitlistTrap} onChange={event=>setWaitlistTrap(event.target.value)}/></div>
          <button className="ax-primary" type="submit" disabled={loading}>{loading?<><Loader2 className="ax-spin" size={18}/>Adding you...</>:<>Join the waitlist<ArrowRight size={18}/></>}</button>
          <button className="ax-secondary ax-full" type="button" onClick={()=>changeMode('login')}><ArrowLeft size={17}/>Back to sign in</button>
          <div className="ax-trust"><ShieldCheck size={17}/><span><strong>One email, nothing else</strong><small>We only use it to tell you when Tawaslo opens. No newsletters, no sharing.</small></span></div>
        </form>}

        {authPage==='register'&&!SIGNUPS_OPEN&&waitlistJoined&&<section className="ax-result" aria-live="polite"><span className="ax-result-icon"><CheckCircle2 size={30}/></span><small>You are on the list</small><h1>Thanks &mdash; we will be in touch.</h1><p>We have saved <strong>{email.trim().toLowerCase()}</strong>. You will get an invite from Tawaslo as soon as we open new workspaces.</p><div className="ax-result-note"><Mail size={18}/><span>Already have an account? You can sign in as usual.</span></div><button type="button" className="ax-primary" onClick={()=>changeMode('login')}>Back to sign in<ArrowRight size={18}/></button></section>}

        {authPage==='register'&&SIGNUPS_OPEN&&!accountCreated&&<div>
          <StepProgress step={signupStep}/>
          {signupStep===1&&<section className="ax-step">
            <header className="ax-heading"><span>Start with the right shape</span><h1>How do you work?</h1><p>This decides the workspace structure. You can change enabled tools later.</p></header>
            <div className="ax-choice-grid" role="group" aria-label="Account type">{ACCOUNT_TYPES.map(({id,Icon,title,copy})=><button type="button" key={id} aria-pressed={accountType===id} onClick={()=>{setAccountType(id);setFieldErrors(old=>({...old,accountType:''}));setGeneralError('')}}><Icon size={22}/><span><strong>{title}</strong><small>{copy}</small></span>{accountType===id&&<CheckCircle2 size={19}/>}</button>)}</div>
            {fieldErrors.accountType&&<p className="ax-inline-error" role="alert">{fieldErrors.accountType}</p>}
            {accountType&&<div className="ax-business-reveal"><header><span>Choose one or more</span><strong>{accountType==='corporate'?'Which industries describe your business?':'Which industries do you work with?'}</strong></header><div className="ax-business-options" role="group" aria-label="Industries, select all that apply">{BUSINESS_TYPES.map(({id,Icon,title})=>{const selected=businessType.includes(id);return <button type="button" key={id} aria-pressed={selected} onClick={()=>{setBusinessType(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);setFieldErrors(old=>({...old,businessType:''}));setGeneralError('')}}><Icon size={17}/><span>{title}</span>{selected&&<Check size={14}/>}</button>})}</div></div>}
            {fieldErrors.businessType&&<p className="ax-inline-error" role="alert">{fieldErrors.businessType}</p>}
            <button className="ax-primary" type="button" onClick={continueAccountType}>Continue<ArrowRight size={18}/></button>
            <p className="ax-switch">Already have an account? <button type="button" onClick={()=>changeMode('login')}>Sign in</button></p>
          </section>}
          {signupStep===2&&<section className="ax-step"><header className="ax-heading"><span>No charge today</span><h1>Choose your plan.</h1><p>Every plan starts with a 30-day trial. No card is required.</p></header><div className="ax-billing" role="group" aria-label="Billing period"><button type="button" aria-pressed={billing==='monthly'} onClick={()=>setBilling('monthly')}>Monthly</button><button type="button" aria-pressed={billing==='yearly'} onClick={()=>setBilling('yearly')}>Yearly <small>Save 20%</small></button></div><div className="ax-plan-list" role="group" aria-label="Plans">{PLANS.map(plan=><button type="button" key={plan.id} aria-pressed={selectedPlan===plan.id} onClick={()=>{setSelectedPlan(plan.id);setFieldErrors(old=>({...old,plan:''}));setGeneralError('')}}><span><strong>{plan.name}{plan.recommended&&<em>Recommended</em>}</strong><small>{plan.fit} · {plan.detail}</small></span><span className="ax-price"><strong>${billing==='yearly'?plan.yearly:plan.monthly}</strong><small>/month</small></span></button>)}</div>{fieldErrors.plan&&<p className="ax-inline-error" role="alert">{fieldErrors.plan}</p>}<div className="ax-step-actions"><button className="ax-secondary" type="button" onClick={()=>{clearMessages();setSignupStep(1)}}><ArrowLeft size={17}/>Back</button><button className="ax-primary" type="button" onClick={continuePlan}>Continue<ArrowRight size={18}/></button></div></section>}
          {signupStep===3&&<form className="ax-step" onSubmit={submitSignup} noValidate aria-busy={loading?'true':undefined}><header className="ax-heading"><span>Final step</span><h1>Create your account.</h1><p>Add the details people will recognise when they enter the workspace.</p></header><Field id="companyName" label={accountType==='agency'?'Agency name':'Organisation name'} Icon={Building2} value={companyName} onChange={update(setCompanyName,'companyName')} autoComplete="organization" placeholder="Your organisation" error={fieldErrors.companyName} disabled={loading} required/><LogoField file={logoFile} preview={logoPreview} error={fieldErrors.logo} disabled={loading} onChoose={chooseLogo} onRemove={()=>{setLogoFile(null);setLogoPreview('');setFieldErrors(old=>({...old,logo:''}));setGeneralError('');if(signupSetupRef.current)clearLogoDraft(signupSetupRef.current.setup.initialClientId).catch(()=>{})}}/><Field id="fullName" label="Your full name" Icon={UserRound} value={fullName} onChange={update(setFullName,'fullName')} autoComplete="name" placeholder="Your name" error={fieldErrors.fullName} disabled={loading} required/><Field id="email" label="Work email" Icon={Mail} type="email" value={email} onChange={update(setEmail,'email')} autoComplete="username" placeholder="ilove@tawaslo.com" error={fieldErrors.email} disabled={loading} required/><Field id="password" label="Password" Icon={LockKeyhole} type="password" value={password} onChange={update(setPassword,'password')} autoComplete="new-password" placeholder="Create a password" error={fieldErrors.password} hint="Use at least 8 characters. Passphrases work well." show={showPassword} onToggle={()=>setShowPassword(value=>!value)} disabled={loading} required/><label className="ax-terms"><input type="checkbox" checked={terms} disabled={loading} required aria-required="true" onChange={event=>{setTerms(event.target.checked);setFieldErrors(old=>({...old,terms:''}));setGeneralError('')}}/><span>I agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>. I will only connect accounts I am authorised to manage.</span></label>{fieldErrors.terms&&<p className="ax-inline-error" role="alert">{fieldErrors.terms}</p>}<div className="ax-step-actions"><button className="ax-secondary" type="button" disabled={loading} onClick={()=>{clearMessages();setSignupStep(2)}}><ArrowLeft size={17}/>Back</button><button className="ax-primary" type="submit" disabled={loading}>{loading?<><Loader2 className="ax-spin" size={18}/>Creating account…</>:<>Create account<ArrowRight size={18}/></>}</button></div></form>}
        </div>}

        {accountCreated&&<section className="ax-result" aria-live="polite"><span className="ax-result-icon"><Mail size={28}/></span><small>One last confirmation</small><h1>Check your email.</h1><p>Open the confirmation email for <strong>{email.trim().toLowerCase()}</strong>. Your setup choices will come with you when you confirm and sign in.</p><ol><li><i>1</i>Open the email from Tawaslo.</li><li><i>2</i>Confirm your email address.</li><li><i>3</i>We finish creating your workspace.</li></ol><button type="button" className="ax-primary" onClick={()=>changeMode('login')}>Go to sign in<ArrowRight size={18}/></button><button type="button" className="ax-secondary ax-full" disabled={loading||resendWait>0} onClick={sendConfirmation}>{loading?"Sending…":resendWait>0?"Resend in "+resendWait+"s":"Resend confirmation email"}</button>{logoFile&&<p className="ax-draft-note">Your logo is kept in this browser until you confirm. On another device, you can attach it again.</p>}<a className="ax-text-button ax-result-support" href="mailto:support@tawaslo.com">Need help with this email?</a></section>}

        {authPage==='forgot'&&!resetSent&&<form onSubmit={submitReset} noValidate><header className="ax-heading"><span>Account recovery</span><h1>Reset your password.</h1><p>Enter the email used for Tawaslo. We will send a private recovery link.</p></header><Field id="email" label="Account email" Icon={Mail} type="email" value={email} onChange={update(setEmail,'email')} autoComplete="email" placeholder="you@company.com" error={fieldErrors.email} disabled={loading} required/><button className="ax-primary" type="submit" disabled={loading}>{loading?<><Loader2 className="ax-spin" size={18}/>Sending link…</>:<>Send recovery link<ArrowRight size={18}/></>}</button><button className="ax-secondary ax-full" type="button" onClick={()=>changeMode('login')}><ArrowLeft size={17}/>Back to sign in</button><div className="ax-trust"><KeyRound size={17}/><span><strong>Safe account lookup</strong><small>The confirmation screen does not reveal whether an email is registered.</small></span></div></form>}

        {resetSent&&<section className="ax-result"><span className="ax-result-icon"><Mail size={28}/></span><small>Recovery link requested</small><h1>Check your inbox.</h1><p>If an account exists for <strong>{email.trim().toLowerCase()}</strong>, a password reset link is on its way. Check spam too.</p><div className="ax-result-note"><KeyRound size={18}/><span>The link is private and time-limited. Tawaslo support will never ask for your password.</span></div><button type="button" className="ax-primary" onClick={()=>changeMode('login')}>Back to sign in<ArrowRight size={18}/></button><button type="button" className="ax-text-button" disabled={resendWait>0} onClick={()=>{setResetSent(false);clearMessages()}}>{resendWait>0?"Send again in "+resendWait+"s":"Send another link"}</button></section>}

        {authPage==='recovery'&&recoveryVerified&&!authLinkError&&!passwordUpdated&&<form onSubmit={submitNewPassword} noValidate><header className="ax-heading"><span>Verified recovery</span><h1>Set a new password.</h1><p>Choose a password you have not used for this account before.</p></header><Field id="password" label="New password" Icon={LockKeyhole} type="password" value={password} onChange={update(setPassword,'password')} autoComplete="new-password" placeholder="At least 8 characters" error={fieldErrors.password} hint="Passphrases are easier to remember and harder to guess." show={showPassword} onToggle={()=>setShowPassword(value=>!value)} disabled={loading} required/><Field id="confirmPassword" label="Confirm new password" Icon={ShieldCheck} type="password" value={confirmPassword} onChange={update(setConfirmPassword,'confirmPassword')} autoComplete="new-password" placeholder="Repeat the new password" error={fieldErrors.confirmPassword} show={showPassword} onToggle={()=>setShowPassword(value=>!value)} disabled={loading} required/><button className="ax-primary" type="submit" disabled={loading}>{loading?<><Loader2 className="ax-spin" size={18}/>Updating password…</>:<>Update password<ArrowRight size={18}/></>}</button></form>}

        {authPage==='recovery'&&(!recoveryVerified||authLinkError)&&!passwordUpdated&&<section className="ax-result"><span className="ax-result-icon"><KeyRound size={28}/></span><small>Account recovery</small><h1>Let’s get you a fresh link.</h1><p>This recovery link is missing, has expired, or has already been used. Request a new one to reset your password safely.</p><button type="button" className="ax-primary" onClick={()=>changeMode('forgot')}>Request a new link<ArrowRight size={18}/></button><button type="button" className="ax-text-button" onClick={()=>changeMode('login')}>Back to sign in</button></section>}
        {(authPage==='confirm-error'||authPage==='confirmation')&&!accountCreated&&<form onSubmit={sendConfirmation} noValidate><header className="ax-heading"><span>Email confirmation</span><h1>{authPage==='confirm-error'?'Let’s try a fresh link.':'Confirm your email.'}</h1><p>The previous link may have expired or already been used. Sign in if you have confirmed, or request a new email below.</p></header><Field id="email" label="Account email" Icon={Mail} type="email" value={email} onChange={update(setEmail,'email')} autoComplete="email" placeholder="you@company.com" error={fieldErrors.email} required disabled={loading}/><button type="submit" className="ax-primary" disabled={loading||resendWait>0}>{loading?'Sending…':resendWait>0?'Resend in '+resendWait+'s':'Resend confirmation email'}<ArrowRight size={18}/></button><button type="button" className="ax-text-button ax-full" onClick={()=>changeMode('login')}>Back to sign in</button></form>}
        {passwordUpdated&&<section className="ax-result"><span className="ax-result-icon"><CheckCircle2 size={30}/></span><small>Password updated</small><h1>You are secure again.</h1><p>Your new password is active. Continue to the workspace without losing your account data.</p><button type="button" className="ax-primary" onClick={enterAfterReset}>Continue to workspace<ArrowRight size={18}/></button></section>}
      </div>
      <footer className="ax-help"><span>Need help?</span><a href="mailto:support@tawaslo.com">support@tawaslo.com</a><i/>Secure account access</footer>
    </section>
  </main>;
}
