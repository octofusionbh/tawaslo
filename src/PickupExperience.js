import {useEffect,useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {BellRing,Bot,CalendarClock,Check,CheckCircle2,ChevronRight,Clock3,Copy,CreditCard,Eye,Globe2,Languages,Link2,MapPin,Moon,PackageCheck,ReceiptText,Save,ShieldCheck,ShoppingBag,Store,Sun,Truck,WalletCards,X} from 'lucide-react';
import {readMenuBook} from './menuPreviewModel';
import ShareGenerator from './ShareGenerator';
import {readPickup,savePickup} from './pickupPreviewModel';
import './pickup-experience.css';
import './pickup-agency.css';

const SETUP_TABS=[
  {id:'service',label:'Service',Icon:ShoppingBag},
  {id:'checkout',label:'Checkout',Icon:CreditCard},
  {id:'handoff',label:'Host handoff',Icon:BellRing},
  {id:'guest',label:'Guest experience',Icon:Globe2},
];

const SERVICE_TYPES=[
  {id:'pickup',label:'Pickup',note:'Collect from a location',Icon:Store},
  {id:'delivery',label:'Local delivery',note:'Your team or a partner delivers',Icon:Truck},
  {id:'shipping',label:'Shipping',note:'Send products regionally or worldwide',Icon:PackageCheck},
];

const CURRENCIES=['BHD','SAR','AED','QAR','KWD','OMR','USD','EUR','GBP'];
const TIMEZONES=['Asia/Bahrain','Asia/Riyadh','Asia/Dubai','Asia/Qatar','Asia/Kuwait','Asia/Muscat','Europe/London','Europe/Paris','America/New_York'];
const LANGUAGES=['English','العربية','Français','Español'];
const PREPARATION_OPTIONS=[0,10,15,20,25,30,45,50,60,90,120,180,240,480,1440];

function formatLeadTime(minutes){
  const value=Math.max(0,Number(minutes)||0);
  if(value===0)return'Instant';
  if(value<60)return`${value} minutes`;
  if(value%1440===0)return`${value/1440} ${value===1440?'day':'days'}`;
  if(value%60===0)return`${value/60} ${value===60?'hour':'hours'}`;
  return`${Math.floor(value/60)} hr ${value%60} min`;
}
function dateValue(date){return`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function timeValue(date){return`${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;}

function Toggle({label,note,checked,onChange,Icon}){
  return <button type="button" className="po-toggle" aria-pressed={checked} onClick={()=>onChange(!checked)}><Icon size={18} aria-hidden="true"/><span><strong>{label}</strong><small>{note}</small></span><i aria-hidden="true"><b/></i></button>;
}

function ServiceChoice({service,active,onClick}){
  const Icon=service.Icon;
  return <button type="button" className="po-service-choice" aria-pressed={active} onClick={onClick}><span><Icon size={21} aria-hidden="true"/></span><strong>{service.label}</strong><small>{service.note}</small><i>{active?<Check size={14} aria-hidden="true"/>:null}</i></button>;
}

function Field({label,note,children}){
  return <label className="po-field"><span>{label}</span>{children}{note&&<small>{note}</small>}</label>;
}

function CheckoutPreview({settings,menu,onClose}){
  const items=useMemo(()=>(menu?.items||[]).filter(item=>item.available).slice(0,4),[menu]);
  const [selectedIds,setSelectedIds]=useState(()=>items.slice(0,2).map(item=>item.id));
  const [mode,setMode]=useState('asap');
  const leadMinutes=Math.max(0,...items.filter(item=>selectedIds.includes(item.id)).map(item=>item.fulfillmentMinutes??settings.prepMinutes));
  const earliest=useMemo(()=>new Date(Date.now()+leadMinutes*60000),[leadMinutes]);
  const maximum=useMemo(()=>{const value=new Date();value.setDate(value.getDate()+settings.advanceDays);value.setHours(23,59,59,999);return value;},[settings.advanceDays]);
  const [scheduledDate,setScheduledDate]=useState(()=>dateValue(earliest));
  const [scheduledTime,setScheduledTime]=useState(()=>timeValue(earliest));
  const selectedDateTime=new Date(`${scheduledDate}T${scheduledTime}:00`);
  const withinHours=scheduledTime>=settings.opens&&scheduledTime<=settings.closes;
  const scheduleValid=mode==='asap'||(!Number.isNaN(selectedDateTime.getTime())&&selectedDateTime>=earliest&&selectedDateTime<=maximum&&withinHours);
  const hasItems=selectedIds.length>0;
  const total=items.filter(item=>selectedIds.includes(item.id)).reduce((sum,item)=>sum+(Number(item.price)||0),0).toFixed(3);

  useEffect(()=>{const handle=event=>{if(event.key==='Escape')onClose();};window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle);},[onClose]);
  useEffect(()=>{if(mode==='scheduled'&&new Date(`${scheduledDate}T${scheduledTime}:00`)<earliest){setScheduledDate(dateValue(earliest));setScheduledTime(timeValue(earliest));}},[earliest,mode,scheduledDate,scheduledTime]);

  function toggleItem(id){setSelectedIds(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);}

  return createPortal(<div className="po-overlay" role="presentation" onClick={onClose}><section className="po-checkout-preview" role="dialog" aria-modal="true" aria-labelledby="po-preview-title" onClick={event=>event.stopPropagation()}><header><div><span>Guest checkout preview</span><strong id="po-preview-title">{menu?.title||'Your menu or catalog'}</strong></div><button type="button" aria-label="Close guest checkout preview" onClick={onClose}><X size={18}/></button></header><div className="po-preview-brand"><span><b>MSC</b><i><strong>Marina Social Club</strong><small>{settings.location}</small></i></span><em>{settings.serviceModes.map(id=>SERVICE_TYPES.find(item=>item.id===id)?.label).filter(Boolean).join(' · ')}</em></div><div className="po-preview-items" aria-label="Sample basket items">{items.map(item=>{const selected=selectedIds.includes(item.id),itemLead=item.fulfillmentMinutes??settings.prepMinutes;return <button type="button" key={item.id} aria-pressed={selected} onClick={()=>toggleItem(item.id)}><CheckCircle2 size={18} aria-hidden="true"/><span><strong>{item.name}</strong><small>{item.fulfillmentMinutes==null?`Uses default · ${formatLeadTime(itemLead)}`:formatLeadTime(itemLead)}</small></span><b>{settings.currency} {item.price}</b></button>;})}</div>{!hasItems&&<p className="po-preview-warning" role="alert">Choose at least one sample item to continue.</p>}<div className="po-preview-checkout"><span><small>{mode==='asap'?'Earliest ready':'Basket preparation'}</small><strong>{mode==='asap'?earliest.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):formatLeadTime(leadMinutes)}</strong></span><span><small>Sample total</small><strong>{settings.currency} {total}</strong></span></div>{settings.allowScheduled&&<div className="po-preview-scheduling"><span>When should it be ready?</span><div className="po-preview-mode"><button type="button" aria-pressed={mode==='asap'} onClick={()=>setMode('asap')}><Clock3 size={16}/>As soon as possible</button><button type="button" aria-pressed={mode==='scheduled'} onClick={()=>setMode('scheduled')}><CalendarClock size={16}/>Schedule ahead</button></div>{mode==='scheduled'&&<div className="po-preview-schedule"><label>Date<input type="date" value={scheduledDate} min={dateValue(earliest)} max={dateValue(maximum)} onChange={event=>setScheduledDate(event.target.value)}/></label><label>Time<input type="time" value={scheduledTime} min={settings.opens} max={settings.closes} step={settings.prepMinutes>=60?1800:900} onChange={event=>setScheduledTime(event.target.value)}/></label><small>Available {settings.opens}–{settings.closes}, up to {settings.advanceDays===0?'the same day':`${settings.advanceDays} days ahead`}.</small>{!scheduleValid&&<p role="alert">Choose a time after {earliest.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} and within opening hours.</p>}</div>}</div>}<button type="button" className="po-preview-cta" disabled={!settings.enabled||!hasItems||!scheduleValid}>{mode==='scheduled'?'Continue with scheduled time':'Continue to details'}</button><small className="po-preview-disclaimer">Preview only. The basket uses the longest item time—not the sum—and no order or payment is created.</small></section></div>,document.body);
}

