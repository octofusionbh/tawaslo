import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bot, CalendarClock, Check, ChevronRight, Clock3, Edit3, Eye, Globe2, Link2, MapPin, Minus, Moon, Plus, Save, Settings2, ShieldCheck, Sun, Table2, UsersRound } from 'lucide-react';
import { addReservationSpace, addReservationTable, readReservationPreview, saveReservationPreview, updateReservationTable } from './reservationPreviewModel';
import { ReservationShare, SpaceIcon, SpaceModal, TableChairs } from './ReservationsExperience';
import './reservations-experience.css';
import './reservations-agency.css';

const SETUP_TABS = [
  ['settings', Settings2, 'Rules and availability'],
  ['floor', Table2, 'Venue layout'],
  ['guest', Eye, 'Guest experience'],
];

const NOTICE_OPTIONS=[[0,'No minimum notice'],[30,'30 minutes'],[60,'1 hour'],[90,'1 hour 30 minutes'],[120,'2 hours'],[180,'3 hours'],[240,'4 hours'],[480,'8 hours'],[1440,'1 day']];
const ADVANCE_OPTIONS=[1,7,14,30,60,90,180,365];
const SLOT_OPTIONS=[15,30,45,60];
const withValue=(options,value)=>options.includes(Number(value))?options:[...options,Number(value)].sort((a,b)=>a-b);
const pad=value=>String(value).padStart(2,'0');
const localDateValue=date=>`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
const timeToMinutes=value=>{const [hours,minutes]=String(value||'00:00').split(':').map(Number);return hours*60+minutes;};
const slotValues=(open,close,step)=>{const values=[];for(let minute=timeToMinutes(open);minute<=timeToMinutes(close);minute+=step)values.push(`${pad(Math.floor(minute/60))}:${pad(minute%60)}`);return values;};
const formatNotice=minutes=>NOTICE_OPTIONS.find(([value])=>value===Number(minutes))?.[1]||`${minutes} minutes`;

function ReservationToggle({label,note,checked,onChange,Icon}){
  return <button type="button" className="rv-agency-toggle" aria-pressed={checked} onClick={()=>onChange(!checked)}><Icon size={18} aria-hidden="true"/><span><strong>{label}</strong><small>{note}</small></span><i aria-hidden="true"><b/></i></button>;
}

function ReservationField({label,note,children}){
  return <label className="rv-agency-field"><span>{label}</span>{children}{note&&<small>{note}</small>}</label>;
}

function AgencyReservationSettings({data,setData,onSave,live=false}){
  const settings=data.settings;
  const setSetting=(field,value)=>setData(current=>({...current,settings:{...current.settings,[field]:value}}));
  return <section className="rv-settings rv-agency-rules"><header><span>Booking rules</span><h2>Set when guests can book.</h2><p>These rules apply to the booking link and AI Concierge. The host handles live arrivals later.</p></header><div className="rv-settings-grid">{!live&&<ReservationToggle label={settings.enabled?'Bookings open':'Bookings paused'} note="Pause new bookings without losing setup" checked={settings.enabled} onChange={value=>setSetting('enabled',value)} Icon={CalendarClock}/>}<ReservationToggle label="Require host approval" note="Requests wait for confirmation" checked={settings.requiresApproval} onChange={value=>setSetting('requiresApproval',value)} Icon={ShieldCheck}/><ReservationField label="Booking opens"><input type="time" value={settings.open} onChange={event=>setSetting('open',event.target.value)}/></ReservationField><ReservationField label="Booking closes"><input type="time" value={settings.close} onChange={event=>setSetting('close',event.target.value)}/></ReservationField>{!live&&<><ReservationField label="Minimum notice" note="How soon the first bookable slot may begin"><select value={settings.minNoticeMinutes} onChange={event=>setSetting('minNoticeMinutes',Number(event.target.value))}>{NOTICE_OPTIONS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></ReservationField><ReservationField label="Book-ahead window" note="The furthest date shown to a guest"><select value={settings.advanceDays} onChange={event=>setSetting('advanceDays',Number(event.target.value))}>{ADVANCE_OPTIONS.map(value=><option key={value} value={value}>{value===1?'1 day':`${value} days`}</option>)}</select></ReservationField></>}<ReservationField label="Time-slot interval"><select value={settings.slotMinutes} onChange={event=>setSetting('slotMinutes',Number(event.target.value))}>{withValue(SLOT_OPTIONS,settings.slotMinutes).map(value=><option key={value} value={value}>Every {value} minutes</option>)}</select></ReservationField>{!live&&<><ReservationField label="Table duration"><select value={settings.turnMinutes} onChange={event=>setSetting('turnMinutes',Number(event.target.value))}>{[60,75,90,105,120,150].map(value=><option key={value} value={value}>{value} minutes</option>)}</select></ReservationField><ReservationField label="Largest online party"><input type="number" min="1" max="30" value={settings.maxParty} onChange={event=>setSetting('maxParty',Math.max(1,Math.min(30,Number(event.target.value)||1)))}/></ReservationField><ReservationField label="Held-slot grace period"><select value={settings.holdMinutes} onChange={event=>setSetting('holdMinutes',Number(event.target.value))}>{[5,10,15,20,30].map(value=><option key={value} value={value}>{value} minutes</option>)}</select></ReservationField></>}{!live&&<><ReservationToggle label="AI Concierge" note="Answers using these same booking rules" checked={settings.concierge} onChange={value=>setSetting('concierge',value)} Icon={Bot}/><ReservationToggle label="WhatsApp confirmation" note="Sent by the client’s connected account" checked={settings.whatsappConfirmation} onChange={value=>setSetting('whatsappConfirmation',value)} Icon={Check}/></>}<ReservationField label="Host test PIN" note="Four digits for the future host rehearsal"><input inputMode="numeric" maxLength="4" value={settings.hostPin} onChange={event=>setSetting('hostPin',event.target.value.replace(/\D/g,'').slice(0,4))}/></ReservationField></div><button type="button" className="rv-rules-save" onClick={onSave}><Save size={16}/>Save booking rules</button></section>;
}

function AgencyGuestBooking({data,onNotice}){
  const settings=data.settings;
  const now=useMemo(()=>new Date(),[]);
  const earliest=useMemo(()=>new Date(now.getTime()+settings.minNoticeMinutes*60000),[now,settings.minNoticeMinutes]);
  const maximum=useMemo(()=>{const date=new Date(now);date.setDate(date.getDate()+settings.advanceDays);date.setHours(23,59,59,999);return date;},[now,settings.advanceDays]);
  const allSlots=useMemo(()=>slotValues(settings.open,settings.close,settings.slotMinutes),[settings.open,settings.close,settings.slotMinutes]);
  const firstBookable=useMemo(()=>{for(let day=0;day<=settings.advanceDays;day+=1){const date=new Date(now);date.setDate(date.getDate()+day);const valid=allSlots.some(slot=>new Date(`${localDateValue(date)}T${slot}:00`)>=earliest);if(valid)return localDateValue(date);}return localDateValue(earliest);},[allSlots,earliest,now,settings.advanceDays]);
  const [date,setDate]=useState(firstBookable);
  const [time,setTime]=useState('');
  const [party,setParty]=useState(Math.min(2,settings.maxParty));
  const availableSlots=useMemo(()=>allSlots.filter(slot=>{const candidate=new Date(`${date}T${slot}:00`);return candidate>=earliest&&candidate<=maximum;}),[allSlots,date,earliest,maximum]);
  useEffect(()=>{if(date<firstBookable||date>localDateValue(maximum))setDate(firstBookable);},[date,firstBookable,maximum]);
  useEffect(()=>{if(!availableSlots.includes(time))setTime(availableSlots[0]||'');},[availableSlots,time]);
  useEffect(()=>{if(party>settings.maxParty)setParty(settings.maxParty);},[party,settings.maxParty]);
  const valid=settings.enabled&&Boolean(time)&&party>=1&&party<=settings.maxParty;
  return <div className="rv-advance-booking"><div className="rv-booking-brand"><span><img src="/logo-transparent.png" width="24" height="24" alt=""/>Marina Social Club</span><em>Guest preview</em></div><div className="rv-booking-window"><CalendarClock size={20}/><span><small>Available booking window</small><strong>{formatNotice(settings.minNoticeMinutes)} notice · up to {settings.advanceDays} days ahead</strong></span></div><div className="rv-booking-grid"><ReservationField label="Choose a date"><input type="date" value={date} min={firstBookable} max={localDateValue(maximum)} onChange={event=>setDate(event.target.value)}/></ReservationField><div className="rv-party-field"><span>Guests</span><div><button type="button" aria-label="Remove one guest" disabled={party<=1} onClick={()=>setParty(value=>Math.max(1,value-1))}><Minus size={16}/></button><strong>{party}</strong><button type="button" aria-label="Add one guest" disabled={party>=settings.maxParty} onClick={()=>setParty(value=>Math.min(settings.maxParty,value+1))}><Plus size={16}/></button></div><small>Online maximum: {settings.maxParty}</small></div></div><fieldset className="rv-time-slots"><legend><Clock3 size={16}/>Available times</legend>{availableSlots.length?<div>{availableSlots.map(slot=><button type="button" key={slot} aria-pressed={time===slot} onClick={()=>setTime(slot)}>{new Date(`2000-01-01T${slot}:00`).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</button>)}</div>:<p role="alert">No valid times on this date. Choose another date within the booking window.</p>}</fieldset><div className="rv-booking-summary"><UsersRound size={18}/><span><small>Preview selection</small><strong>{party} {party===1?'guest':'guests'} · {date}{time?` at ${time}`:''}</strong></span></div><button type="button" className="rv-preview-book" disabled={!valid} onClick={()=>onNotice(`${party}-guest booking selected for ${date} at ${time}. No booking was sent.`)}>{settings.enabled?'Continue with this time':'Bookings are paused'}</button><small className="rv-preview-safe">Preview only. No table is held and no guest is contacted.</small></div>;
}

function AgencyFloorSetup({ data, setData, onNotice, onHostTest, live = null }) {
  const [activeSpaceId, setActiveSpaceId] = useState(data.spaces[0]?.id || '');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [spaceOpen, setSpaceOpen] = useState(false);
  const activeSpace = data.spaces.find(space => space.id === activeSpaceId) || data.spaces[0];
  const tables = data.tables.filter(table => table.spaceId === activeSpace?.id);
  const selectedTable = tables.find(table => table.id === selectedTableId);

  useEffect(() => {
    if (!data.spaces.some(space => space.id === activeSpaceId)) setActiveSpaceId(data.spaces[0]?.id || '');
  }, [data.spaces, activeSpaceId]);

  function addTable() {
    if (!activeSpace) return;
    if (live) {
      // The database mints the table id, so the reload brings the new table
      // back rather than a placeholder appearing in the layout first.
      live.addTable?.(activeSpace.id);
      onNotice('Table added to the layout.');
      return;
    }
    const now = Date.now();
    setData(current => addReservationTable(current, activeSpace.id, now));
    setSelectedTableId(`table-${now}`);
    onNotice('Table added to the layout.');
  }

  function addSpace(input) {
    if (live) {
      live.addSpace?.(input);
      setSpaceOpen(false);
      onNotice(`${input.name} added to the venue layout.`);
      return;
    }
    const now = Date.now();
    setData(current => addReservationSpace(current, input, now));
    setActiveSpaceId(`space-${now}`);
    setSelectedTableId('');
    setSpaceOpen(false);
    onNotice(`${input.name} added to the venue layout.`);
  }

  function updateTable(patch, persist = true) {
    if (!selectedTable) return;
    setData(current => updateReservationTable(current, selectedTable.id, patch));
    if (live && persist) live.updateTable?.(selectedTable.id, patch);
  }

  return <section className="rv-agency-floor">
    <header>
      <div><span>Venue layout</span><h2>Design the room once.</h2><p>This is the agency layout editor. Live reservations and seating never appear here.</p></div>
      <div><button type="button" onClick={() => setSpaceOpen(true)}><Plus size={16} />Add space</button><button type="button" onClick={addTable}><Plus size={16} />Add table</button><button type="button" className="rv-floor-test" onClick={onHostTest}><ShieldCheck size={16} />Host Test</button></div>
    </header>
    <nav className="rv-spaces" aria-label="Venue spaces">{data.spaces.map(space => <button type="button" key={space.id} aria-pressed={activeSpace?.id === space.id} onClick={() => { setActiveSpaceId(space.id); setSelectedTableId(''); }}><SpaceIcon type={space.type} /><span><strong>{space.name}</strong><small>{[live ? '' : space.type === 'outdoor' ? 'Outdoor' : space.type === 'floor' ? 'Separate floor' : 'Indoor', `${data.tables.filter(table => table.spaceId === space.id).length} tables`].filter(Boolean).join(' · ')}</small></span></button>)}</nav>
    <div className="rv-agency-floor-grid">
      <div className="rv-layout-wrap"><div className="rv-water">{!live && <span>{activeSpace?.type === 'outdoor' ? 'Open-air edge' : activeSpace?.type === 'floor' ? 'Upper level' : 'Dining room'}</span>}</div><div className="rv-floor-plan rv-floor-canvas" data-editing="true">{!tables.length && <p className="rv-floor-empty">Add a table to begin this space.</p>}{tables.map(table => <button type="button" key={table.id} className="rv-table rv-table-map" data-shape={table.shape} data-state={table.outOfService ? 'out' : 'free'} aria-pressed={selectedTableId === table.id} aria-label={`${table.name}, ${table.seats} chairs`} style={{ left: `${table.x}%`, top: `${table.y}%`, width: `${table.width}px`, height: `${table.depth}px` }} onClick={() => setSelectedTableId(table.id)}><TableChairs count={table.seats} /><span>{table.name}</span><small>{table.seats} chairs</small><Edit3 size={13} /></button>)}</div></div>
      <aside>{selectedTable ? <><span>Edit table</span><h3>{selectedTable.name}</h3><label>Table name<input value={selectedTable.name} onChange={event => updateTable({ name: event.target.value }, false)} onBlur={event => { if (live) live.updateTable?.(selectedTable.id, { name: event.target.value }); }} /></label><label>Number of chairs<select value={selectedTable.seats} onChange={event => updateTable({ seats: Number(event.target.value) })}>{Array.from({ length: 20 }, (_, index) => <option value={index + 1} key={index + 1}>{index + 1}</option>)}</select></label><label>Table shape<select value={selectedTable.shape} onChange={event => { const shape = event.target.value; updateTable({ shape, width: shape === 'long' ? 132 : 82, depth: shape === 'long' ? 72 : 82 }); }}><option value="square">Square</option><option value="round">Round</option><option value="long">Long</option></select></label>{!live && <button type="button" className="rv-oos" aria-pressed={selectedTable.outOfService} onClick={() => updateTable({ outOfService: !selectedTable.outOfService })}><span><strong>{selectedTable.outOfService ? 'Unavailable' : 'Available'}</strong><small>Repairs, private use, or temporary closure</small></span><i><b /></i></button>}</> : <div className="rv-layout-help"><Table2 size={24} /><strong>Choose a table</strong><p>Edit its name, chairs, shape, or availability.</p></div>}<div className="rv-floor-handoff"><ShieldCheck size={18} /><span><strong>Host handoff</strong><small>This same plan will power daily seating later.</small></span></div></aside>
    </div>
    {spaceOpen && <SpaceModal onClose={() => setSpaceOpen(false)} onAdd={addSpace} />}
  </section>;
}

export default function ReservationsAgencyExperience({
  dark = false,
  setDark = () => {},
  onOpenHostTest = () => {},
  liveSpaces = null,
  liveTables = null,
  liveSettings = null,
  clientName = '',
  shareUrl = '',
  errorMessage = '',
  onSaveSettings = null,
  onAddSpace = null,
  onUpdateSpace = null,
  onRemoveSpace = null,
  onAddTable = null,
  onUpdateTable = null,
  onRemoveTable = null
}) {
  // `live` is the single switch between the isolated design preview (browser
  // storage, sample venue) and real records handed down by the page wrapper.
  const live = Array.isArray(liveTables) && Array.isArray(liveSpaces);
  const initial = useMemo(() => live ? { data: null, error: '' } : readReservationPreview(), [live]);
  const venueName = clientName || 'Marina Social Club';
  const liveData = useMemo(() => live ? { settings: liveSettings || {}, spaces: liveSpaces || [], tables: liveTables || [], bookings: [] } : null, [live, liveSettings, liveSpaces, liveTables]);
  const [data, setData] = useState(() => liveData || initial.data);
  const [tab, setTab] = useState('settings');
  const [shareOpen, setShareOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(initial.error);

  // Layout edits stay optimistic locally; refreshed records from the wrapper win.
  useEffect(() => {
    if (liveData) setData(liveData);
  }, [liveData]);

  const liveActions = live ? {
    addSpace: onAddSpace,
    updateSpace: onUpdateSpace,
    removeSpace: onRemoveSpace,
    addTable: onAddTable,
    updateTable: onUpdateTable,
    removeTable: onRemoveTable
  } : null;

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  function save() {
    if (live) {
      onSaveSettings?.(data.settings);
      setNotice('Booking rules saved.');
      return;
    }
    const result = saveReservationPreview(data);
    if (result.ok) {
      setData(result.data);
      setStorageError('');
      setNotice('Reservation setup saved in this browser.');
    } else setStorageError(result.error);
  }

  const setupFacts = [
    ...(live ? [] : [{ label: 'Booking status', value: data.settings.enabled ? 'Open' : 'Paused' }]),
    { label: 'Venue spaces', value: data.spaces.length },
    { label: 'Mapped tables', value: data.tables.length },
    ...(live ? [] : [{ label: 'Largest online party', value: data.settings.maxParty }]),
  ];
  // The guest preview is driven entirely by notice, book-ahead and party-size
  // rules that no column stores, so it stays out of the live workspace.
  const setupTabs = live ? SETUP_TABS.filter(([key]) => key !== 'guest') : SETUP_TABS;
  const shownError = errorMessage || storageError;

  return <main className="tw-reservations rv-agency-setup" data-reservation-theme={dark ? 'dark' : 'light'}>
    <div className="rv-preview-line"><span>Reservation setup · Agency workspace · No live arrivals appear here</span><div className="rv-preview-actions"><button type="button" className="tw-host-test-launch" onClick={onOpenHostTest}><ShieldCheck size={16} />Host Test</button><button type="button" onClick={() => setDark(!dark)} aria-label={dark ? 'Use light Reservations theme' : 'Use dark Reservations theme'}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button></div></div>
    <header className="rv-heading"><div><span><img src="/logo-transparent.png" width="22" height="22" alt="" />{venueName} / Booking setup</span><h1>Bookings, ready before guests arrive.</h1><p>Set availability, venue layout, confirmations, and the guest booking journey. The client’s host team runs daily service later.</p></div><nav>{(!live || shareUrl) && <button type="button" onClick={() => setShareOpen(value => !value)}><Link2 size={17} />Link and QR</button>}{!live && <button type="button" onClick={() => setTab('guest')}><Eye size={17} />Preview booking</button>}<button type="button" className="rv-save" onClick={save}><Save size={17} />Save setup</button></nav></header>
    {shareOpen && <ReservationShare onClose={() => setShareOpen(false)} url={shareUrl} venueName={venueName} />}{shownError && <p className="rv-error" role="alert">{shownError}</p>}<div className="rv-toast" role="status">{notice}</div>
    <section className="rv-agency-boundary"><ShieldCheck size={20} /><div><strong>The agency prepares the booking system.</strong><span>Confirmations, arrivals, walk-ins, waitlists, seating, and table clearing belong to the future Host dashboard.</span></div><button type="button" onClick={onOpenHostTest}>Test the host flow<ChevronRight size={16} /></button></section>
    <section className="rv-setup-facts">{setupFacts.map(item => <article key={item.label}><small>{item.label}</small><strong>{item.value}</strong></article>)}</section>
    <nav className="rv-tabs" aria-label="Reservation setup sections">{setupTabs.map(([key, Icon, label]) => <button type="button" key={key} aria-pressed={tab === key} onClick={() => setTab(key)}><Icon size={17} />{label}</button>)}</nav>
    {tab === 'settings' && <AgencyReservationSettings data={data} setData={setData} onSave={save} live={live} />}
    {tab === 'floor' && <AgencyFloorSetup data={data} setData={setData} onNotice={setNotice} onHostTest={onOpenHostTest} live={liveActions} />}
    {tab === 'guest' && !live && <section className="rv-guest-preview-wrap"><header><span>Guest experience preview</span><strong>Safe preview—no guest is contacted.</strong></header><AgencyGuestBooking data={data} onNotice={message => setNotice(`Preview: ${message}`)} /></section>}
    <section className="rv-concierge"><Bot size={24} /><div><span>Connected guest support</span><h2>The Concierge follows the same booking rules.</h2><p>It can answer availability questions and collect requests, while anything operational is handed to the host.</p></div><a href="?page=concierge&occasions=editorial">Open AI Concierge<ArrowRight size={16} /></a></section>
    <footer className="rv-foot"><span><MapPin size={14} />Client venue and regional settings</span><span><Globe2 size={14} />Guest link works across supported markets</span><span><ShieldCheck size={14} />Host operations stay outside the agency workspace</span></footer>
  </main>;
}

