import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import ReservationsAgencyExperience from './ReservationsAgencyExperience';
import ReservationsExperience from './ReservationsExperience';

const STATUS_KEYS = ['pending', 'confirmed', 'seated', 'completed', 'waitlist', 'no_show', 'cancelled'];
const SHAPES = ['round', 'square', 'long'];
// `bookings.source` is a short machine value; only the ones the app actually
// writes get a label, anything else stays blank so the detail row hides it.
const SOURCE_LABELS = { concierge: 'AI Concierge', bio: 'Booking link', manual: 'Host entry', host: 'Host entry' };
// `dining_tables` stores pixel positions against a responsive host canvas while
// these layouts are percentage based. One fixed reference frame keeps reads and
// writes reversible instead of guessing a canvas width on every render.
const FLOOR_REF_W = 880;
const FLOOR_REF_H = 520;
const DAY_COUNT = 6;
const HOUR_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const pad = value => String(value).padStart(2, '0');
const dayId = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function buildDays() {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: DAY_COUNT }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index);
    return {
      id: dayId(date),
      weekday: date.toLocaleDateString([], { weekday: 'short' }),
      day: pad(date.getDate()),
      month: date.toLocaleDateString([], { month: 'short' }),
      label: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : date.toLocaleDateString([], { weekday: 'long' })
    };
  });
}

function mapBooking(row, tableById) {
  const date = new Date(row.starts_at);
  const name = String(row.customer_name || '').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ');
  const table = row.table_id ? tableById.get(row.table_id) : null;
  return {
    id: row.id,
    day: dayId(date),
    guest: name || 'Guest',
    firstName: firstName || 'Guest',
    lastName,
    initials: `${firstName[0] || 'G'}${lastName[0] || ''}`.toUpperCase(),
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    party: Math.max(1, Number(row.party_size) || 1),
    status: STATUS_KEYS.includes(row.status) ? row.status : 'confirmed',
    tableId: row.table_id || '',
    // The area is the room the assigned table sits in; an unseated booking has none.
    area: (table && table.area) || '',
    phone: row.customer_phone || '',
    countryCode: '',
    phoneNumber: row.customer_phone || '',
    source: SOURCE_LABELS[row.source] || '',
    // `note` is where the booking form and the Concierge store the occasion.
    occasion: row.note || '',
    // No column holds a separate host request, guest history or spend.
    request: '',
    note: '',
    visits: 0,
    spend: '',
    whatsappStatus: 'none',
    tags: []
  };
}

function mapTable(row, roomName) {
  const shape = SHAPES.includes(row.shape) ? row.shape : 'square';
  return {
    id: row.id,
    spaceId: row.room_id || '',
    name: row.name || 'T',
    area: roomName || '',
    seats: clamp(Number(row.seats) || 2, 1, 20),
    shape,
    width: shape === 'long' ? 132 : 82,
    depth: shape === 'long' ? 72 : 82,
    x: clamp((Number(row.pos_x) || 0) / FLOOR_REF_W * 100, 2, 88),
    y: clamp((Number(row.pos_y) || 0) / FLOOR_REF_H * 100, 5, 82),
    // `dining_tables` has no out-of-service column.
    outOfService: false
  };
}

const EMPTY = { bookings: [], rooms: [], tables: [], settings: null, slug: '' };

