import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import GuestsExperience from './GuestsExperience';

const text = value => (typeof value === 'string' ? value : '');
const SOURCE_LABEL = { host: 'Host stand', self: 'Self sign-up', booking: 'Reservation', loyalty: 'Loyalty', pickup: 'Pickup', review: 'Review' };

function startOfToday() { const day = new Date(); day.setHours(0, 0, 0, 0); return day; }

// Days until the next occurrence of a birthday; the guest book has no other notion of "soon".
function daysToBirthday(value) {
  if (!value) return null;
  const born = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(born.getTime())) return null;
  const today = startOfToday();
  let next = new Date(today.getFullYear(), born.getMonth(), born.getDate());
  next.setHours(0, 0, 0, 0);
  if (next < today) next = new Date(today.getFullYear() + 1, born.getMonth(), born.getDate());
  return Math.round((next - today) / 86400000);
}

function daysSince(value) {
  if (!value) return null;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return null;
  at.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((startOfToday() - at) / 86400000));
}

function visitLabel(value) {
  const days = daysSince(value);
  if (days === null) return 'No visit recorded';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return new Date(value).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

// guests holds one free-text name, one phone, and no spend, seating or "occasions" record, so the
// country-code, spend and preferred-seat parts of the design stay empty and are hidden while live.
function toGuest(row, sentYears) {
  const parts = text(row.name).trim().split(/\s+/).filter(Boolean);
  const birthdayIn = daysToBirthday(row.birthday);
  return {
    id: row.id,
    firstName: parts[0] || 'Guest',
    lastName: parts.slice(1).join(' '),
    code: '',
    phone: text(row.phone).trim(),
    email: text(row.email).trim(),
    birthday: row.birthday ? String(row.birthday).slice(0, 10) : '',
    birthdayIn: birthdayIn === null ? 365 : birthdayIn,
    visits: Number(row.visits) || 0,
    spend: null,
    lastVisit: visitLabel(row.last_visit),
    lastVisitDays: daysSince(row.last_visit),
    usual: text(row.fav_item).trim(),
    allergies: text(row.allergies).trim() || 'None recorded',
    seat: '',
    notes: text(row.notes).trim(),
    vip: row.vip === true,
    marketing: row.marketing_optin === true,
    emailOptin: row.email_optin !== false,
    source: SOURCE_LABEL[text(row.source)] || text(row.source) || 'Host stand',
    occasions: [],
    momentDone: sentYears.has(`${row.id}:${new Date().getFullYear()}`),
  };
}

function toRow(guest, clientId) {
  const name = `${guest.firstName || ''} ${guest.lastName || ''}`.trim();
  return {
    client_id: clientId,
    name: name || null,
    phone: text(guest.phone).trim() || null,
    email: text(guest.email).trim() || null,
    birthday: guest.birthday || null,
    allergies: guest.allergies === 'None recorded' ? null : (text(guest.allergies).trim() || null),
    fav_item: text(guest.usual).trim() || null,
    notes: text(guest.notes).trim() || null,
    vip: guest.vip === true,
    email_optin: guest.emailOptin !== false,
    marketing_optin: guest.marketing === true,
  };
}

export default function GuestsLive({ client, dark = false, onOpenFillTables = () => {} }) {
  const [state, setState] = useState({ status: 'loading', guests: [], error: '' });
  const idRef = useRef('');
  const sentRef = useRef(new Set());
  const clientId = client?.id || '';
  const clientName = client?.name || '';

  useEffect(() => {
    let active = true;
    if (!clientId && !clientName) { setState({ status: 'empty', guests: [], error: '' }); return undefined; }
    setState({ status: 'loading', guests: [], error: '' });
    (async () => {
      try {
        let id = clientId;
        if (!id) {
          const { data, error } = await supabase.from('clients').select('id').eq('name', clientName).limit(1);
          if (error) throw error;
          id = data && data[0] && data[0].id;
        }
        if (!id) throw new Error('This client is not in the workspace yet.');
        const { data: rows, error: guestError } = await supabase.from('guests').select('*').eq('client_id', id).order('updated_at', { ascending: false });
        if (guestError) throw guestError;
        // birthday_sends is what stops one guest being wished twice in the same year.
        const { data: sends } = await supabase.from('birthday_sends').select('guest_id,year').eq('client_id', id);
        if (!active) return;
        idRef.current = id;
        sentRef.current = new Set((sends || []).map(send => `${send.guest_id}:${send.year}`));
        setState({ status: 'ready', guests: (rows || []).map(row => toGuest(row, sentRef.current)), error: '' });
      } catch (error) {
        if (!active) return;
        setState({ status: 'error', guests: [], error: (error && error.message) || 'The guest book could not be loaded.' });
      }
    })();
    return () => { active = false; };
  }, [clientId, clientName]);

  const handleSave = useCallback(async guest => {
    const id = idRef.current;
    if (!id) return { error: 'This guest book is not connected yet.' };
    const row = toRow(guest, id);
    try {
      if (guest.id) {
        const { error } = await supabase.from('guests').update(row).eq('id', guest.id);
        if (error) throw error;
        const saved = toGuest({ ...row, id: guest.id, visits: guest.visits, last_visit: null, source: guest.source }, sentRef.current);
        const next = { ...saved, lastVisit: guest.lastVisit, lastVisitDays: guest.lastVisitDays, momentDone: guest.momentDone };
        setState(current => ({ ...current, guests: current.guests.map(item => (item.id === guest.id ? next : item)) }));
        return { guest: next };
      }
      const { data, error } = await supabase.from('guests').insert([{ ...row, source: 'host' }]).select();
      if (error) throw error;
      const created = data && data[0];
      if (!created) throw new Error('The guest could not be saved.');
      const saved = toGuest(created, sentRef.current);
      setState(current => ({ ...current, guests: [saved, ...current.guests] }));
      return { guest: saved };
    } catch (error) {
      return { error: (error && error.message) || 'The guest could not be saved.' };
    }
  }, []);

  const handleDelete = useCallback(async guest => {
    try {
      const { error } = await supabase.from('guests').delete().eq('id', guest.id);
      if (error) throw error;
      setState(current => ({ ...current, guests: current.guests.filter(item => item.id !== guest.id) }));
      return {};
    } catch (error) {
      return { error: (error && error.message) || 'The guest could not be removed.' };
    }
  }, []);

  const handlePrepare = useCallback(async (guest, kind) => {
    const digits = String(guest.phone || '').replace(/[^\d]/g, '');
    if (!digits) return 'No WhatsApp number on file for this guest.';
    const venue = clientName || 'us';
    if (kind === 'birthday') {
      const wish = `Happy birthday, ${guest.firstName}! 🎉 Everyone at ${venue} is wishing you a wonderful year.`;
      if (typeof window !== 'undefined') window.open(`https://wa.me/${digits}?text=${encodeURIComponent(wish)}`, '_blank');
      const year = new Date().getFullYear();
      try { await supabase.from('birthday_sends').upsert({ client_id: idRef.current, guest_id: guest.id, channel: 'whatsapp', year }, { onConflict: 'guest_id,year,channel' }); } catch (_) {}
      sentRef.current.add(`${guest.id}:${year}`);
      setState(current => ({ ...current, guests: current.guests.map(item => (item.id === guest.id ? { ...item, momentDone: true } : item)) }));
      return `WhatsApp opened with ${guest.firstName}’s birthday wish.`;
    }
    // No template is invented for a general message: WhatsApp opens empty for the host to write.
    if (typeof window !== 'undefined') window.open(`https://wa.me/${digits}`, '_blank');
    return `WhatsApp opened for ${guest.firstName}.`;
  }, [clientName]);

  if (state.status !== 'ready') {
    return <main className="tw-guests" data-theme={dark ? 'dark' : 'light'}>
      <header className="gu-heading"><div><span>Guests{clientName ? ` / ${clientName}` : ''}</span><h1>Know the people.</h1>
      <p>{state.status === 'loading' ? 'Loading this client’s guest book…' : state.status === 'empty' ? 'Choose a client to open their guest book.' : state.error}</p></div></header>
    </main>;
  }

  return <GuestsExperience
    dark={dark}
    onOpenFillTables={onOpenFillTables}
    liveGuests={state.guests}
    clientName={clientName}
    onSaveGuest={handleSave}
    onDeleteGuest={handleDelete}
    onPrepareMessage={handlePrepare}
  />;
}