function Readiness({checks,onHostTest}){
  const complete=checks.filter(item=>item.ready).length;
  return <aside className="po-readiness"><header><span>Launch readiness</span><strong>{complete}/{checks.length}</strong></header><div className="po-readiness-meter"><i style={{width:`${complete/checks.length*100}%`}}/></div><p>{complete===checks.length?'Ready to rehearse and hand to the host.':'Finish the remaining setup before launch.'}</p><ul>{checks.map(item=><li key={item.label} data-ready={item.ready?'true':'false'}>{item.ready?<CheckCircle2 size={16}/>:<span/>}<i><strong>{item.label}</strong><small>{item.note}</small></i></li>)}</ul><div className="po-flow"><span>How it moves</span><ol><li><Globe2 size={16}/><i><strong>Guest orders</strong><small>From the branded link</small></i></li><li><CreditCard size={16}/><i><strong>Payment confirms</strong><small>Using the client’s account</small></i></li><li><ShieldCheck size={16}/><i><strong>Host operates</strong><small>In the separate host dashboard</small></i></li></ol></div><button type="button" className="po-host-test" onClick={onHostTest}><ShieldCheck size={17}/>Run Host Test</button><small className="po-safe-note">Safe sample data · no customer contacted</small></aside>;
}

export default function PickupExperience({dark=false,setDark=()=>{},onOpenHostTest=()=>{}}){
  const initial=useMemo(()=>readPickup(),[]);
  const menuBook=useMemo(()=>readMenuBook().data,[]);
  const menu=menuBook.menus.find(item=>item.id===menuBook.activeMenuId)||menuBook.menus[0];
  const [data,setData]=useState(initial.data);
  const [tab,setTab]=useState('service');
  const [shareOpen,setShareOpen]=useState(false);
  const [previewOpen,setPreviewOpen]=useState(false);
  const [notice,setNotice]=useState('');
  const [storageError,setStorageError]=useState(initial.error);
  const settings=data.settings;
  const orderUrl=typeof window==='undefined'?'https://tawaslo.com/order/marina-social-club':`${window.location.origin}/order/marina-social-club`;

  useEffect(()=>{if(!notice)return undefined;const timer=setTimeout(()=>setNotice(''),2600);return()=>clearTimeout(timer)},[notice]);
  const setSetting=(field,value)=>setData(current=>({...current,settings:{...current.settings,[field]:value}}));
  const toggleList=(field,value)=>setData(current=>{const list=current.settings[field]||[];return{...current,settings:{...current.settings,[field]:list.includes(value)?list.filter(item=>item!==value):[...list,value]}}});
  const checks=[
    {label:'Ordering status',note:settings.enabled?'Guest ordering is open':'Ordering is paused',ready:settings.enabled},
    {label:'Service method',note:settings.serviceModes.length?`${settings.serviceModes.length} method${settings.serviceModes.length===1?'':'s'} selected`:'Choose at least one',ready:settings.serviceModes.length>0},
    {label:'Menu or catalog',note:menu?.title||'Connect products',ready:Boolean(menu?.items?.length)},
    {label:'Checkout',note:settings.payOnline||settings.payCounter?'A payment method is ready':'Choose how guests pay',ready:settings.payOnline||settings.payCounter},
    {label:'Host destination',note:settings.hostDestination||'Choose where orders arrive',ready:Boolean(settings.hostDestination)},
    {label:'Guest language',note:settings.languages.join(' · ')||'Choose a language',ready:settings.languages.length>0},
  ];

  function save(){const result=savePickup(data);if(result.ok){setData(result.data);setStorageError('');setNotice('Order setup saved in this browser.');}else setStorageError(result.error)}
  async function copyLink(){try{await navigator.clipboard.writeText(orderUrl);setNotice('Guest order link copied.')}catch(_){setNotice('Copy was blocked. Use Link and QR instead.')}}

  return <main className="tw-pickup" data-pickup-theme={dark?'dark':'light'}>
    <div className="po-preview-line"><span>Order setup preview · Agency workspace · No live orders appear here</span><div className="po-preview-actions"><button type="button" className="tw-host-test-launch" onClick={onOpenHostTest}><ShieldCheck size={16}/>Host Test</button><button type="button" aria-label={dark?'Use light Orders theme':'Use dark Orders theme'} onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button></div></div>
    <header className="po-heading"><div><span><img src="/logo-transparent.png" width="22" height="22" alt=""/>Marina Social Club / Order setup</span><h1>Orders, ready before launch.</h1><p>Set how customers order, pay and receive products. The client’s host team handles every live order later.</p></div><nav><button type="button" onClick={()=>setShareOpen(value=>!value)}><Link2 size={17}/>Link and QR</button><button type="button" onClick={()=>setPreviewOpen(true)}><Eye size={17}/>Preview checkout</button><button type="button" className="po-save" onClick={save}><Save size={17}/>Save setup</button></nav></header>
    {shareOpen&&<ShareGenerator menus={menuBook.menus} activeMenuId={menuBook.activeMenuId} defaultTarget="pickup" onClose={()=>setShareOpen(false)}/>} {storageError&&<p className="po-error" role="alert">{storageError}</p>}<div className="po-toast" role="status">{notice}</div>
    <section className="po-boundary"><ShieldCheck size={20}/><div><strong>The agency prepares the system.</strong><span>Daily accepting, preparing, dispatching, collection and refunds belong to the future Host dashboard.</span></div><button type="button" onClick={onOpenHostTest}>Test the host flow<ChevronRight size={16}/></button></section>
    <nav className="po-tabs" aria-label="Order setup sections">{SETUP_TABS.map(item=><button type="button" key={item.id} aria-pressed={tab===item.id} onClick={()=>setTab(item.id)}><item.Icon size={17}/><span>{item.label}</span></button>)}</nav>
    <div className="po-workspace"><section className="po-panel">
      {tab==='service'&&<><header className="po-panel-head"><span>01 · Service</span><h2>How can customers receive an order?</h2><p>Use one method or combine them. This works for restaurants, cafés, shops and product businesses.</p></header><div className="po-service-grid">{SERVICE_TYPES.map(service=><ServiceChoice key={service.id} service={service} active={settings.serviceModes.includes(service.id)} onClick={()=>toggleList('serviceModes',service.id)}/>)}</div><div className="po-form-grid"><Toggle label={settings.enabled?'Ordering open':'Ordering paused'} note="Keep setup saved while pausing new orders" checked={settings.enabled} onChange={value=>setSetting('enabled',value)} Icon={ShoppingBag}/><Field label="Location" note="Shown at checkout and in confirmations"><input value={settings.location} onChange={event=>setSetting('location',event.target.value)} /></Field><Field label="Opens"><input type="time" value={settings.opens} onChange={event=>setSetting('opens',event.target.value)} /></Field><Field label="Closes"><input type="time" value={settings.closes} onChange={event=>setSetting('closes',event.target.value)} /></Field><Field label="Default preparation / fulfilment" note="Items left blank inherit this time"><select value={settings.prepMinutes} onChange={event=>setSetting('prepMinutes',Number(event.target.value))}>{PREPARATION_OPTIONS.map(value=><option key={value} value={value}>{formatLeadTime(value)}</option>)}</select></Field><Toggle label="Allow scheduled orders" note="Customers can choose a later date and time" checked={settings.allowScheduled} onChange={value=>setSetting('allowScheduled',value)} Icon={CalendarClock}/>{settings.allowScheduled&&<Field label="Scheduled-order window" note="The latest date a customer may choose"><select value={settings.advanceDays} onChange={event=>setSetting('advanceDays',Number(event.target.value))}>{[0,1,3,7,14,30,60].map(value=><option key={value} value={value}>{value===0?'Same day only':value===1?'1 day ahead':`${value} days ahead`}</option>)}</select></Field>}</div><div className="po-linked"><ReceiptText size={19}/><span><strong>{menu?.title||'Menu or catalog not connected'}</strong><small>{menu?.items?.length||0} products connected from Menu / catalog</small></span><a href="?page=menu&occasions=editorial">Manage products<ChevronRight size={15}/></a></div></>}
      {tab==='checkout'&&<><header className="po-panel-head"><span>02 · Checkout</span><h2>Money and rules for every market.</h2><p>Currency, tax and payment belong to the client account—not the agency wallet.</p></header><div className="po-form-grid po-checkout-grid"><Field label="Currency"><select value={settings.currency} onChange={event=>setSetting('currency',event.target.value)}>{CURRENCIES.map(value=><option key={value}>{value}</option>)}</select></Field><Field label="Tax display"><select value={settings.taxMode} onChange={event=>setSetting('taxMode',event.target.value)}><option value="included">Prices include tax</option><option value="added">Tax added at checkout</option><option value="none">No tax shown</option></select></Field><Field label="Minimum order" note={`Shown in ${settings.currency}`}><input inputMode="decimal" value={settings.minimumOrder} onChange={event=>setSetting('minimumOrder',event.target.value.replace(/[^0-9.]/g,'').slice(0,10))}/></Field><Field label="Business timezone"><select value={settings.timezone} onChange={event=>setSetting('timezone',event.target.value)}>{TIMEZONES.map(value=><option key={value}>{value}</option>)}</select></Field><Toggle label="Online payment" note="Money settles to the client’s payment account" checked={settings.payOnline} onChange={value=>setSetting('payOnline',value)} Icon={CreditCard}/><Toggle label="Pay on collection" note="Host records payment during handoff" checked={settings.payCounter} onChange={value=>setSetting('payCounter',value)} Icon={WalletCards}/></div><div className="po-info-callout"><CreditCard size={20}/><span><strong>No agency money movement</strong><small>Tawaslo only passes the checkout status. Settlement, refunds and chargebacks remain with the client’s connected provider.</small></span></div></>}
      {tab==='handoff'&&<><header className="po-panel-head"><span>03 · Host handoff</span><h2>Decide where new orders arrive.</h2><p>Configure the route once. The host receives and operates live orders in their own workspace.</p></header><div className="po-form-grid"><Field label="Live order destination"><select value={settings.hostDestination} onChange={event=>setSetting('hostDestination',event.target.value)}><option>Host dashboard + email</option><option>Host dashboard only</option><option>Host dashboard + SMS</option></select></Field><Field label="Order email"><input type="email" value={settings.hostEmail} onChange={event=>setSetting('hostEmail',event.target.value)} /></Field><Field label="Order reference prefix" note="Example: MSC-1048"><input value={settings.orderPrefix} maxLength={8} onChange={event=>setSetting('orderPrefix',event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,''))}/></Field><Toggle label="Customer status updates" note="Confirmation, ready, dispatched and completed" checked={settings.notifyGuest} onChange={value=>setSetting('notifyGuest',value)} Icon={BellRing}/><Toggle label="Car or curbside collection" note="Customer can add vehicle details" checked={settings.carhop} onChange={value=>setSetting('carhop',value)} Icon={Store}/><Toggle label="AI Concierge support" note="Answers product and order-status questions" checked={settings.aiEnabled} onChange={value=>setSetting('aiEnabled',value)} Icon={Bot}/></div><div className="po-host-route"><div><span>1</span><i><strong>Agency configures</strong><small>Methods, rules and checkout</small></i></div><ChevronRight size={18}/><div><span>2</span><i><strong>Host receives</strong><small>Live orders and alerts</small></i></div><ChevronRight size={18}/><div><span>3</span><i><strong>Customer updates</strong><small>Progress without chasing</small></i></div></div></>}
      {tab==='guest'&&<><header className="po-panel-head"><span>04 · Guest experience</span><h2>Keep ordering clear in every language.</h2><p>Choose what customers see before sharing the order link.</p></header><fieldset className="po-language"><legend>Checkout languages</legend><p>Customers can switch between every selected language.</p><div>{LANGUAGES.map(language=><button type="button" key={language} aria-pressed={settings.languages.includes(language)} onClick={()=>toggleList('languages',language)}><Languages size={16}/>{language}{settings.languages.includes(language)&&<Check size={14}/>}</button>)}</div></fieldset><Field label="Checkout note" note="Keep it short and useful"><textarea rows={3} value={settings.checkoutNote} onChange={event=>setSetting('checkoutNote',event.target.value.slice(0,180))}/></Field><div className="po-link-card"><Link2 size={18}/><span><strong>Guest order link</strong><small>{orderUrl}</small></span><button type="button" onClick={copyLink}><Copy size={15}/>Copy link</button></div><button type="button" className="po-wide-preview" onClick={()=>setPreviewOpen(true)}><Eye size={17}/>Open guest checkout preview</button></>}
    </section><Readiness checks={checks} onHostTest={onOpenHostTest}/></div>
    <footer className="po-foot"><span><MapPin size={14}/>{settings.location}</span><span><Globe2 size={14}/>{settings.currency} · {settings.timezone}</span><span><ShieldCheck size={14}/>Host operations stay outside the agency workspace</span></footer>
    {previewOpen&&<CheckoutPreview settings={settings} menu={menu} onClose={()=>setPreviewOpen(false)}/>} 
  </main>;
}