// Shared loader for both reservation pages. `withBookings` is off for the setup
// workspace, which shows layout and rules only.
function useReservationsData(clientId, withBookings) {
  const [rows, setRows] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    if (!clientId) { setRows(EMPTY); setLoading(false); return undefined; }
    setLoading(true);
    (async () => {
      const from = new Date(); from.setHours(0, 0, 0, 0);
      const to = new Date(from); to.setDate(from.getDate() + DAY_COUNT);
      const [bookings, settings, rooms, tables, bio] = await Promise.all([
        withBookings
          ? supabase.from('bookings').select('*').eq('client_id', clientId).gte('starts_at', from.toISOString()).lt('starts_at', to.toISOString()).order('starts_at', { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        supabase.from('booking_settings').select('*').eq('client_id', clientId).limit(1),
        supabase.from('dining_rooms').select('*').eq('client_id', clientId).order('sort', { ascending: true }),
        supabase.from('dining_tables').select('*').eq('client_id', clientId),
        supabase.from('bio_pages').select('slug').eq('client_id', clientId).limit(1)
      ]);
      if (!active) return;
      setRows({
        bookings: bookings.data || [],
        rooms: rooms.data || [],
        tables: tables.data || [],
        settings: (settings.data && settings.data[0]) || null,
        slug: (bio.data && bio.data[0] && bio.data[0].slug) || ''
      });
      setError(bookings.error || rooms.error || tables.error ? 'Reservations could not be loaded. Refresh to try again.' : '');
      setLoading(false);
    })();
    return () => { active = false; };
  }, [clientId, withBookings, reloadToken]);

  const run = useCallback(async (request, message) => {
    const result = await request;
    setError(result && result.error ? message : '');
    setReloadToken(token => token + 1);
  }, []);

  const liveSpaces = useMemo(() => rows.rooms.map(room => ({
    id: room.id,
    name: room.name || 'Room',
    // `dining_rooms` has no indoor / outdoor / floor column to read a type from.
    type: ''
  })), [rows.rooms]);

  const liveTables = useMemo(() => {
    const roomName = new Map(rows.rooms.map(room => [room.id, room.name || '']));
    return rows.tables.map(table => mapTable(table, roomName.get(table.room_id)));
  }, [rows.tables, rows.rooms]);

  const liveBookings = useMemo(() => {
    const tableById = new Map(liveTables.map(table => [table.id, table]));
    return rows.bookings.map(row => mapBooking(row, tableById));
  }, [rows.bookings, liveTables]);

  const liveSettings = useMemo(() => {
    const hours = (rows.settings && rows.settings.hours) || {};
    return {
      // Only `requiresApproval`, `hostPin`, `open`, `close` and `slotMinutes`
      // come from `booking_settings`. The rest exist so the shared shape stays
      // intact; every control that reads them is hidden while live props are
      // present.
      enabled: true,
      requiresApproval: !!hours.require_approval,
      slotMinutes: Number(rows.settings && rows.settings.slot_minutes) || 30,
      turnMinutes: 90,
      maxParty: 8,
      holdMinutes: 15,
      minNoticeMinutes: 120,
      advanceDays: 90,
      concierge: true,
      whatsappConfirmation: false,
      open: hours.open || '',
      close: hours.close || '',
      hostPin: hours.host_pin || ''
    };
  }, [rows.settings]);

  const origin = (typeof window !== 'undefined' && window.location.origin) || '';
  const shareUrl = rows.slug && origin ? `${origin}/reserve/${rows.slug}` : '';

  const onSaveSettings = useCallback(settings => {
    const current = rows.settings;
    const hours = (current && current.hours) || {};
    run(supabase.from('booking_settings').upsert({
      client_id: clientId,
      slot_minutes: Number(settings.slotMinutes) || Number(current && current.slot_minutes) || 30,
      // Seats-per-slot is edited on the classic page; resend what is stored so
      // this upsert never overwrites it.
      capacity: Number(current && current.capacity) || 4,
      hours: {
        ...hours,
        open: HOUR_PATTERN.test(String(settings.open || '')) ? settings.open : hours.open,
        close: HOUR_PATTERN.test(String(settings.close || '')) ? settings.close : hours.close,
        host_pin: settings.hostPin || null,
        require_approval: !!settings.requiresApproval
      },
      updated_at: new Date().toISOString()
    }), 'The reservation settings could not be saved.');
  }, [clientId, rows.settings, run]);

  const onAddSpace = useCallback(input => {
    run(supabase.from('dining_rooms').insert([{ client_id: clientId, name: (input && input.name) || 'Room', sort: rows.rooms.length }]), 'That space could not be added.');
  }, [clientId, rows.rooms.length, run]);

  const onUpdateSpace = useCallback((id, patch) => {
    if (patch.name === undefined) return;
    run(supabase.from('dining_rooms').update({ name: patch.name }).eq('id', id), 'That space could not be renamed.');
  }, [run]);

  const onRemoveSpace = useCallback(async id => {
    await supabase.from('dining_tables').delete().eq('room_id', id);
    run(supabase.from('dining_rooms').delete().eq('id', id), 'That space could not be deleted.');
  }, [run]);

  const onAddTable = useCallback(spaceId => {
    if (!spaceId) return;
    const peers = rows.tables.filter(table => table.room_id === spaceId).length;
    run(supabase.from('dining_tables').insert([{
      client_id: clientId,
      room_id: spaceId,
      name: `T${peers + 1}`,
      seats: 2,
      shape: 'square',
      pos_x: 24 + peers % 6 * 78,
      pos_y: 24 + Math.floor(peers / 6) * 78
    }]), 'That table could not be added.');
  }, [clientId, rows.tables, run]);

  const onUpdateTable = useCallback((id, patch) => {
    const update = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.seats !== undefined) update.seats = Number(patch.seats) || 1;
    if (patch.shape !== undefined) update.shape = patch.shape;
    if (patch.x !== undefined) update.pos_x = Math.round(patch.x / 100 * FLOOR_REF_W);
    if (patch.y !== undefined) update.pos_y = Math.round(patch.y / 100 * FLOOR_REF_H);
    // `width`, `depth` and `outOfService` have no columns and are dropped.
    if (!Object.keys(update).length) return;
    run(supabase.from('dining_tables').update(update).eq('id', id), 'That table could not be updated.');
  }, [run]);

  const onRemoveTable = useCallback(id => {
    run(supabase.from('dining_tables').delete().eq('id', id), 'That table could not be deleted.');
  }, [run]);

  const onUpdateBooking = useCallback((id, patch) => {
    const update = {};
    if (patch.status) {
      update.status = patch.status;
      if (patch.status === 'seated') update.seated_at = new Date().toISOString();
    }
    if ('tableId' in patch) update.table_id = patch.tableId || null;
    if (!Object.keys(update).length) return;
    run(supabase.from('bookings').update(update).eq('id', id), 'That reservation could not be updated.');
  }, [run]);

  const onAssignTable = useCallback((id, tableId) => {
    run(supabase.from('bookings').update({ table_id: tableId || null }).eq('id', id), 'The table could not be assigned.');
  }, [run]);

  const onSeatBooking = useCallback((id, tableId) => {
    run(supabase.from('bookings').update({ table_id: tableId || null, status: 'seated', seated_at: new Date().toISOString() }).eq('id', id), 'The guests could not be seated.');
  }, [run]);

  const onAddBooking = useCallback(input => {
    const [year, month, date] = String(input.day || '').split('-').map(Number);
    const [hour, minute] = String(input.time || '').split(':').map(Number);
    const when = new Date(year, (month || 1) - 1, date || 1, hour || 0, minute || 0, 0, 0);
    if (Number.isNaN(when.getTime())) { setError('That reservation needs a valid date and time.'); return; }
    const phone = `${input.countryCode || ''}${input.phoneNumber || ''}`.trim();
    const name = `${input.firstName || ''} ${input.lastName || ''}`.trim();
    run(supabase.from('bookings').insert([{
      client_id: clientId,
      customer_name: name || 'Guest',
      customer_phone: phone || null,
      party_size: Number(input.party) || 2,
      starts_at: when.toISOString(),
      source: 'manual',
      status: liveSettings.requiresApproval ? 'pending' : 'confirmed',
      note: (input.occasion || '').trim() || null
    }]), 'That reservation could not be added.');
  }, [clientId, liveSettings.requiresApproval, run]);

  const onOpenHostScreen = useCallback(() => {
    if (!rows.slug || typeof window === 'undefined') return;
    window.open(`${origin}/host/${rows.slug}`, '_blank', 'noreferrer');
  }, [origin, rows.slug]);

  return {
    loading, error, slug: rows.slug, shareUrl,
    liveBookings, liveSpaces, liveTables, liveSettings,
    onSaveSettings, onAddSpace, onUpdateSpace, onRemoveSpace,
    onAddTable, onUpdateTable, onRemoveTable,
    onUpdateBooking, onAssignTable, onSeatBooking, onAddBooking, onOpenHostScreen
  };
}

