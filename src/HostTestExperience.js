import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight, BadgeCheck, BookOpenCheck, CalendarCheck2, Check, CheckCircle2,
  Clock3, Eye, Gift, History, PackageCheck, RefreshCw, RotateCcw, Search,
  ShieldCheck, ShoppingBag, Store, UsersRound, X,
} from 'lucide-react';
import './host-test-experience.css';

const MODULES = [
  { id: 'menu', label: 'Menu & catalog', note: 'Availability', Icon: BookOpenCheck },
  { id: 'orders', label: 'Pickup orders', note: 'Handoff', Icon: ShoppingBag },
  { id: 'reservations', label: 'Reservations', note: 'Arrival', Icon: CalendarCheck2 },
  { id: 'loyalty', label: 'Loyalty', note: 'Earn & redeem', Icon: BadgeCheck },
];

const MODULE_COPY = {
  menu: {
    eyebrow: 'Availability rehearsal',
    title: 'See what the customer sees.',
    copy: 'Pause an item, bring it back, and confirm the public catalog changes instantly.',
  },
  orders: {
    eyebrow: 'Handoff rehearsal',
    title: 'Move an order from new to collected.',
    copy: 'Test the operator’s next action at every stage without charging or contacting anyone.',
  },
  reservations: {
    eyebrow: 'Arrival rehearsal',
    title: 'Run the front-desk flow.',
    copy: 'Confirm an arrival, seat the party, complete the visit, or test an exception safely.',
  },
  loyalty: {
    eyebrow: 'Reward rehearsal',
    title: 'Test earning and redemption.',
    copy: 'Find a sample member, record a qualifying action, and confirm the reward state.',
  },
};

const INITIAL_MENU = [
  { id: 'm1', name: 'Sunday lunch set', detail: 'Seasonal · BHD 12.000', available: true },
  { id: 'm2', name: 'Sharing plate', detail: 'All day · BHD 8.500', available: true },
  { id: 'm3', name: 'House iced tea', detail: 'Drinks · BHD 2.800', available: false },
  { id: 'm4', name: 'Date cake', detail: 'Dessert · BHD 4.200', available: true },
];

const INITIAL_ORDERS = [
  { id: '#1048', guest: 'Maya Noor', detail: '2 items · Pickup at 12:45', status: 'new' },
  { id: '#1047', guest: 'Omar Kareem', detail: '3 items · Pickup at 12:35', status: 'preparing' },
  { id: '#1046', guest: 'Sara Hassan', detail: '1 item · Counter pickup', status: 'ready' },
];

