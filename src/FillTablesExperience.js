import { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Check, Clock, Gift, MessageCircle, Send, ShieldCheck, Users } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import './fill-tables-experience.css';

const SLOTS = [
  { id:'early', label:'Tonight', time:'7:30–9:30 PM', note:'36 seats at risk' },
  { id:'late', label:'Late tables', time:'9:30–11:00 PM', note:'28 seats at risk' },
  { id:'lunch', label:'Tomorrow', time:'12:00–2:30 PM', note:'21 seats at risk' },
];

const OFFERS = [
  { id:'dessert', label:'Dessert on us', short:'a dessert is on us' },
  { id:'percent', label:'15% off', short:'enjoy 15% off your table' },
  { id:'sparkling', label:'Welcome drinks', short:'your welcome drinks are on us' },
];

const GUESTS = [
  { id:'layla', initials:'LA', name:'Layla Al Sayed', note:'14 visits · usually books for four', signal:'Visited last night', tone:'coral' },
  { id:'omar', initials:'OY', name:'Omar Yusuf', note:'9 visits · prefers late tables', signal:'No booking tonight', tone:'mint' },
  { id:'maya', initials:'MC', name:'Maya Chen', note:'4 visits · vegetarian', signal:'Active this month', tone:'lilac' },
  { id:'yusuf', initials:'YH', name:'Yusuf Habib', note:'6 visits · often books same-day', signal:'No booking tonight', tone:'gold' },
  { id:'noor', initials:'NJ', name:'Noor Jassim', note:'11 visits · brings friends', signal:'Near the venue', tone:'blue' },
  { id:'fatima', initials:'FM', name:'Fatima Mohamed', note:'3 visits · sunset side', signal:'Near the venue', tone:'rose' },
];

const TABLES = [
  { id:1, seats:4, x:19, y:27, occupied:true }, { id:2, seats:2, x:44, y:20, occupied:true },
  { id:3, seats:4, x:72, y:27, occupied:false }, { id:4, seats:6, x:27, y:64, occupied:false },
  { id:5, seats:4, x:57, y:59, occupied:false }, { id:6, seats:2, x:82, y:68, occupied:true },
];

function FloorTable({ table }) {
  return <span className={`fmt-floor-table ${table.occupied ? 'is-occupied' : 'is-open'} seats-${table.seats}`} style={{ left:`${table.x}%`, top:`${table.y}%` }} aria-hidden="true"><i/><b>{table.seats}</b></span>;
}