const message = text => <div style={{ padding: 24, fontSize: 13, opacity: 0.7 }}>{text}</div>;

// The reservations route: the agency booking-setup workspace.
export default function ReservationsLive({ client, dark = false, setDark = () => {}, onOpenHostTest = () => {} }) {
  const clientId = client?.id || '';
  const live = useReservationsData(clientId, false);

  if (!clientId) return message('Select a client to set up reservations.');
  if (live.loading) return message('Loading reservation setup…');

  return <ReservationsAgencyExperience
    dark={dark}
    setDark={setDark}
    onOpenHostTest={onOpenHostTest}
    liveSpaces={live.liveSpaces}
    liveTables={live.liveTables}
    liveSettings={live.liveSettings}
    clientName={client?.name || ''}
    shareUrl={live.shareUrl}
    errorMessage={live.error}
    onSaveSettings={live.onSaveSettings}
    onAddSpace={live.onAddSpace}
    onUpdateSpace={live.onUpdateSpace}
    onRemoveSpace={live.onRemoveSpace}
    onAddTable={live.onAddTable}
    onUpdateTable={live.onUpdateTable}
    onRemoveTable={live.onRemoveTable}
  />;
}

// The daily service page, for whenever the host workspace is routed.
export function ReservationsServiceLive({ client, dark = false, setDark = () => {}, onOpenHostTest = () => {} }) {
  const clientId = client?.id || '';
  const live = useReservationsData(clientId, true);
  const days = useMemo(() => buildDays(), []);

  if (!clientId) return message('Select a client to manage reservations.');
  if (live.loading) return message('Loading reservations…');

  return <ReservationsExperience
    dark={dark}
    setDark={setDark}
    onOpenHostTest={onOpenHostTest}
    liveBookings={live.liveBookings}
    liveSpaces={live.liveSpaces}
    liveTables={live.liveTables}
    liveSettings={live.liveSettings}
    liveDays={days}
    clientName={client?.name || ''}
    shareUrl={live.shareUrl}
    errorMessage={live.error}
    onUpdateBooking={live.onUpdateBooking}
    onAddBooking={live.onAddBooking}
    onAssignTable={live.onAssignTable}
    onSeatBooking={live.onSeatBooking}
    onSaveSettings={live.onSaveSettings}
    onAddSpace={live.onAddSpace}
    onUpdateSpace={live.onUpdateSpace}
    onRemoveSpace={live.onRemoveSpace}
    onAddTable={live.onAddTable}
    onUpdateTable={live.onUpdateTable}
    onRemoveTable={live.onRemoveTable}
    onOpenHostScreen={live.slug ? live.onOpenHostScreen : null}
  />;
}
