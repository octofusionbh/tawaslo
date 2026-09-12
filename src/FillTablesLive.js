import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import FillTablesExperience from './FillTablesExperience';

const TONES = ['coral', 'mint', 'lilac', 'gold', 'blue', 'rose'];
const text = value => (typeof value === 'string' ? value : '');

function clockLabel(value) {
  const parts = text(value).split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return '';
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function minutesLabel(total) {
  const wrapped = ((total % 1440) + 1440) % 1440;
  return clockLabel(`${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`);
}

// The offer window the owner configured in booking_settings.hours.offer_cfg — the only "when" this
// workspace stores. Nothing is shown when today is not one of its days.
function toSlot(cfg, closeTime) {
  const days = Array.isArray(cfg.days) ? cfg.days : null;
  if (days && !days.includes(new Date().getDay())) return null;
  let start = '';
  let end = '';
  if (cfg.mode === 'custom') { start = clockLabel(cfg.start); end = clockLabel(cfg.end); }
  else {
    const parts = text(closeTime).split(':');
    const closeMinutes = Number(parts[0]) * 60 + Number(parts[1]);
    if (!Number.isFinite(closeMinutes)) return null;
    start = minutesLabel(closeMinutes - (Number(cfg.hours) || 2) * 60);
    end = clockLabel(closeTime);
  }
  if (!start || !end) return null;
  return { id: 'window', label: 'Tonight', time: `${start}–${end}`, note: '', endLabel: end };
}

function toOffer(cfg) {
  if (cfg.perkType === 'percent' && cfg.perkValue != null && cfg.perkValue !== '') {
    return { id: 'perk', label: `${cfg.perkValue}% off`, short: `enjoy ${cfg.perkValue}% off the bill` };
  }
  if (cfg.perkType === 'amount' && cfg.perkValue != null && cfg.perkValue !== '') {
    return { id: 'perk', label: `${cfg.perkValue} off`, short: `take ${cfg.perkValue} off the bill` };
  }
  const label = text(cfg.text).trim();
  return label ? { id: 'perk', label, short: label } : null;
}

function toGuest(row, index) {
  const name = text(row.name).trim() || 'Guest';
  const parts = name.split(/\s+/);
  const visits = Number(row.visits) || 0;
  return {
    id: row.id,
    name,
    firstName: parts[0],
    initials: `${parts[0][0] || 'G'}${parts[1] ? parts[1][0] : ''}`.toUpperCase(),
    // Only the visit count is recorded; the fixture's habits and proximity signals have no column.
    note: `${visits} ${visits === 1 ? 'visit' : 'visits'}`,
    signal: '',
    tone: TONES[index % TONES.length],
    phone: text(row.phone).trim(),
  };
}

export default function FillTablesLive({ client, dark = false, onOpenGuests = () => {} }) {
  const [state, setState] = useState({ status: 'loading', guests: [], floor: null, slots: [], offers: [], error: '' });
  const openedRef = useRef(new Set());
  const clientId = client?.id || '';
  const clientName = client?.name || '';

  useEffect(() => {
    let active = true;
    openedRef.current = new Set();
    if (!clientId && !clientName) { setState({ status: 'empty', guests: [], floor: null, slots: [], offers: [], error: '' }); return undefined; }
    setState({ status: 'loading', guests: [], floor: null, slots: [], offers: [], error: '' });
    (async () => {
      try {
        let id = clientId;
        if (!id) {
          const { data, error } = await supabase.from('clients').select('id').eq('name', clientName).limit(1);
          if (error) throw error;
          id = data && data[0] && data[0].id;
        }
        if (!id) throw new Error('This client is not in the workspace yet.');

        const { data: tables } = await supabase.from('dining_tables').select('seats,out_of_service').eq('client_id', id);
        const from = new Date(); from.setHours(0, 0, 0, 0);
        const to = new Date(); to.setHours(23, 59, 59, 999);
        const { data: bookings } = await supabase.from('bookings').select('party_size,status,starts_at').eq('client_id', id).gte('starts_at', from.toISOString()).lte('starts_at', to.toISOString());
        const { data: guestRows } = await supabase.from('guests').select('id,name,phone,visits').eq('client_id', id).eq('marketing_optin', true);
        const { data: settings } = await supabase.from('booking_settings').select('hours').eq('client_id', id).limit(1);
        if (!active) return;

        // Same reading of the floor as the owner page: seated now, plus what is due in the next
        // two hours, against the seats that are actually in service.
        const capacity = (tables || []).filter(table => !table.out_of_service).reduce((sum, table) => sum + (Number(table.seats) || 0), 0);
        const now = Date.now();
        const held = (bookings || []).filter(booking => {
          if (booking.status === 'seated') return true;
          if (booking.status === 'confirmed' || booking.status === 'waitlist') {
            const at = new Date(booking.starts_at).getTime();
            return at >= now - 3600 * 1000 && at <= now + 2 * 3600 * 1000;
          }
          return false;
        }).reduce((sum, booking) => sum + (Number(booking.party_size) || 1), 0);

        const hours = (settings && settings[0] && settings[0].hours) || {};
        const cfg = hours.offer_cfg || {};
        const slot = toSlot(cfg, hours.close);
        const offer = toOffer(cfg);

        setState({
          status: 'ready',
          guests: (guestRows || []).filter(row => text(row.phone).trim()).map(toGuest),
          floor: { capacity, held, openSeats: Math.max(0, capacity - held), occupancy: capacity ? Math.min(100, Math.round((held / capacity) * 100)) : 0, recoverable: null },
          slots: slot ? [slot] : [],
          offers: offer ? [offer] : [],
          error: '',
        });
      } catch (error) {
        if (!active) return;
        setState({ status: 'error', guests: [], floor: null, slots: [], offers: [], error: (error && error.message) || 'The floor could not be read.' });
      }
    })();
    return () => { active = false; };
  }, [clientId, clientName]);

  const compose = useCallback(({ guest, slot, offer }) => {
    const name = (guest && guest.firstName) || 'there';
    const venue = clientName || 'us';
    const when = slot && slot.endLabel ? `before ${slot.endLabel}` : 'before we close';
    const perk = offer && offer.short ? ` and ${offer.short}` : '';
    return `Hi ${name}! It's a little quiet at ${venue} tonight — pop in ${when}${perk}. Reply and we'll hold a table for you.`;
  }, [clientName]);

  // WhatsApp is opened one guest at a time: a browser blocks a burst of tabs, and each message
  // still leaves from the host's own account, exactly as on the owner page.
  const handlePrepare = useCallback(({ guests, slot, offer }) => {
    const queue = (guests || []).filter(guest => !openedRef.current.has(guest.id));
    const next = queue[0];
    if (!next) { openedRef.current = new Set(); return 'Every selected guest has been opened. Tap again to start another round.'; }
    openedRef.current.add(next.id);
    const digits = String(next.phone || '').replace(/[^\d]/g, '');
    if (!digits) return `${next.name} has no usable WhatsApp number.`;
    if (typeof window !== 'undefined') window.open(`https://wa.me/${digits}?text=${encodeURIComponent(compose({ guest: next, slot, offer }))}`, '_blank');
    const left = queue.length - 1;
    return left ? `WhatsApp opened for ${next.firstName} — ${left} selected guest${left === 1 ? '' : 's'} left.` : `WhatsApp opened for ${next.firstName} — that was the last one.`;
  }, [compose]);

  if (state.status !== 'ready') {
    return <main className="tw-fill-tables-experience" data-fmt-theme={dark ? 'dark' : 'light'}>
      <section className="fmt-hero"><div className="fmt-hero-copy"><p className="fmt-eyebrow">Fill My Tables</p><h1>Give the quiet tables a reason to glow.</h1>
      <p className="fmt-lede">{state.status === 'loading' ? 'Reading the floor…' : state.status === 'empty' ? 'Choose a client to read their floor.' : state.error}</p></div></section>
    </main>;
  }

  return <FillTablesExperience
    dark={dark}
    onOpenGuests={onOpenGuests}
    liveGuests={state.guests}
    liveFloor={state.floor}
    liveSlots={state.slots}
    liveOffers={state.offers}
    composeMessage={compose}
    onPrepare={handlePrepare}
  />;
}