const ORDER_STEPS = ['new', 'accepted', 'preparing', 'ready', 'collected'];
const ORDER_LABELS = { new: 'New', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready', collected: 'Collected' };

const INITIAL_RESERVATIONS = [
  { id: 'r1', guest: 'Maya Noor', detail: '4 guests · 7:30 PM', table: 'Terrace 4', status: 'pending' },
  { id: 'r2', guest: 'Omar Kareem', detail: '2 guests · 8:00 PM', table: 'Window 2', status: 'confirmed' },
  { id: 'r3', guest: 'Sara Hassan', detail: '5 guests · 8:15 PM', table: 'Main 7', status: 'seated' },
];

const RESERVATION_LABELS = { pending: 'Needs confirmation', confirmed: 'Confirmed', seated: 'Seated', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' };

const INITIAL_MEMBERS = [
  { id: 'l1', name: 'Maya Noor', detail: 'Card · MSC-1048', visits: 7, goal: 8, redeemed: 1 },
  { id: 'l2', name: 'Omar Kareem', detail: 'Card · MSC-0931', visits: 8, goal: 8, redeemed: 0 },
  { id: 'l3', name: 'Sara Hassan', detail: 'Card · MSC-0874', visits: 4, goal: 8, redeemed: 2 },
];

function StatusPill({ children, tone = 'neutral' }) {
  return <span className="ht-status" data-tone={tone}>{children}</span>;
}

function EmptyPulse() {
  return <div className="ht-empty-pulse"><History size={22} aria-hidden="true" /><strong>No test actions yet</strong><span>Use a control and the result will appear here.</span></div>;
}

function MenuTest({ items, onToggle }) {
  const visible = items.filter(item => item.available);
  return <div className="ht-work-grid ht-menu-grid">
    <section className="ht-panel ht-list-panel">
      <header><div><span>Operator controls</span><h2>Item availability</h2></div><StatusPill tone="safe">Sample data</StatusPill></header>
      <div className="ht-item-list">{items.map(item => <article key={item.id}>
        <div><strong>{item.name}</strong><span>{item.detail}</span></div>
        <button type="button" className="ht-switch" aria-pressed={item.available} aria-label={`${item.available ? 'Pause' : 'Make available'} ${item.name}`} onClick={() => onToggle(item.id)}><i /><span>{item.available ? 'Available' : 'Paused'}</span></button>
      </article>)}</div>
    </section>
    <aside className="ht-panel ht-customer-preview" aria-label="Customer catalog preview">
      <header><div><span>Customer preview</span><h2>Marina Social Club</h2></div><Eye size={18} aria-hidden="true" /></header>
      <div className="ht-preview-cover"><span>Seasonal selection</span><strong>Ready when<br />you are.</strong></div>
      <div className="ht-preview-list">{visible.map(item => <div key={item.id}><span><strong>{item.name}</strong><small>{item.detail.split(' · ')[0]}</small></span><b>{item.detail.split(' · ')[1]}</b></div>)}</div>
      <footer>{visible.length} of {items.length} items visible</footer>
    </aside>
  </div>;
}

function OrdersTest({ orders, selectedId, onSelect, onAdvance }) {
  const selected = orders.find(order => order.id === selectedId) || orders[0];
  const step = ORDER_STEPS.indexOf(selected.status);
  const next = ORDER_STEPS[Math.min(step + 1, ORDER_STEPS.length - 1)];
  return <div className="ht-work-grid">
    <section className="ht-panel ht-list-panel">
      <header><div><span>Sample queue</span><h2>Pickup orders</h2></div><StatusPill tone="safe">No payment</StatusPill></header>
      <div className="ht-select-list">{orders.map(order => <button type="button" key={order.id} aria-pressed={order.id === selected.id} onClick={() => onSelect(order.id)}><span className="ht-order-mark"><ShoppingBag size={17} aria-hidden="true" /></span><span><strong>{order.id} · {order.guest}</strong><small>{order.detail}</small></span><StatusPill tone={order.status === 'ready' ? 'attention' : order.status === 'collected' ? 'safe' : 'neutral'}>{ORDER_LABELS[order.status]}</StatusPill></button>)}</div>
    </section>
    <section className="ht-panel ht-detail-panel">
      <header><div><span>Selected order</span><h2>{selected.id}</h2></div><StatusPill tone={selected.status === 'ready' ? 'attention' : 'neutral'}>{ORDER_LABELS[selected.status]}</StatusPill></header>
      <div className="ht-person"><i>{selected.guest.split(' ').map(part => part[0]).join('')}</i><span><strong>{selected.guest}</strong><small>{selected.detail}</small></span></div>
      <ol className="ht-stepper">{ORDER_STEPS.map((status, index) => <li key={status} data-complete={index <= step}><i>{index < step ? <Check size={13} aria-hidden="true" /> : index + 1}</i><span>{ORDER_LABELS[status]}</span></li>)}</ol>
      <div className="ht-order-items"><span><b>1×</b> Sunday lunch set</span><span><b>1×</b> House iced tea</span></div>
      <button type="button" className="ht-primary-action" disabled={selected.status === 'collected'} onClick={() => onAdvance(selected.id)}>{selected.status === 'collected' ? <><PackageCheck size={18} aria-hidden="true" />Order collected</> : <>Move to {ORDER_LABELS[next]}<ArrowRight size={17} aria-hidden="true" /></>}</button>
    </section>
  </div>;
}

function ReservationsTest({ reservations, selectedId, onSelect, onStatus }) {
  const selected = reservations.find(item => item.id === selectedId) || reservations[0];
  const active = !['completed', 'cancelled', 'no_show'].includes(selected.status);
  return <div className="ht-work-grid">
    <section className="ht-panel ht-list-panel">
      <header><div><span>Sample arrivals</span><h2>Tonight</h2></div><StatusPill tone="safe">No messages sent</StatusPill></header>
      <div className="ht-select-list">{reservations.map(item => <button type="button" key={item.id} aria-pressed={item.id === selected.id} onClick={() => onSelect(item.id)}><span className="ht-time"><Clock3 size={15} aria-hidden="true" />{item.detail.split(' · ')[1]}</span><span><strong>{item.guest}</strong><small>{item.detail.split(' · ')[0]} · {item.table}</small></span><StatusPill tone={item.status === 'pending' ? 'attention' : item.status === 'seated' || item.status === 'completed' ? 'safe' : 'neutral'}>{RESERVATION_LABELS[item.status]}</StatusPill></button>)}</div>
    </section>
    <section className="ht-panel ht-detail-panel">
      <header><div><span>Arrival card</span><h2>{selected.guest}</h2></div><StatusPill tone={selected.status === 'pending' ? 'attention' : 'safe'}>{RESERVATION_LABELS[selected.status]}</StatusPill></header>
      <div className="ht-reservation-facts"><div><span>Party</span><strong>{selected.detail.split(' · ')[0]}</strong></div><div><span>Time</span><strong>{selected.detail.split(' · ')[1]}</strong></div><div><span>Assigned</span><strong>{selected.table}</strong></div></div>
      <div className="ht-flow-actions">
        {selected.status === 'pending' && <button type="button" className="ht-primary-action" onClick={() => onStatus(selected.id, 'confirmed')}><CheckCircle2 size={17} aria-hidden="true" />Confirm reservation</button>}
        {selected.status === 'confirmed' && <button type="button" className="ht-primary-action" onClick={() => onStatus(selected.id, 'seated')}><UsersRound size={17} aria-hidden="true" />Seat party</button>}
        {selected.status === 'seated' && <button type="button" className="ht-primary-action" onClick={() => onStatus(selected.id, 'completed')}><Check size={17} aria-hidden="true" />Complete visit</button>}
        {active && <button type="button" className="ht-quiet-action" onClick={() => onStatus(selected.id, 'no_show')}>Mark no-show</button>}
        {!active && <p className="ht-complete-note"><CheckCircle2 size={18} aria-hidden="true" />This sample arrival is closed.</p>}
      </div>
    </section>
  </div>;
}

function LoyaltyTest({ members, selectedId, onSelect, onVisit, onRedeem }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => members.filter(member => `${member.name} ${member.detail}`.toLowerCase().includes(query.toLowerCase())), [members, query]);
  const selected = members.find(member => member.id === selectedId) || members[0];
  const ready = selected.visits >= selected.goal;
  return <div className="ht-work-grid">
    <section className="ht-panel ht-list-panel">
      <header><div><span>Sample members</span><h2>Find a customer</h2></div><StatusPill tone="safe">No camera access</StatusPill></header>
      <label className="ht-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search sample members</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name or card code" /></label>
      <div className="ht-select-list">{filtered.map(member => <button type="button" key={member.id} aria-pressed={member.id === selected.id} onClick={() => onSelect(member.id)}><span className="ht-avatar">{member.name.split(' ').map(part => part[0]).join('')}</span><span><strong>{member.name}</strong><small>{member.detail}</small></span><StatusPill tone={member.visits >= member.goal ? 'attention' : 'neutral'}>{member.visits}/{member.goal}</StatusPill></button>)}</div>
    </section>
    <section className="ht-panel ht-loyalty-card">
      <header><div><span>Customer found</span><h2>{selected.name}</h2></div><BadgeCheck size={19} aria-hidden="true" /></header>
      <div className="ht-card-preview"><div><span>MARINA</span><small>SOCIAL CLUB</small></div><StatusPill tone={ready ? 'attention' : 'safe'}>{ready ? 'Reward ready' : 'Return club'}</StatusPill><strong>{ready ? 'A reward is ready.' : 'One good visit leads to the next.'}</strong><div className="ht-stamps">{Array.from({ length: selected.goal }, (_, index) => <i key={index} data-filled={index < selected.visits}><Gift size={15} aria-hidden="true" /></i>)}</div><footer><span>{selected.visits} of {selected.goal}</span><span>{selected.redeemed} redeemed</span></footer></div>
      <div className="ht-flow-actions"><button type="button" className="ht-primary-action" disabled={ready} onClick={() => onVisit(selected.id)}><CheckCircle2 size={17} aria-hidden="true" />{ready ? 'Goal reached' : 'Record qualifying action'}</button><button type="button" className="ht-quiet-action" disabled={!ready} onClick={() => onRedeem(selected.id)}><Gift size={17} aria-hidden="true" />Redeem reward</button></div>
    </section>
  </div>;
}

export default function HostTestExperience({ initialModule = 'menu', onExit = () => {} }) {
  const [module, setModule] = useState(MODULES.some(item => item.id === initialModule) ? initialModule : 'menu');
  const [menuItems, setMenuItems] = useState(INITIAL_MENU);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(INITIAL_ORDERS[0].id);
  const [reservations, setReservations] = useState(INITIAL_RESERVATIONS);
  const [selectedReservation, setSelectedReservation] = useState(INITIAL_RESERVATIONS[0].id);
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [selectedMember, setSelectedMember] = useState(INITIAL_MEMBERS[0].id);
  const [events, setEvents] = useState([]);
  const [announcement, setAnnouncement] = useState('Host Test opened with sample data.');
  const dialogRef = useRef(null);
  const exitRef = useRef(null);
  const copy = MODULE_COPY[module];

  const log = (title, detail) => {
    const entry = { id: `${Date.now()}-${Math.random()}`, title, detail, time: 'Just now' };
    setEvents(current => [entry, ...current].slice(0, 6));
    setAnnouncement(`${title}. ${detail}`);
  };

  const reset = () => {
    setMenuItems(INITIAL_MENU);
    setOrders(INITIAL_ORDERS);
    setSelectedOrder(INITIAL_ORDERS[0].id);
    setReservations(INITIAL_RESERVATIONS);
    setSelectedReservation(INITIAL_RESERVATIONS[0].id);
    setMembers(INITIAL_MEMBERS);
    setSelectedMember(INITIAL_MEMBERS[0].id);
    setEvents([]);
    setAnnouncement('All sample data was reset.');
  };

  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => exitRef.current?.focus());
    const onKeyDown = event => {
      if (event.key === 'Escape') { onExit(); return; }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), [href], select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') || []);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previous && document.contains(previous)) previous.focus();
    };
  }, [onExit]);

  const toggleItem = id => {
    const item = menuItems.find(entry => entry.id === id);
    if (!item) return;
    setMenuItems(current => current.map(entry => entry.id === id ? { ...entry, available: !entry.available } : entry));
    log(item.available ? 'Item paused' : 'Item restored', `${item.name} is now ${item.available ? 'hidden from' : 'visible in'} the customer preview.`);
  };

  const advanceOrder = id => {
    const order = orders.find(entry => entry.id === id);
    if (!order) return;
    const index = ORDER_STEPS.indexOf(order.status);
    const next = ORDER_STEPS[Math.min(index + 1, ORDER_STEPS.length - 1)];
    setOrders(current => current.map(entry => entry.id === id ? { ...entry, status: next } : entry));
    log(`Order ${ORDER_LABELS[next].toLowerCase()}`, `${order.id} for ${order.guest} moved to ${ORDER_LABELS[next]}.`);
  };

  const changeReservation = (id, status) => {
    const booking = reservations.find(entry => entry.id === id);
    if (!booking) return;
    setReservations(current => current.map(entry => entry.id === id ? { ...entry, status } : entry));
    log('Arrival updated', `${booking.guest} is now marked ${RESERVATION_LABELS[status].toLowerCase()}.`);
  };

  const recordVisit = id => {
    const member = members.find(entry => entry.id === id);
    if (!member || member.visits >= member.goal) return;
    const visits = member.visits + 1;
    setMembers(current => current.map(entry => entry.id === id ? { ...entry, visits } : entry));
    log('Qualifying action recorded', `${member.name} now has ${visits} of ${member.goal}.`);
  };

  const redeem = id => {
    const member = members.find(entry => entry.id === id);
    if (!member || member.visits < member.goal) return;
    setMembers(current => current.map(entry => entry.id === id ? { ...entry, visits: 0, redeemed: entry.redeemed + 1 } : entry));
    log('Reward redeemed', `${member.name} starts a new reward journey at 0 of ${member.goal}.`);
  };

  const content = <div className="ht-layer">
    <section ref={dialogRef} className="ht-shell" role="dialog" aria-modal="true" aria-labelledby="ht-title" aria-describedby="ht-description">
      <header className="ht-topbar">
        <div className="ht-brand"><img src="/logo-transparent.png" width="32" height="32" alt="" /><span><strong>Tawaslo Host Test</strong><small>Agency rehearsal workspace</small></span></div>
        <div className="ht-venue"><Store size={16} aria-hidden="true" /><span><small>Testing for</small><strong>Marina Social Club</strong></span><StatusPill tone="locked"><ShieldCheck size={13} aria-hidden="true" />Not live</StatusPill></div>
        <div className="ht-top-actions"><button type="button" onClick={reset}><RotateCcw size={16} aria-hidden="true" />Reset sample data</button><button ref={exitRef} type="button" className="ht-exit" onClick={onExit}><X size={17} aria-hidden="true" />Exit test</button></div>
      </header>
      <div className="ht-safe-strip"><ShieldCheck size={16} aria-hidden="true" /><strong>Safe rehearsal:</strong><span>nothing here changes the client workspace, contacts customers, or takes payment.</span></div>
      <div className="ht-layout">
        <aside className="ht-sidebar">
          <div><span>Host tools</span><h2>Test one flow at a time.</h2><p>These are operator rehearsals. Social publishing stays in the agency workspace.</p></div>
          <nav aria-label="Host test tools">{MODULES.map(({ id, label, note, Icon }) => <button type="button" key={id} aria-pressed={module === id} onClick={() => { setModule(id); setAnnouncement(`${label} test opened.`); }}><Icon size={18} aria-hidden="true" /><span><strong>{label}</strong><small>{note}</small></span><ArrowRight size={15} aria-hidden="true" /></button>)}</nav>
          <footer><span>Later</span><p>The real host dashboard will be a separate, single-business workspace with its own login, roles, billing, and data security.</p></footer>
        </aside>
        <main className="ht-main">
          <header className="ht-heading"><div><span>{copy.eyebrow}</span><h1 id="ht-title">{copy.title}</h1><p id="ht-description">{copy.copy}</p></div><div className="ht-session"><i /><span><strong>Test session active</strong><small>Sample data only</small></span></div></header>
          {module === 'menu' && <MenuTest items={menuItems} onToggle={toggleItem} />}
          {module === 'orders' && <OrdersTest orders={orders} selectedId={selectedOrder} onSelect={setSelectedOrder} onAdvance={advanceOrder} />}
          {module === 'reservations' && <ReservationsTest reservations={reservations} selectedId={selectedReservation} onSelect={setSelectedReservation} onStatus={changeReservation} />}
          {module === 'loyalty' && <LoyaltyTest members={members} selectedId={selectedMember} onSelect={setSelectedMember} onVisit={recordVisit} onRedeem={redeem} />}
        </main>
        <aside className="ht-pulse" aria-label="Test activity">
          <header><span><RefreshCw size={15} aria-hidden="true" />Test activity</span><small>{events.length} {events.length === 1 ? 'action' : 'actions'}</small></header>
          <div>{events.length ? events.map(event => <article key={event.id}><i /><span><strong>{event.title}</strong><small>{event.detail}</small><time>{event.time}</time></span></article>) : <EmptyPulse />}</div>
          <footer><CheckCircle2 size={16} aria-hidden="true" /><span><strong>Ready to hand off?</strong><small>Reset the sample data and test each flow once more.</small></span></footer>
        </aside>
      </div>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    </section>
  </div>;

  return typeof document === 'undefined' ? null : createPortal(content, document.body);
}