export default function FillTablesExperience({ dark=false, onOpenGuests }) {
  const [slot, setSlot] = useState('early');
  const [offer, setOffer] = useState('dessert');
  const [selected, setSelected] = useState(GUESTS.map(guest => guest.id));
  const [filter, setFilter] = useState('regulars');
  const [prepared, setPrepared] = useState(false);
  const [toast, setToast] = useState('');

  const activeSlot = SLOTS.find(item => item.id === slot) || SLOTS[0];
  const activeOffer = OFFERS.find(item => item.id === offer) || OFFERS[0];
  const message = useMemo(() => `Hi Layla — Marina Social Club has a few beautiful tables open ${activeSlot.label.toLowerCase()} between ${activeSlot.time}. Join us and ${activeOffer.short}. Reply here and we’ll hold your table.`, [activeSlot, activeOffer]);
  const toggleGuest = id => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const prepare = () => {
    setPrepared(true);
    setToast(`${selected.length} WhatsApp messages prepared — nothing was sent.`);
    window.setTimeout(() => setToast(''), 2400);
  };

  return <main className="tw-fill-tables-experience" data-fmt-theme={dark ? 'dark' : 'light'}>
    <section className="fmt-hero" aria-labelledby="fmt-title">
      <div className="fmt-hero-copy">
        <p className="fmt-eyebrow"><CalendarDays size={15} aria-hidden="true"/>Fill My Tables · Tonight</p>
        <h1 id="fmt-title">Give the quiet tables a reason to glow.</h1>
        <p className="fmt-lede">See the soft spots before service, shape one thoughtful offer, and invite the regulars most likely to say yes.</p>
        <div className="fmt-hero-facts" aria-label="Tonight's floor summary">
          <span><strong>38%</strong><small>booked · next 2 hours</small></span>
          <span><strong>36</strong><small>open seats</small></span>
          <span><strong>12</strong><small>recoverable covers</small></span>
        </div>
        <button type="button" className="fmt-primary fmt-hero-action" onClick={() => document.getElementById('fmt-runway')?.scrollIntoView({ behavior:'smooth', block:'start' })}>Shape tonight’s invitation<ArrowRight size={17} aria-hidden="true"/></button>
      </div>
      <div className="fmt-floor" role="img" aria-label="Floor pulse showing 22 of 58 seats booked and the open tables for tonight">
        <div className="fmt-floor-orbit is-one"/><div className="fmt-floor-orbit is-two"/>
        <div className="fmt-floor-label"><span>LIVE FLOOR</span><strong>22 / 58</strong><small>seats held</small></div>
        {TABLES.map(table => <FloorTable table={table} key={table.id}/>)}
        <div className="fmt-floor-key"><span><i className="is-held"/>Held</span><span><i className="is-open"/>Open</span></div>
      </div>
    </section>

    <section id="fmt-runway" className="fmt-runway" aria-labelledby="fmt-runway-title">
      <header><div><p className="fmt-kicker">Tonight’s invitation</p><h2 id="fmt-runway-title">Three decisions. One clear message.</h2></div><span><ShieldCheck size={16} aria-hidden="true"/>Opted-in guests only</span></header>
      <div className="fmt-runway-track">
        <fieldset className="fmt-runway-step"><legend><b>When</b><small>Pick the soft service window</small></legend><div className="fmt-choice-stack">{SLOTS.map(item => <button type="button" key={item.id} className={slot === item.id ? 'is-active' : ''} aria-pressed={slot === item.id} onClick={() => { setSlot(item.id); setPrepared(false); }}><Clock size={16} aria-hidden="true"/><span><strong>{item.label}</strong><small>{item.time} · {item.note}</small></span>{slot === item.id && <Check size={16} aria-hidden="true"/>}</button>)}</div></fieldset>
        <fieldset className="fmt-runway-step"><legend><b>The reason</b><small>Useful, warm and time-boxed</small></legend><div className="fmt-offer-list">{OFFERS.map(item => <button type="button" key={item.id} className={offer === item.id ? 'is-active' : ''} aria-pressed={offer === item.id} onClick={() => { setOffer(item.id); setPrepared(false); }}><Gift size={16} aria-hidden="true"/><span>{item.label}</span></button>)}</div><label className="fmt-small-field">Guest-facing name<input value={activeOffer.label} readOnly aria-readonly="true"/></label></fieldset>
        <fieldset className="fmt-runway-step"><legend><b>Who hears it</b><small>Respect consent and relevance</small></legend><div className="fmt-audience-tabs" role="group" aria-label="Audience preset">{[['regulars','Regulars'],['nearby','Nearby'],['open','No booking']].map(([id,label]) => <button type="button" key={id} aria-pressed={filter === id} className={filter === id ? 'is-active' : ''} onClick={() => setFilter(id)}>{label}</button>)}</div><div className="fmt-audience-result"><Users size={20} aria-hidden="true"/><span><strong>{selected.length} guests selected</strong><small>All have WhatsApp marketing consent</small></span></div></fieldset>
      </div>
    </section>

    <section className="fmt-compose" aria-labelledby="fmt-compose-title">
      <div className="fmt-guest-book">
        <header><div><p className="fmt-kicker">The guest list</p><h2 id="fmt-compose-title">Invite people, not segments.</h2></div><button type="button" onClick={() => setSelected(selected.length === GUESTS.length ? [] : GUESTS.map(guest => guest.id))}>{selected.length === GUESTS.length ? 'Clear' : 'Select all'}</button></header>
        <div className="fmt-guests" role="group" aria-label="Choose opted-in guests">{GUESTS.map(guest => { const checked = selected.includes(guest.id); return <button type="button" role="checkbox" aria-checked={checked} className={checked ? 'is-selected' : ''} key={guest.id} onClick={() => { toggleGuest(guest.id); setPrepared(false); }}><span className={`fmt-avatar is-${guest.tone}`}>{guest.initials}</span><span className="fmt-guest-name"><strong>{guest.name}</strong><small>{guest.note}</small></span><span className="fmt-signal">{guest.signal}</span><i>{checked && <Check size={14} aria-hidden="true"/>}</i></button>; })}</div>
        <button type="button" className="fmt-text-link" onClick={onOpenGuests}>Manage consent and guest details<ArrowRight size={15} aria-hidden="true"/></button>
      </div>

      <aside className="fmt-message" aria-labelledby="fmt-message-title">
        <div className="fmt-phone-top"><FaWhatsapp aria-hidden="true"/><div><strong id="fmt-message-title">Marina Social Club</strong><small>WhatsApp preview</small></div><span>Preview</span></div>
        <div className="fmt-chat-date">TONIGHT’S INVITATION</div>
        <div className="fmt-bubble"><p>{message}</p><time>6:12 PM <Check size={12} aria-hidden="true"/><Check size={12} aria-hidden="true"/></time></div>
        <div className="fmt-reply"><MessageCircle size={15} aria-hidden="true"/>A reply can hold a table in Reservations.</div>
        <div className="fmt-message-summary"><span><CalendarDays size={16} aria-hidden="true"/>{activeSlot.time}</span><span><Gift size={16} aria-hidden="true"/>{activeOffer.label}</span></div>
        <button type="button" className="fmt-primary fmt-prepare" onClick={prepare} disabled={!selected.length}>{prepared ? <><Check size={17} aria-hidden="true"/>Campaign prepared</> : <><Send size={17} aria-hidden="true"/>Prepare {selected.length} WhatsApps</>}</button>
        <p className="fmt-safety"><ShieldCheck size={14} aria-hidden="true"/>Design preview only. Nothing is sent from this page.</p>
      </aside>
    </section>

    <section className="fmt-outcome" aria-label="Expected result">
      <div><p className="fmt-kicker">Expected lift</p><strong>12 more covers</strong><span>Based on similar regulars, this window and the selected offer.</span></div>
      <div className="fmt-outcome-line"><span style={{'--fmt-value':'38%'}}>Now <b>38%</b></span><i/><span style={{'--fmt-value':'59%'}}>With replies <b>59%</b></span></div>
      <div><p className="fmt-kicker">The rule</p><strong>Useful, never noisy.</strong><span>The engine stays quiet when the room does not need help.</span></div>
    </section>
    <div className="fmt-toast" role="status" aria-live="polite">{toast}</div>
  </main>;
}
