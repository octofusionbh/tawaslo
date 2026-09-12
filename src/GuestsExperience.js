import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowRight, CalendarDays, Check, ChevronRight, Clock3,
  Edit3, Gift, HeartHandshake, Mail, MapPin, MessageCircle, Phone,
  Plus, Search, ShieldCheck, Star, Tags, Trash2, Users,
  Utensils, X,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import './guests-experience.css';

const STORAGE_KEY = 'tw_guests_experience_v1';

const SAMPLE_GUESTS = [
  { id:'layla', firstName:'Layla', lastName:'Al Sayed', phone:'3600 1122', code:'+973', email:'layla@example.com', birthday:'1992-09-05', birthdayIn:3, visits:14, spend:245.6, lastVisit:'Last night', usual:'Charred Gulf prawns · sparkling water', allergies:'Shellfish sensitivity — confirm preparation', seat:'Terrace · table 08', notes:'Prefers the sunset side. Usually books for four.', vip:true, marketing:true, emailOptin:true, source:'Reservation', occasions:['Birthday', 'Friends'] },
  { id:'omar', firstName:'Omar', lastName:'Yusuf', phone:'3771 4802', code:'+973', email:'omar@example.com', birthday:'1988-11-18', birthdayIn:77, visits:9, spend:182.4, lastVisit:'28 Aug', usual:'Truffle rigatoni · still water', allergies:'None recorded', seat:'Window · table 04', notes:'Business lunches. Likes a quiet table.', vip:true, marketing:true, emailOptin:false, source:'Reservation', occasions:['Business'] },
  { id:'maya', firstName:'Maya', lastName:'Chen', phone:'3922 7041', code:'+973', email:'maya@example.com', birthday:'1995-09-08', birthdayIn:6, visits:4, spend:76.8, lastVisit:'25 Aug', usual:'Warm hummus · mint lemonade', allergies:'Vegetarian', seat:'Inside · table 12', notes:'Celebrated an anniversary here in June.', vip:false, marketing:true, emailOptin:true, source:'Loyalty', occasions:['Anniversary'] },
  { id:'yusuf', firstName:'Yusuf', lastName:'Habib', phone:'3990 8826', code:'+973', email:'', birthday:'1990-09-12', birthdayIn:10, visits:6, spend:118.2, lastVisit:'23 Aug', usual:'Grilled sea bass · espresso', allergies:'Gluten-free', seat:'Terrace · table 05', notes:'Often orders pickup for the office on Thursdays.', vip:false, marketing:true, emailOptin:false, source:'Pickup', occasions:['Office'] },
  { id:'sara', firstName:'Sara', lastName:'Nasser', phone:'3334 2251', code:'+973', email:'sara@example.com', birthday:'1997-12-02', birthdayIn:91, visits:2, spend:41.7, lastVisit:'20 Aug', usual:'Burrata · iced tea', allergies:'Tree nuts', seat:'No preference yet', notes:'Found Marina through Instagram.', vip:false, marketing:false, emailOptin:false, source:'Review', occasions:['Dinner'] },
  { id:'daniel', firstName:'Daniel', lastName:'Reed', phone:'555 0198', code:'+44', email:'daniel@example.com', birthday:'1985-10-09', birthdayIn:37, visits:7, spend:156.9, lastVisit:'18 Aug', usual:'Sea bass · sauvignon blanc', allergies:'None recorded', seat:'Window · table 02', notes:'Visits Bahrain monthly. Hotel concierge referral.', vip:false, marketing:true, emailOptin:true, source:'Reservation', occasions:['Travel'] },
  { id:'noor', firstName:'Noor', lastName:'Jassim', phone:'3888 1904', code:'+973', email:'noor@example.com', birthday:'1999-09-03', birthdayIn:1, visits:11, spend:207.3, lastVisit:'16 Aug', usual:'Small plates · passionfruit spritz', allergies:'Dairy-free', seat:'Terrace · table 10', notes:'Comes with the same group after work.', vip:true, marketing:true, emailOptin:true, source:'Loyalty', occasions:['After work', 'Birthday'] },
  { id:'fatima', firstName:'Fatima', lastName:'Mohamed', phone:'3662 7440', code:'+973', email:'fatima@example.com', birthday:'1993-09-16', birthdayIn:14, visits:3, spend:63.5, lastVisit:'12 Aug', usual:'Warm hummus · sea bass', allergies:'Sesame allergy', seat:'Inside · table 09', notes:'Asked for a quieter corner on the last visit.', vip:false, marketing:false, emailOptin:true, source:'Reservation', occasions:['Family'] },
];

const TABS = [
  ['book', 'Guest book', Users],
  ['moments', 'Moments', Gift],
  ['segments', 'Segments', Tags],
];

const FILTERS = [
  ['all', 'Everyone'], ['vip', 'VIP'], ['returning', 'Returning'],
  ['birthday', 'Birthday soon'], ['allergy', 'Allergy noted'], ['consent', 'Can contact'],
];

const SEGMENTS = [
  { id:'regulars', label:'Regulars', count:64, note:'Visited 4+ times in the last 90 days', color:'violet', filter:g=>g.visits>=4 },
  { id:'quiet', label:'We miss you', count:31, note:'Loved Marina, but absent for 45+ days', color:'coral', filter:g=>['daniel','fatima'].includes(g.id) },
  { id:'birthdays', label:'Birthday fortnight', count:19, note:'Birthday in the next fourteen days', color:'gold', filter:g=>g.birthdayIn<=14 },
  { id:'terrace', label:'Terrace people', count:47, note:'Prefer outdoor or sunset-side seating', color:'aqua', filter:g=>(g.seat||'').toLowerCase().includes('terrace') },
];

const emptyGuest = { id:'', firstName:'', lastName:'', code:'+973', phone:'', email:'', birthday:'', birthdayIn:365, visits:0, spend:0, lastVisit:'Not visited yet', usual:'', allergies:'None recorded', seat:'No preference yet', notes:'', vip:false, marketing:false, emailOptin:false, source:'Manual', occasions:[] };

function readGuests() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const source = Array.isArray(parsed) && parsed.length ? parsed : SAMPLE_GUESTS;
    return source.map(guest => {
      const full = `${guest?.firstName || ''} ${guest?.lastName || ''}`.trim();
      return /\bal khalifa\b/i.test(full)
        ? { ...guest, firstName:guest?.firstName || 'Omar', lastName:'Yusuf' }
        : guest;
    });
  } catch (_) { return SAMPLE_GUESTS; }
}

function fullName(guest) { return `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || 'Guest'; }
function initials(guest) { return `${guest.firstName?.[0] || ''}${guest.lastName?.[0] || ''}`.toUpperCase() || 'G'; }
function money(value) { return `BHD ${Number(value || 0).toFixed(3)}`; }

function GuestEditor({ guest, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(guest);
  const [error, setError] = useState('');
  const firstInput = useRef(null);
  useEffect(() => {
    firstInput.current?.focus();
    const close = event => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);
  const change = (field, value) => setDraft(current => ({ ...current, [field]:value }));
  const submit = event => {
    event.preventDefault();
    if (!draft.firstName.trim()) { setError('Add a first name so the team knows who to welcome.'); return; }
    onSave({ ...draft, id:draft.id || `guest-${Date.now()}` });
  };
  return <div className="gu-overlay" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="gu-editor" role="dialog" aria-modal="true" aria-labelledby="gu-editor-title">
      <header><div><span>Guest memory</span><h2 id="gu-editor-title">{guest.id ? 'Edit the details that matter.' : 'Welcome someone new.'}</h2><p>Keep only what helps the team give better, safer service.</p></div><button type="button" aria-label="Close guest editor" onClick={onClose}><X size={18}/></button></header>
      <form onSubmit={submit}>
        <div className="gu-form-grid">
          <label>First name<input ref={firstInput} value={draft.firstName} onChange={e=>change('firstName',e.target.value)} /></label>
          <label>Last name<input value={draft.lastName} onChange={e=>change('lastName',e.target.value)} /></label>
          <label className="gu-phone-field">WhatsApp number<span><select aria-label="Country code" value={draft.code} onChange={e=>change('code',e.target.value)}><option>+973</option><option>+966</option><option>+971</option><option>+965</option><option>+974</option><option>+968</option><option>+44</option><option>+1</option></select><input aria-label="Phone number" inputMode="tel" value={draft.phone} onChange={e=>change('phone',e.target.value)} /></span></label>
          <label>Email<input type="email" value={draft.email} onChange={e=>change('email',e.target.value)} /></label>
          <label>Birthday<input type="date" value={draft.birthday} onChange={e=>change('birthday',e.target.value)} /></label>
          <label>Preferred table or area<input value={draft.seat} onChange={e=>change('seat',e.target.value)} placeholder="Terrace · table 08" /></label>
          <label className="gu-form-wide">Usual order<input value={draft.usual} onChange={e=>change('usual',e.target.value)} placeholder="What do they come back for?" /></label>
          <label className="gu-form-wide">Allergies or dietary needs<input value={draft.allergies} onChange={e=>change('allergies',e.target.value)} placeholder="Keep this specific and visible" /></label>
          <label className="gu-form-wide">Host notes<textarea rows="3" value={draft.notes} onChange={e=>change('notes',e.target.value)} placeholder="A useful detail for the next welcome…" /></label>
        </div>
        <div className="gu-consent-grid">
          <label><input type="checkbox" checked={draft.vip} onChange={e=>change('vip',e.target.checked)}/><span><Star size={15}/><strong>VIP guest</strong><small>Make their preferences easy to spot</small></span></label>
          <label><input type="checkbox" checked={draft.marketing} onChange={e=>change('marketing',e.target.checked)}/><span><FaWhatsapp/><strong>WhatsApp opt-in</strong><small>Happy to receive relevant offers</small></span></label>
          <label><input type="checkbox" checked={draft.emailOptin} onChange={e=>change('emailOptin',e.target.checked)}/><span><Mail size={15}/><strong>Email opt-in</strong><small>May receive occasional updates</small></span></label>
        </div>
        {error && <p className="gu-form-error" role="alert">{error}</p>}
        <footer>{guest.id && <button type="button" className="gu-delete" onClick={()=>onDelete(guest)}><Trash2 size={15}/>Remove guest</button>}<span/><button type="button" onClick={onClose}>Cancel</button><button type="submit"><Check size={16}/>Save guest</button></footer>
      </form>
    </section>
  </div>;
}

function GuestProfile({ guest, onEdit, notify }) {
  if (!guest) return null;
  const allergy = guest.allergies && guest.allergies !== 'None recorded';
  return <aside className="gu-profile" aria-label={`${fullName(guest)} profile`}>
    <div className="gu-profile-art"><span className="gu-profile-orbit"/><span className="gu-profile-avatar">{initials(guest)}</span><div>{guest.vip && <span><Star size={12} fill="currentColor"/>VIP regular</span>}<h3>{fullName(guest)}</h3><p>{guest.visits} visits · {money(guest.spend)} remembered</p></div></div>
    <div className="gu-profile-actions"><button type="button" onClick={()=>notify(`A warm WhatsApp draft for ${guest.firstName} is ready to review.`)} disabled={!guest.marketing}><FaWhatsapp/>Prepare WhatsApp</button><button type="button" aria-label={`Edit ${fullName(guest)}`} onClick={onEdit}><Edit3 size={16}/></button></div>
    {!guest.marketing && <p className="gu-private-note"><ShieldCheck size={15}/>No marketing consent. Service messages only.</p>}
    {allergy && <div className="gu-allergy"><AlertTriangle size={17}/><span><strong>Tell the floor and kitchen</strong><small>{guest.allergies}</small></span></div>}
    <div className="gu-memory-list">
      <div><Utensils size={15}/><span><small>The usual</small><strong>{guest.usual || 'Still learning'}</strong></span></div>
      <div><MapPin size={15}/><span><small>Feels at home</small><strong>{guest.seat}</strong></span></div>
      <div><CalendarDays size={15}/><span><small>Last visit</small><strong>{guest.lastVisit}</strong></span></div>
      <div><HeartHandshake size={15}/><span><small>Host note</small><strong>{guest.notes || 'No note yet'}</strong></span></div>
    </div>
    <div className="gu-contact"><span><Phone size={13}/>{guest.code} {guest.phone || 'No phone'}</span><span><Mail size={13}/>{guest.email || 'No email'}</span></div>
    <div className="gu-source"><span>Memory built from</span><div>{['Reservations','Pickup','Loyalty','Reviews'].map(source=><i key={source} data-active={source.startsWith(guest.source)}>{source}</i>)}</div></div>
  </aside>;
}

function GuestBook({ guests, selectedId, setSelectedId, onEdit, notify }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const filtered = useMemo(() => guests.filter(guest => {
    const text = `${fullName(guest)} ${guest.phone} ${guest.email} ${guest.usual} ${guest.allergies}`.toLowerCase();
    const match = !query.trim() || text.includes(query.trim().toLowerCase());
    const segment = filter === 'all' || (filter === 'vip' && guest.vip) || (filter === 'returning' && guest.visits >= 4) || (filter === 'birthday' && guest.birthdayIn <= 14) || (filter === 'allergy' && guest.allergies && guest.allergies !== 'None recorded') || (filter === 'consent' && guest.marketing);
    return match && segment;
  }), [guests, query, filter]);
  const selected = guests.find(g=>g.id===selectedId) || filtered[0] || null;
  return <section className="gu-book-view">
    <header><div><span>The guest book</span><h2>Remember the detail.<br/>Change the welcome.</h2></div><p>Every booking, pickup, loyalty visit and review can enrich one respectful guest profile.</p></header>
    <div className="gu-search"><Search size={17}/><input aria-label="Search guests" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a name, number, usual order or allergy…"/><kbd>{filtered.length} shown</kbd></div>
    <div className="gu-filters" role="group" aria-label="Guest filters">{FILTERS.map(([id,label])=><button type="button" key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div>
    <div className="gu-book-shell">
      <div className="gu-guest-list" aria-label="Guest list">
        <div className="gu-list-label"><span>Guest</span><span>Relationship</span></div>
        {filtered.map(guest=>{
          const allergy=guest.allergies&&guest.allergies!=='None recorded';
          return <button type="button" key={guest.id} aria-pressed={selected?.id===guest.id} onClick={()=>setSelectedId(guest.id)}>
            <span className="gu-list-avatar">{initials(guest)}{guest.vip&&<Star size={9} fill="currentColor"/>}</span>
            <span className="gu-list-copy"><strong>{fullName(guest)}</strong><small>{guest.lastVisit} · {guest.source}</small><span>{guest.usual || 'Preferences still forming'}</span></span>
            <span className="gu-list-rel"><strong>{guest.visits}</strong><small>visits</small>{allergy&&<i title={guest.allergies}><AlertTriangle size={13}/>Care note</i>}</span>
            <ChevronRight size={17}/>
          </button>;
        })}
        {!filtered.length && <div className="gu-list-empty"><Search size={25}/><strong>No guest matches this view.</strong><span>Try a different name or filter.</span></div>}
      </div>
      <GuestProfile guest={selected} onEdit={()=>onEdit(selected)} notify={notify}/>
    </div>
  </section>;
}

function Moments({ guests, notify }) {
  const upcoming = guests.filter(g=>g.birthdayIn<=14).sort((a,b)=>a.birthdayIn-b.birthdayIn);
  const [auto, setAuto] = useState({ birthday:true, returnVisit:true, consent:true });
  const toggle = key => setAuto(current=>({ ...current,[key]:!current[key] }));
  return <section className="gu-moments">
    <header><span>Moments, not blasts</span><h2>Reach out when it<br/><em>means something.</em></h2><p>Birthdays, milestones and quiet regulars become thoughtful prompts—not noisy campaigns.</p></header>
    <div className="gu-moment-stage">
      <div className="gu-birthday-radar"><header><div><Gift size={19}/><span><strong>Birthday fortnight</strong><small>{upcoming.length} people in this sample</small></span></div><i>Next 14 days</i></header><div className="gu-moment-line">{upcoming.map((guest,index)=><article key={guest.id}><span className="gu-date"><strong>{guest.birthdayIn===0?'Today':guest.birthdayIn===1?'Tomorrow':`In ${guest.birthdayIn} days`}</strong><small>{new Date(`${guest.birthday}T12:00:00`).toLocaleDateString('en',{month:'short',day:'numeric'})}</small></span><span className="gu-moment-person"><i>{initials(guest)}</i><span><strong>{fullName(guest)}</strong><small>{guest.visits} visits · {guest.usual.split(' · ')[0]}</small></span></span><button type="button" disabled={!guest.marketing} onClick={()=>notify(`${guest.firstName}’s birthday message is ready to personalise.`)}>{guest.marketing?<><Edit3 size={15}/>Prepare message</>:<><ShieldCheck size={15}/>No opt-in</>}</button>{index<upcoming.length-1&&<b aria-hidden="true"/>}</article>)}</div></div>
      <aside className="gu-automation"><span>Quiet automation</span><h3>The team stays human.<br/>Tawaslo remembers.</h3><p>Prepare the right prompt for the right person, then let a human review it.</p>{[
        ['birthday','Birthday reminders','Surface a draft seven days before'],
        ['returnVisit','Regular-guest check-ins','Notice when a familiar face goes quiet'],
        ['consent','Consent protection','Never prepare promotions without opt-in'],
      ].map(([key,title,note])=><button type="button" key={key} aria-pressed={auto[key]} onClick={()=>toggle(key)}><span><strong>{title}</strong><small>{note}</small></span><i><b/></i></button>)}</aside>
    </div>
  </section>;
}

function Segments({ guests, onOpenFillTables }) {
  const [selected, setSelected] = useState(SEGMENTS[0].id);
  const segment = SEGMENTS.find(item=>item.id===selected) || SEGMENTS[0];
  const matches = guests.filter(segment.filter);
  return <section className="gu-segments">
    <header><span>Living audiences</span><h2>Invite the right people.<br/><em>For the right reason.</em></h2><p>Segments update from real guest behaviour and only include people whose consent fits the message.</p></header>
    <div className="gu-segment-shell"><div className="gu-segment-list">{SEGMENTS.map(item=><button type="button" key={item.id} data-color={item.color} aria-pressed={selected===item.id} onClick={()=>setSelected(item.id)}><span>{item.label}</span><strong>{item.count}</strong><small>{item.note}</small><ArrowRight size={17}/></button>)}</div><aside className="gu-segment-preview" data-color={segment.color}><span>Audience preview</span><h3>{segment.label}</h3><p>{segment.note}. Marketing consent is checked again before anything can be prepared.</p><div>{matches.length?matches.map(guest=><span key={guest.id}><i>{initials(guest)}</i><strong>{fullName(guest)}</strong><small>{guest.marketing?'Contactable':'Service only'}</small></span>):<span><strong>No sample matches yet</strong></span>}</div><button type="button" onClick={onOpenFillTables}>Use in Fill My Tables <ArrowRight size={16}/></button><small><ShieldCheck size={13}/>Preview only. Nothing is sent automatically.</small></aside></div>
  </section>;
}

export default function GuestsExperience({ dark, onOpenFillTables }) {
  const [guests, setGuests] = useState(readGuests);
  const [tab, setTab] = useState('book');
  const [selectedId, setSelectedId] = useState(guests[0]?.id || '');
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(guests)); } catch (_) {} }, [guests]);
  const notify = message => { setToast(message); window.setTimeout(()=>setToast(''),2300); };
  const save = guest => { setGuests(current => current.some(item=>item.id===guest.id)?current.map(item=>item.id===guest.id?guest:item):[guest,...current]); setSelectedId(guest.id); setEditing(null); notify(`${fullName(guest)}’s guest memory is saved in this preview.`); };
  const remove = guest => { if (!window.confirm(`Remove ${fullName(guest)} from this sample guest book?`)) return; setGuests(current=>current.filter(item=>item.id!==guest.id)); setSelectedId(current=>current===guest.id?(guests.find(item=>item.id!==guest.id)?.id||''):current); setEditing(null); notify('Guest removed from this preview.'); };
  const totals = { total:248 + guests.length-SAMPLE_GUESTS.length, returning:64, profiles:84, moments:guests.filter(g=>g.birthdayIn<=14).length };
  return <main className="tw-guests" data-theme={dark?'dark':'light'}>
    <div className="gu-preview-bar"><span>Guest Memory preview · Sample profiles · No message is sent automatically</span><span className="gu-preview-status"><ShieldCheck size={14}/>Private by design</span></div>
    <header className="gu-heading"><div><span><Users size={16}/>Guests / Marina Social Club</span><h1>Know the people.<br/><em>Not just the bookings.</em></h1><p>A respectful memory for every return—what they love, what keeps them safe, and what makes the welcome feel personal.</p></div><button type="button" onClick={()=>setEditing({...emptyGuest})}><Plus size={17}/>Add guest</button></header>
    <nav className="gu-tabs" aria-label="Guest workspace">{TABS.map(([id,label,Icon])=><button type="button" key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}><Icon size={16}/>{label}{id==='moments'&&totals.moments?<b>{totals.moments}</b>:null}</button>)}</nav>
    <section className="gu-hero"><div className="gu-hero-copy"><span>One living guest memory</span><h2>Every return should<br/>feel remembered.</h2><p>Reservations, pickup, loyalty and reviews quietly become useful context for the next welcome.</p><div><button type="button" onClick={()=>setTab('book')}>Open guest book <ArrowRight size={16}/></button><button type="button" onClick={()=>setTab('moments')}>See upcoming moments</button></div><small><ShieldCheck size={14}/>Consent stays visible wherever guest data is used.</small></div><div className="gu-constellation" aria-hidden="true"><span className="gu-ring gu-ring-one"/><span className="gu-ring gu-ring-two"/><span className="gu-ring gu-ring-three"/><div className="gu-core"><Users size={21}/><strong>{totals.total}</strong><small>guest memories</small></div>{guests.slice(0,5).map((guest,index)=><span className={`gu-orbit-person gu-person-${index+1}`} key={guest.id}><i>{initials(guest)}</i><small>{guest.firstName}</small></span>)}</div></section>
    <section className="gu-metrics" aria-label="Guest relationship summary"><div><span>Returning guests</span><strong>{totals.returning}%</strong><small>came back in 90 days</small></div><div><span>Known preferences</span><strong>{totals.profiles}%</strong><small>profiles with useful context</small></div><div><span>Upcoming moments</span><strong>{totals.moments}</strong><small>birthdays in 14 days</small></div><div><span>Contactable</span><strong>{guests.filter(g=>g.marketing).length}/{guests.length}</strong><small>with clear opt-in</small></div></section>
    {tab==='book'&&<GuestBook guests={guests} selectedId={selectedId} setSelectedId={setSelectedId} onEdit={guest=>setEditing({...guest})} notify={notify}/>} 
    {tab==='moments'&&<Moments guests={guests} notify={notify}/>} 
    {tab==='segments'&&<Segments guests={guests} onOpenFillTables={onOpenFillTables}/>} 
    <footer className="gu-foot"><span><Check size={14}/>Sample edits save on this device</span><span>Guest consent remains visible in every workflow</span></footer>
    {editing&&<GuestEditor guest={editing} onClose={()=>setEditing(null)} onSave={save} onDelete={remove}/>} 
    {toast&&<div className="gu-toast" role="status"><MessageCircle size={15}/>{toast}</div>}
  </main>;
}
