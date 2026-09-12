import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bot, Building2, CalendarDays, Check, CheckCircle2, ChevronRight, Clock3, CloudSun, Copy, DoorOpen, Edit3, Eye, Layers3, Link2, ListFilter, MapPin, MessageCircle, Minus, Moon, Move, Plus, QrCode, Save, Settings2, ShieldCheck, Sun, Table2, Tablet, Trash2, UserRound, UsersRound, UtensilsCrossed, X } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import QRCode from 'qrcode';
import { DishPhoto } from './MenuVisuals';
import { readMenuBook } from './menuPreviewModel';
import { RESERVATION_DAYS, addPreviewReservation, addReservationSpace, addReservationTable, assignReservationTable, readReservationPreview, removeReservationSpace, removeReservationTable, reservationSummary, saveReservationPreview, setReservationStatus, updateReservationSpace, updateReservationTable } from './reservationPreviewModel';
import './reservations-experience.css';
const STATUS = {
  pending: {
    label: 'Needs reply',
    next: 'Confirm table'
  },
  confirmed: {
    label: 'Confirmed',
    next: 'Seat guests'
  },
  seated: {
    label: 'At table',
    next: 'Complete visit'
  },
  completed: {
    label: 'Completed',
    next: 'Completed'
  },
  waitlist: {
    label: 'Waitlist',
    next: 'Confirm table'
  },
  no_show: {
    label: 'No-show',
    next: 'No-show'
  },
  cancelled: {
    label: 'Cancelled',
    next: 'Cancelled'
  }
};
const COUNTRY_CODES = [['+973', 'Bahrain'], ['+966', 'Saudi Arabia'], ['+971', 'UAE'], ['+965', 'Kuwait'], ['+974', 'Qatar'], ['+968', 'Oman'], ['+44', 'United Kingdom'], ['+1', 'United States']];
const timeToMinutes = time => {
  const [hours, minutes] = String(time).split(':').map(Number);
  return hours * 60 + minutes;
};
const prettyTime = time => {
  const [hours, minutes] = String(time).split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
};
function DayRibbon({
  day,
  setDay,
  data
}) {
  return <nav className="rv-days" aria-label="Reservation days">{RESERVATION_DAYS.map(item => {
      const summary = reservationSummary(data.bookings, item.id);
      return <button type="button" key={item.id} aria-pressed={day === item.id} onClick={() => setDay(item.id)}><span>{item.weekday}</span><strong>{item.day}</strong><small>{summary.bookings ? `${summary.bookings} bookings` : item.label}</small></button>;
    })}</nav>;
}
export function ReservationShare({
  onClose
}) {
  const url = 'https://book.tawaslo.com/marina-social-club',
    [qr, setQr] = useState(''),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(url, {
      width: 420,
      margin: 1,
      color: {
        dark: '#172926',
        light: '#ffffff'
      }
    }).then(value => live && setQr(value)).catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  function copy() {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Reserve a table at Marina Social Club\n${url}`)}`;
  return <section className="rv-share" aria-label="Reservation link and QR"><button className="rv-share-close" type="button" aria-label="Close reservation sharing" onClick={onClose}><X size={18} /></button><div><span>Reservation link</span><h2>One link for every table.</h2><p>Place it in the bio, on Google, at the hotel desk, or print the QR for the entrance.</p><label>Guest booking link<input readOnly value={url} /></label><div><button type="button" onClick={copy}><Copy size={16} />{copied ? 'Copied' : 'Copy link'}</button><a href={qr || '#'} download="marina-social-club-booking-qr.png"><QrCode size={16} />Download QR</a><a className="rv-whatsapp-share" href={whatsappUrl} target="_blank" rel="noreferrer"><FaWhatsapp />Share to WhatsApp</a></div></div><figure>{qr ? <img src={qr} alt="QR code for Marina Social Club reservations" /> : <QrCode size={70} />}<figcaption><strong>Marina Social Club</strong><span>Reserve a table</span></figcaption></figure></section>;
}
function ServiceTimeline({
  bookings,
  selectedId,
  onSelect
}) {
  const hours = ['18:00', '19:00', '20:00', '21:00', '22:00'],
    start = 18 * 60,
    end = 23 * 60;
  return <section className="rv-timeline" aria-label="Evening reservation timeline"><header><span>Evening service line</span><small>Swipe sideways on a phone</small></header><div className="rv-timeline-scroll"><div className="rv-timeline-stage"><div className="rv-hour-row">{hours.map(time => <span key={time}>{prettyTime(time)}</span>)}</div><div className="rv-current-line"><i /><span>Now</span></div>{bookings.filter(booking => !['cancelled', 'completed', 'no_show'].includes(booking.status)).map((booking, index) => {
          const left = Math.max(1, Math.min(92, (timeToMinutes(booking.time) - start) / (end - start) * 100)),
            width = Math.min(24, 9 + booking.party * 1.5);
          return <button type="button" className="rv-timeline-booking" data-status={booking.status} aria-pressed={selectedId === booking.id} key={booking.id} style={{
            left: `${left}%`,
            width: `${width}%`,
            top: `${58 + index % 3 * 56}px`
          }} onClick={() => onSelect(booking.id)}><span>{prettyTime(booking.time)}</span><strong>{booking.firstName || booking.guest.split(' ')[0]}</strong><small>{booking.party} guests · {booking.area}</small></button>;
        })}</div></div></section>;
}
function BookingCard({
  booking,
  selected,
  onSelect
}) {
  return <button type="button" className="rv-booking-card" data-status={booking.status} aria-pressed={selected} onClick={onSelect}><span className="rv-avatar">{booking.initials}</span><span className="rv-card-time"><strong>{prettyTime(booking.time)}</strong><small>{booking.party} guests</small></span><span className="rv-card-guest"><strong>{booking.guest}</strong><small>{booking.occasion} · {booking.area}</small></span><span className="rv-card-status"><i />{STATUS[booking.status].label}</span><ChevronRight size={17} /></button>;
}
function BookingDetail({
  booking,
  tables,
  onStatus,
  onAssign,
  onCancel
}) {
  if (!booking) return <aside className="rv-detail"><p>Select a reservation to see the handoff.</p></aside>;
  const next = booking.status === 'pending' || booking.status === 'waitlist' ? 'confirmed' : booking.status === 'confirmed' ? 'seated' : booking.status === 'seated' ? 'completed' : '';
  return <aside className="rv-detail" data-status={booking.status}><header><span>Guest handoff</span><b>{STATUS[booking.status].label}</b></header><div className="rv-detail-name"><i>{booking.initials}</i><span><h3>{booking.guest}</h3><p>{booking.phone} · {booking.visits} visits · {booking.spend}</p></span></div><div className="rv-detail-moment"><span><Clock3 size={17} /><i><small>Arrival</small><strong>{prettyTime(booking.time)}</strong></i></span><span><UsersRound size={17} /><i><small>Party</small><strong>{booking.party} guests</strong></i></span></div><section><span>Host request</span><p>{booking.request || booking.note}</p><div>{booking.tags.map(tag => <em key={tag}>{tag}</em>)}</div></section><label>Table<select value={booking.tableId} onChange={event => onAssign(booking.id, event.target.value)}><option value="">Unassigned</option>{tables.filter(table => table.seats >= booking.party && !table.outOfService).map(table => <option key={table.id} value={table.id}>{table.name} · {table.area} · {table.seats} chairs</option>)}</select></label><dl><div><dt>Source</dt><dd>{booking.source}</dd></div><div><dt>Occasion</dt><dd>{booking.occasion}</dd></div></dl>{booking.whatsappStatus === 'queued' && <p className="rv-wa-note"><FaWhatsapp />Confirmation is ready for WhatsApp.</p>}{booking.source === 'AI Concierge' && <p className="rv-ai-note"><Bot size={15} />The Concierge can answer this guest’s booking questions and update them automatically.</p>}<footer>{next && <button type="button" className="rv-primary" onClick={() => onStatus(booking.id, next)}>{next === 'confirmed' ? <Check size={16} /> : next === 'seated' ? <DoorOpen size={16} /> : <CheckCircle2 size={16} />} {STATUS[booking.status].next}</button>}{!['cancelled', 'completed'].includes(booking.status) && <button type="button" className="rv-cancel" onClick={() => onCancel(booking)}><X size={16} />Cancel</button>}</footer></aside>;
}
export function SpaceIcon({
  type
}) {
  return type === 'outdoor' ? <CloudSun size={15} /> : type === 'floor' ? <Layers3 size={15} /> : <Building2 size={15} />;
}
export function TableChairs({
  count
}) {
  return <span className="rv-table-seats" aria-hidden="true">{Array.from({
      length: Math.min(20, count)
    }, (_, index) => {
      const angle = -Math.PI / 2 + index / count * Math.PI * 2;
      return <i key={index} style={{
        left: `${50 + Math.cos(angle) * 58}%`,
        top: `${50 + Math.sin(angle) * 62}%`
      }} />;
    })}</span>;
}
export function SpaceModal({
  onClose,
  onAdd
}) {
  const [name, setName] = useState(''),
    [type, setType] = useState('indoor');
  return <div className="rv-overlay" role="presentation" onClick={onClose}><section role="dialog" aria-modal="true" aria-labelledby="rv-space-title" onClick={event => event.stopPropagation()}><button type="button" aria-label="Close new space" onClick={onClose}><X size={18} /></button><span>Floor plan</span><h2 id="rv-space-title">Add a space</h2><p>Create another floor, room, terrace, garden, or outdoor section.</p><label>Space name<input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Upper floor" /></label><label>Space type<select value={type} onChange={event => setType(event.target.value)}><option value="indoor">Indoor room</option><option value="outdoor">Outdoor section</option><option value="floor">Separate floor</option></select></label><button type="button" className="rv-modal-add" disabled={!name.trim()} onClick={() => {
        if (!name.trim()) return;
        onAdd({
          name,
          type
        });
        onClose();
      }}><Plus size={16} />Add space</button></section></div>;
}
function ConfirmLayoutDelete({
  request,
  onClose,
  onConfirm
}) {
  if (!request) return null;
  return <div className="rv-overlay" role="presentation" onClick={onClose}><section className="rv-confirm" role="alertdialog" aria-modal="true" aria-labelledby="rv-layout-delete" onClick={event => event.stopPropagation()}><span><Trash2 size={19} /></span><h2 id="rv-layout-delete">Delete {request.label}?</h2><p>{request.kind === 'space' ? 'Every table in this space will also be removed. Existing reservations return to the unassigned list.' : 'The table will be removed from this layout. Any reservation using it returns to the unassigned list.'}</p><div><button type="button" onClick={onClose}>Keep it</button><button type="button" onClick={onConfirm}><Trash2 size={16} />Yes, delete</button></div></section></div>;
}
function HostFloor({
  data,
  setData,
  day,
  selectedId,
  onSelect,
  onNotice,
  onAddWalkIn
}) {
  const [mode, setMode] = useState('host'),
    [activeSpaceId, setActiveSpaceId] = useState(data.spaces[0]?.id || ''),
    [selectedTableId, setSelectedTableId] = useState(''),
    [armedId, setArmedId] = useState(''),
    [spaceOpen, setSpaceOpen] = useState(false),
    [deleteRequest, setDeleteRequest] = useState(null),
    [notified, setNotified] = useState({}),
    [compactLayout, setCompactLayout] = useState(false);
  const canvasRef = useRef(null),
    dragRef = useRef(null);
  useEffect(() => {
    if (!data.spaces.some(space => space.id === activeSpaceId)) setActiveSpaceId(data.spaces[0]?.id || '');
  }, [data.spaces, activeSpaceId]);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia('(max-width: 700px)');
    const applyLayout = () => {
      setCompactLayout(query.matches);
      if (query.matches) {
        setMode('host');
        setSelectedTableId('');
      }
    };
    applyLayout();
    query.addEventListener?.('change', applyLayout);
    return () => query.removeEventListener?.('change', applyLayout);
  }, []);
  const activeSpace = data.spaces.find(space => space.id === activeSpaceId) || data.spaces[0],
    spaceTables = data.tables.filter(table => table.spaceId === activeSpace?.id),
    dayBookings = data.bookings.filter(booking => booking.day === day && !['cancelled', 'completed', 'no_show'].includes(booking.status)),
    bookingFor = tableId => dayBookings.find(booking => booking.tableId === tableId),
    arriving = dayBookings.filter(booking => booking.status === 'confirmed' && !booking.tableId),
    waitlist = dayBookings.filter(booking => booking.status === 'waitlist'),
    selectedTable = spaceTables.find(table => table.id === selectedTableId),
    focusedBooking = dayBookings.find(booking => booking.id === selectedId),
    freeCount = spaceTables.filter(table => !table.outOfService && !bookingFor(table.id)).length,
    reservedCount = spaceTables.filter(table => bookingFor(table.id)?.status === 'confirmed').length,
    seatedCount = spaceTables.filter(table => bookingFor(table.id)?.status === 'seated').length;
  function setTable(id, patch) {
    setData(current => updateReservationTable(current, id, patch));
  }
  function addTable() {
    const now = Date.now();
    setData(current => addReservationTable(current, activeSpace.id, now));
    setSelectedTableId(`table-${now}`);
    onNotice('Table added. Drag it into place and choose its chairs.');
  }
  function seatArmed(table) {
    if (!armedId || table.outOfService || bookingFor(table.id)) return;
    setData(current => {
      let bookings = assignReservationTable(current.bookings, armedId, table.id, current.tables);
      bookings = setReservationStatus(bookings, armedId, 'seated');
      return {
        ...current,
        bookings
      };
    });
    onSelect(armedId);
    setArmedId('');
    onNotice(`Guests seated at ${table.name}.`);
  }
  function clearTable(booking) {
    setData(current => ({
      ...current,
      bookings: setReservationStatus(assignReservationTable(current.bookings, booking.id, '', current.tables), booking.id, 'completed')
    }));
    onNotice('Visit completed and the table is free.');
  }
  function down(event, table) {
    if (mode !== 'edit') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      id: table.id,
      dx: event.clientX - (rect.left + rect.width * table.x / 100),
      dy: event.clientY - (rect.top + rect.height * table.y / 100),
      moved: false
    };
    setSelectedTableId(table.id);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function move(event) {
    const drag = dragRef.current,
      rect = canvasRef.current?.getBoundingClientRect();
    if (!drag || !rect || mode !== 'edit') return;
    drag.moved = true;
    const x = (event.clientX - rect.left - drag.dx) / rect.width * 100,
      y = (event.clientY - rect.top - drag.dy) / rect.height * 100;
    setTable(drag.id, {
      x,
      y
    });
  }
  function up(event) {
    if (!dragRef.current) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const moved = dragRef.current.moved;
    dragRef.current = null;
    if (moved) onNotice('Table position updated.');
  }
  function addSpace(input) {
    const now = Date.now();
    setData(current => addReservationSpace(current, input, now));
    setActiveSpaceId(`space-${now}`);
    setSelectedTableId('');
    onNotice(`${input.name} added to the floor plan.`);
  }
  function confirmDelete() {
    if (!deleteRequest) return;
    if (deleteRequest.kind === 'table') {
      setData(current => removeReservationTable(current, deleteRequest.id));
      setSelectedTableId('');
      onNotice('Table deleted from the layout.');
    } else {
      const nextSpace = data.spaces.find(space => space.id !== deleteRequest.id);
      setData(current => removeReservationSpace(current, deleteRequest.id));
      setActiveSpaceId(nextSpace?.id || '');
      setSelectedTableId('');
      onNotice('Space and its tables deleted.');
    }
    setDeleteRequest(null);
  }
  return <section className="rv-floor rv-floor-v2"><header><div><span>Host floor</span><h2>Build the room, then run it live.</h2><p>Map every floor and outdoor section. During service, choose an arrival and press a free table to seat them.</p></div><div className="rv-floor-key"><span><i />Free</span><span><i />Reserved</span><span><i />Seated</span><span><i />Out</span></div></header><div className="rv-floor-toolbar"><div><button type="button" aria-pressed={mode === 'host'} onClick={() => {
          setMode('host');
          setSelectedTableId('');
        }}><Tablet size={15} />Host view</button>{!compactLayout && <button type="button" aria-pressed={mode === 'edit'} onClick={() => {
          setMode('edit');
          setArmedId('');
        }}><Edit3 size={15} />Edit layout</button>}</div><span />{mode === 'host' ? <button type="button" className="rv-floor-action" onClick={onAddWalkIn}><Plus size={15} />Walk-in</button> : <><button type="button" onClick={() => setSpaceOpen(true)}><Plus size={15} />Add space</button><button type="button" className="rv-floor-action" onClick={addTable}><Plus size={15} />Add table</button></>}</div>{compactLayout && <p className="rv-mobile-layout-note"><Tablet size={16} /><span><strong>Live host mode on phone</strong>Edit spaces, table sizes, and the floor plan from a tablet or laptop.</span></p>}<nav className="rv-spaces" aria-label="Dining spaces">{data.spaces.map(space => <button type="button" key={space.id} aria-pressed={activeSpace?.id === space.id} onClick={() => {
        setActiveSpaceId(space.id);
        setSelectedTableId('');
      }}><SpaceIcon type={space.type} /><span><strong>{space.name}</strong><small>{space.type === 'outdoor' ? 'Outdoor' : space.type === 'floor' ? 'Separate floor' : 'Indoor'} · {data.tables.filter(table => table.spaceId === space.id).length} tables</small></span></button>)}</nav>{mode === 'host' && <section className="rv-floor-stats"><span><strong>{seatedCount}</strong>Seated</span><span><strong>{reservedCount}</strong>Reserved</span><span><strong>{freeCount}</strong>Free</span><span><strong>{waitlist.length}</strong>Waitlist</span></section>}{mode === 'edit' && activeSpace && <section className="rv-space-editor"><SpaceIcon type={activeSpace.type} /><label>Space name<input value={activeSpace.name} onChange={event => setData(current => updateReservationSpace(current, activeSpace.id, {
          name: event.target.value
        }))} /></label><label>Type<select value={activeSpace.type} onChange={event => setData(current => updateReservationSpace(current, activeSpace.id, {
          type: event.target.value
        }))}><option value="indoor">Indoor room</option><option value="outdoor">Outdoor section</option><option value="floor">Separate floor</option></select></label><button type="button" disabled={data.spaces.length === 1} onClick={() => setDeleteRequest({
        kind: 'space',
        id: activeSpace.id,
        label: activeSpace.name
      })}><Trash2 size={16} />Delete space</button></section>}{armedId && <p className="rv-seat-cue"><Move size={16} />Choose a free table for <strong>{dayBookings.find(booking => booking.id === armedId)?.guest}</strong><button type="button" onClick={() => setArmedId('')}>Cancel</button></p>}<div className="rv-floor-shell rv-floor-shell-v2"><div className="rv-layout-wrap"><div className="rv-water"><span>{activeSpace?.type === 'outdoor' ? 'Open-air edge' : activeSpace?.type === 'floor' ? 'Upper level' : 'Dining room'}</span></div><div ref={canvasRef} className="rv-floor-plan rv-floor-canvas" data-editing={mode === 'edit' ? 'true' : 'false'}>{!spaceTables.length && <p className="rv-floor-empty">{mode === 'edit' ? 'Add a table, then drag it anywhere in this space.' : 'No tables are mapped in this space yet.'}</p>}{spaceTables.map(table => {
            const booking = bookingFor(table.id),
              state = table.outOfService ? 'out' : booking?.status || 'free';
            return <button type="button" key={table.id} className="rv-table rv-table-map" data-shape={table.shape} data-state={state} aria-pressed={selectedTableId === table.id} aria-label={`${table.name}, ${activeSpace?.name}, ${table.seats} chairs, ${table.outOfService ? 'out of service' : booking ? STATUS[booking.status].label : 'free'}`} style={{
              left: `${table.x}%`,
              top: `${table.y}%`,
              width: `${table.width}px`,
              height: `${table.depth}px`
            }} onPointerDown={event => down(event, table)} onPointerMove={move} onPointerUp={up} onPointerCancel={() => {
              dragRef.current = null;
            }} onClick={() => {
              if (mode === 'edit') {
                setSelectedTableId(table.id);
                return;
              }
              if (booking) {
                onSelect(booking.id);
                return;
              }
              seatArmed(table);
            }}><TableChairs count={table.seats} /><span>{table.name}</span><small>{table.seats} chairs</small>{booking && <b>{booking.firstName || booking.guest.split(' ')[0]}</b>}{mode === 'edit' && <Move size={13} />}</button>;
          })}<div className="rv-host-desk"><Table2 size={17} />Host</div></div></div><aside className="rv-floor-panel">{mode === 'edit' ? selectedTable ? <><header><span>Edit table</span><small>Drag it directly on the map</small></header><label>Table name<input value={selectedTable.name} onChange={event => setTable(selectedTable.id, {
              name: event.target.value
            })} /></label><label>Number of chairs<select value={selectedTable.seats} onChange={event => setTable(selectedTable.id, {
              seats: Number(event.target.value)
            })}>{Array.from({
                length: 20
              }, (_, index) => <option value={index + 1} key={index + 1}>{index + 1} {index === 0 ? 'chair' : 'chairs'}</option>)}</select></label><div className="rv-shapes"><span>Table shape</span>{[['square', 'Square'], ['round', 'Round'], ['long', 'Long']].map(([shape, label]) => <button type="button" key={shape} aria-pressed={selectedTable.shape === shape} onClick={() => setTable(selectedTable.id, {
              shape,
              width: shape === 'long' ? 132 : 82,
              depth: shape === 'long' ? 72 : 82
            })}>{label}</button>)}</div><div className="rv-table-size"><label>Width <output>{selectedTable.width}px</output><input aria-label="Table width" type="range" min="58" max="180" value={selectedTable.width} onChange={event => setTable(selectedTable.id, {
                width: Number(event.target.value)
              })} /></label><label>Depth <output>{selectedTable.depth}px</output><input aria-label="Table depth" type="range" min="54" max="132" value={selectedTable.depth} onChange={event => setTable(selectedTable.id, {
                depth: Number(event.target.value)
              })} /></label></div><button type="button" className="rv-oos" aria-pressed={selectedTable.outOfService} onClick={() => setTable(selectedTable.id, {
            outOfService: !selectedTable.outOfService
          })}><span><strong>Out of service</strong><small>Repairs, private use, or temporarily unavailable</small></span><i><b /></i></button><button type="button" className="rv-delete-table" onClick={() => setDeleteRequest({
            kind: 'table',
            id: selectedTable.id,
            label: selectedTable.name
          })}><Trash2 size={15} />Delete table</button></> : <p className="rv-edit-help"><Move size={20} /><strong>Choose a table to edit</strong><span>Rename it, change its chairs or shape, mark it unavailable, or drag it into place.</span></p> : <><header><span>Service handoff</span><small>{arriving.length} arriving · {waitlist.length} waiting</small></header>{focusedBooking?.tableId && <article className="rv-floor-focus"><strong>{focusedBooking.guest}</strong><span>{focusedBooking.party} guests · {data.tables.find(table => table.id === focusedBooking.tableId)?.name}</span><button type="button" onClick={() => clearTable(focusedBooking)}>Complete and clear</button></article>}<section><span>Arriving</span>{arriving.length ? arriving.map(booking => <button type="button" key={booking.id} aria-pressed={armedId === booking.id} onClick={() => {
              setArmedId(booking.id);
              onSelect(booking.id);
            }}><i>{booking.initials}</i><span><strong>{booking.guest}</strong><small>{prettyTime(booking.time)} · {booking.party} guests</small></span><b>Seat</b></button>) : <p>Everyone arriving is assigned.</p>}</section><section><span>Waitlist</span>{waitlist.length ? waitlist.map(booking => <button type="button" key={booking.id} aria-pressed={armedId === booking.id} onClick={() => {
              setArmedId(booking.id);
              onSelect(booking.id);
            }}><i>{booking.initials}</i><span><strong>{booking.guest}</strong><small>{booking.party} guests · waiting</small></span>{booking.phone && <em onClick={event => {
                event.stopPropagation();
                setNotified(current => ({
                  ...current,
                  [booking.id]: true
                }));
                onNotice('WhatsApp table-ready message prepared.');
              }}>{notified[booking.id] ? <Check size={13} /> : <FaWhatsapp />}</em>}</button>) : <p>No one is waiting.</p>}</section></>}</aside></div><section className="rv-host-launch"><Tablet size={23} /><div><span>Host tablet</span><strong>Open a full-screen seating view at the entrance.</strong><small>Use the same spaces, table positions, arrivals, waitlist, and guest memory.</small></div><label>4-digit PIN<input value={data.settings.hostPin} maxLength={4} inputMode="numeric" onChange={event => setData(current => ({
          ...current,
          settings: {
            ...current.settings,
            hostPin: event.target.value.replace(/\D/g, '').slice(0, 4)
          }
        }))} /></label><button type="button" onClick={() => onNotice('Host tablet preview is ready with this layout.')}><Eye size={15} />Preview host screen</button></section>{spaceOpen && <SpaceModal onClose={() => setSpaceOpen(false)} onAdd={addSpace} />}<ConfirmLayoutDelete request={deleteRequest} onClose={() => setDeleteRequest(null)} onConfirm={confirmDelete} /></section>;
}
export function GuestBooking({
  data,
  setData,
  onNotice,
  menu
}) {
  const [day, setDay] = useState(RESERVATION_DAYS[1].id),
    [party, setParty] = useState(2),
    [time, setTime] = useState('20:00'),
    [occasion, setOccasion] = useState('Dinner'),
    [firstName, setFirstName] = useState(''),
    [lastName, setLastName] = useState(''),
    [countryCode, setCountryCode] = useState('+973'),
    [phoneNumber, setPhoneNumber] = useState(''),
    [request, setRequest] = useState(''),
    [showMenu, setShowMenu] = useState(false),
    [done, setDone] = useState(null);
  const dishes = menu.items.filter(item => item.available && item.service !== 'pickup').slice(0, 5),
    canBook = firstName.trim() && lastName.trim() && phoneNumber.replace(/\D/g, '').length >= 6;
  function book() {
    if (!canBook) {
      onNotice('Add the guest’s first name, second name, and WhatsApp number.');
      return;
    }
    const input = {
      day,
      party,
      time,
      occasion,
      firstName,
      lastName,
      countryCode,
      phoneNumber,
      request,
      source: 'Guest booking preview'
    };
    setData(current => addPreviewReservation(current, input));
    setDone(input);
    onNotice(data.settings.requiresApproval ? 'Reservation request added for approval.' : 'Reservation confirmed and WhatsApp message prepared.');
  }
  if (done) return <section className="rv-guest rv-guest-done"><div className="rv-guest-copy"><span>Guest confirmation</span><h2>The booking ends with confidence.</h2><p>The restaurant has the full guest name, WhatsApp number, occasion, and request. The host sees it immediately.</p></div><article className="rv-booking-phone rv-confirmation-phone"><div className="rv-confirm-check"><Check size={30} /></div><span>{data.settings.requiresApproval ? 'Request received' : 'Reservation confirmed'}</span><h3>See you by<br />the water.</h3><p>{done.firstName} {done.lastName}<br />{RESERVATION_DAYS.find(item => item.id === done.day)?.label} · {prettyTime(done.time)} · {done.party} guests</p>{data.settings.whatsappConfirmation && <div className="rv-whatsapp-confirm"><FaWhatsapp /><span><strong>Confirmation ready</strong><small>{done.countryCode} {done.phoneNumber}</small></span></div>}<button type="button" onClick={() => setDone(null)}>Make another reservation</button></article></section>;
  return <section className="rv-guest"><div className="rv-guest-copy"><span>Guest booking</span><h2>A table should feel inviting before they arrive.</h2><p>Guests can see the dine-in menu, ask the Concierge, share their occasion and requests, then receive confirmation on WhatsApp.</p><ul><li><Bot size={16} />AI answers menu and availability questions</li><li><FaWhatsapp />Confirmation reaches the number with country code</li><li><MessageCircle size={16} />Occasions and requests become useful host notes</li></ul></div><article className="rv-booking-phone rv-booking-phone-v2"><header><span>MSC</span><div><strong>Marina Social Club</strong><small>Reservations by the water</small></div></header><div className="rv-phone-service-links"><button type="button" aria-pressed={showMenu} onClick={() => setShowMenu(value => !value)}><UtensilsCrossed size={14} />{showMenu ? 'Back to booking' : 'View menu'}</button><a href="?page=concierge&occasions=editorial"><Bot size={14} />Ask the Concierge</a></div>{showMenu ? <section className="rv-phone-menu"><span>Dine-in menu</span><h3>{menu.title}</h3>{dishes.map(item => <article key={item.id}><DishPhoto item={item} /><span><strong>{item.name}</strong><small>{item.description}</small><b>{menu.currency} {item.price}</b></span></article>)}<button type="button" onClick={() => setShowMenu(false)}>Continue to reservation<ArrowRight size={14} /></button></section> : <><div className="rv-phone-scene"><span>Reserve your table</span><h3>Meet us by<br />the water.</h3><p>Lunch, golden hour, and dinner.</p></div><section><label>Choose a day<div className="rv-phone-days">{RESERVATION_DAYS.slice(0, 4).map(item => <button type="button" key={item.id} aria-pressed={day === item.id} onClick={() => setDay(item.id)}><small>{item.weekday}</small><strong>{item.day}</strong></button>)}</div></label><label>Guests<div className="rv-party-stepper"><button type="button" aria-label="Remove one guest" onClick={() => setParty(value => Math.max(1, value - 1))}><Minus size={15} /></button><strong>{party} {party === 1 ? 'guest' : 'guests'}</strong><button type="button" aria-label="Add one guest" onClick={() => setParty(value => Math.min(data.settings.maxParty, value + 1))}><Plus size={15} /></button></div></label><label>Time<div className="rv-phone-times">{['19:00', '19:30', '20:00', '20:30'].map(value => <button type="button" key={value} aria-pressed={time === value} onClick={() => setTime(value)}>{prettyTime(value)}</button>)}</div></label><div className="rv-name-fields"><label>First name<input value={firstName} onChange={event => setFirstName(event.target.value)} placeholder="First name" /></label><label>Second name<input value={lastName} onChange={event => setLastName(event.target.value)} placeholder="Second name" /></label></div><label>WhatsApp number<div className="rv-phone-field"><select aria-label="Country code" value={countryCode} onChange={event => setCountryCode(event.target.value)}>{COUNTRY_CODES.map(([code, country]) => <option key={code} value={code}>{code} · {country}</option>)}</select><input inputMode="tel" value={phoneNumber} onChange={event => setPhoneNumber(event.target.value.replace(/\D/g, '').slice(0, 15))} placeholder="Mobile number" /></div></label><label>Occasion<select value={occasion} onChange={event => setOccasion(event.target.value)}><option>Dinner</option><option>Birthday</option><option>Anniversary</option><option>Date night</option><option>Business dinner</option><option>Family gathering</option><option>Other occasion</option></select></label><label>Requests or anything we should know<textarea rows={2} value={request} onChange={event => setRequest(event.target.value)} placeholder="Allergies, seating preference, accessibility, cake, or another request" /></label><button type="button" className="rv-phone-submit" disabled={!canBook} onClick={book}>{data.settings.requiresApproval ? 'Request this table' : 'Reserve this table'}<ArrowRight size={16} /></button><small className="rv-phone-note">{data.settings.whatsappConfirmation ? `Confirmation goes to ${countryCode} ${phoneNumber || 'your number'} on WhatsApp.` : 'The restaurant will confirm this booking on screen.'}</small></section></>}</article></section>;
}
function Toggle({
  label,
  note,
  checked,
  onChange,
  icon
}) {
  return <button type="button" className="rv-toggle" aria-pressed={checked} onClick={() => onChange(!checked)}>{icon}<span><strong>{label}</strong><small>{note}</small></span><i><b /></i></button>;
}
export function ReservationSettings({
  data,
  setData,
  onSave
}) {
  const settings = data.settings,
    set = (field, value) => setData(current => ({
      ...current,
      settings: {
        ...current.settings,
        [field]: value
      }
    }));
  return <section className="rv-settings"><header><span>Reservation settings</span><h2>Set the room’s rules once.</h2><p>The booking page, host view, WhatsApp confirmation, and Concierge use the same availability.</p></header><div className="rv-settings-grid"><Toggle label={settings.enabled ? 'Reservations open' : 'Reservations paused'} note={`${settings.open} to ${settings.close}`} checked={settings.enabled} onChange={value => set('enabled', value)} icon={<CalendarDays size={18} />} /><Toggle label="Host approval" note="Review every request before confirming" checked={settings.requiresApproval} onChange={value => set('requiresApproval', value)} icon={<CheckCircle2 size={18} />} /><Toggle label="AI Concierge" note="Answers and manages simple changes" checked={settings.concierge} onChange={value => set('concierge', value)} icon={<Bot size={18} />} /><Toggle label="WhatsApp confirmation" note="Booking, updates, reminders, and table-ready messages" checked={settings.whatsappConfirmation} onChange={value => set('whatsappConfirmation', value)} icon={<FaWhatsapp />} /><label><Clock3 size={18} /><span><strong>Table duration</strong><small>Used to calculate availability</small></span><select value={settings.turnMinutes} onChange={event => set('turnMinutes', Number(event.target.value))}>{[60, 75, 90, 105, 120, 150].map(value => <option key={value} value={value}>{value} min</option>)}</select></label><label><UsersRound size={18} /><span><strong>Largest online party</strong><small>Larger groups contact the team</small></span><select value={settings.maxParty} onChange={event => set('maxParty', Number(event.target.value))}>{[4, 6, 8, 10, 12, 16].map(value => <option key={value} value={value}>{value} guests</option>)}</select></label><label><Clock3 size={18} /><span><strong>Arrival grace</strong><small>Before releasing the table</small></span><select value={settings.holdMinutes} onChange={event => set('holdMinutes', Number(event.target.value))}>{[5, 10, 15, 20, 30].map(value => <option key={value} value={value}>{value} min</option>)}</select></label><label><Tablet size={18} /><span><strong>Host tablet PIN</strong><small>Four digits for the entrance screen</small></span><input aria-label="Host tablet PIN" inputMode="numeric" maxLength={4} value={settings.hostPin} onChange={event => set('hostPin', event.target.value.replace(/\D/g, '').slice(0, 4))} /></label></div><button type="button" className="rv-save-settings" onClick={onSave}><Save size={16} />Save reservation settings</button></section>;
}
function NewReservationModal({
  day,
  onClose,
  onAdd
}) {
  const [firstName, setFirstName] = useState(''),
    [lastName, setLastName] = useState(''),
    [party, setParty] = useState(2),
    [time, setTime] = useState('20:00'),
    [area, setArea] = useState('Any area'),
    [occasion, setOccasion] = useState('Dinner'),
    [countryCode, setCountryCode] = useState('+973'),
    [phoneNumber, setPhoneNumber] = useState(''),
    [request, setRequest] = useState('');
  return <div className="rv-overlay" role="presentation" onClick={onClose}><section role="dialog" aria-modal="true" aria-labelledby="rv-new-title" onClick={event => event.stopPropagation()}><button type="button" aria-label="Close new reservation" onClick={onClose}><X size={18} /></button><span>Host entry</span><h2 id="rv-new-title">Add a reservation</h2><p>For phone bookings and walk-ins. Add WhatsApp details now so the guest can receive updates.</p><div><label>First name<input autoFocus value={firstName} onChange={event => setFirstName(event.target.value)} placeholder="First name" /></label><label>Second name<input value={lastName} onChange={event => setLastName(event.target.value)} placeholder="Second name" /></label></div><div><label>Time<input type="time" value={time} onChange={event => setTime(event.target.value)} /></label><label>Guests<input type="number" min="1" max="30" value={party} onChange={event => setParty(event.target.value)} /></label></div><label>WhatsApp number<div className="rv-modal-phone"><select value={countryCode} onChange={event => setCountryCode(event.target.value)}>{COUNTRY_CODES.map(([code, country]) => <option key={code} value={code}>{code} · {country}</option>)}</select><input value={phoneNumber} inputMode="tel" onChange={event => setPhoneNumber(event.target.value.replace(/\D/g, '').slice(0, 15))} placeholder="Mobile number" /></div></label><label>Preferred area<select value={area} onChange={event => setArea(event.target.value)}><option>Any area</option><option>Waterfront terrace</option><option>Garden</option><option>Main dining room</option><option>Upper floor</option></select></label><label>Occasion<input value={occasion} onChange={event => setOccasion(event.target.value)} /></label><label>Request<textarea rows={2} value={request} onChange={event => setRequest(event.target.value)} placeholder="Allergies, seating, accessibility, or celebration details" /></label><button type="button" className="rv-modal-add" disabled={!firstName.trim() || !lastName.trim()} onClick={() => {
        if (!firstName.trim() || !lastName.trim()) return;
        onAdd({
          day,
          firstName,
          lastName,
          party,
          time,
          area,
          occasion,
          countryCode,
          phoneNumber,
          request,
          source: 'Host entry'
        });
        onClose();
      }}><Plus size={16} />Add to service</button></section></div>;
}
function ConfirmCancel({
  booking,
  onClose,
  onConfirm
}) {
  return <div className="rv-overlay" role="presentation" onClick={onClose}><section className="rv-confirm" role="alertdialog" aria-modal="true" aria-labelledby="rv-cancel-title" onClick={event => event.stopPropagation()}><span><X size={19} /></span><h2 id="rv-cancel-title">Cancel this reservation?</h2><p>{booking.guest} will be removed from the active service list. A connected account would notify the guest on WhatsApp.</p><div><button type="button" onClick={onClose}>Keep reservation</button><button type="button" onClick={onConfirm}><Trash2 size={16} />Cancel reservation</button></div></section></div>;
}
function LegacyReservationsExperience({
  dark = false,
  setDark = () => {},
  onOpenHostTest = () => {}
}) {
  const initial = useMemo(() => readReservationPreview(), []),
    menuBook = useMemo(() => readMenuBook().data, []),
    menu = menuBook.menus.find(item => item.id === menuBook.activeMenuId) || menuBook.menus[0],
    [data, setData] = useState(initial.data),
    [day, setDay] = useState(RESERVATION_DAYS[0].id),
    [tab, setTab] = useState('service'),
    [filter, setFilter] = useState('all'),
    [selectedId, setSelectedId] = useState(initial.data.bookings.find(booking => booking.day === RESERVATION_DAYS[0].id)?.id || ''),
    [shareOpen, setShareOpen] = useState(false),
    [newOpen, setNewOpen] = useState(false),
    [cancelBooking, setCancelBooking] = useState(null),
    [notice, setNotice] = useState(''),
    [storageError, setStorageError] = useState(initial.error);
  const dayBookings = data.bookings.filter(booking => booking.day === day && booking.status !== 'cancelled').sort((a, b) => a.time.localeCompare(b.time)),
    shown = filter === 'all' ? dayBookings : dayBookings.filter(booking => booking.status === filter),
    selected = data.bookings.find(booking => booking.id === selectedId) || dayBookings[0],
    summary = reservationSummary(data.bookings, day);
  useEffect(() => {
    if (!dayBookings.some(booking => booking.id === selectedId)) setSelectedId(dayBookings[0]?.id || '');
  }, [day]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 2600);
    return () => clearTimeout(timer);
  }, [notice]);
  function status(id, next) {
    setData(current => ({
      ...current,
      bookings: setReservationStatus(current.bookings, id, next)
    }));
    setNotice(next === 'confirmed' ? 'Reservation confirmed.' : next === 'seated' ? 'Guests seated.' : 'Visit completed.');
  }
  function assign(id, tableId) {
    setData(current => ({
      ...current,
      bookings: assignReservationTable(current.bookings, id, tableId, current.tables)
    }));
    setNotice(tableId ? 'Table assigned.' : 'Table cleared.');
  }
  function add(input) {
    setData(current => addPreviewReservation(current, input));
    setDay(input.day);
    setTab('service');
    setNotice(data.settings.whatsappConfirmation && input.phoneNumber ? 'Reservation added and WhatsApp confirmation prepared.' : 'Reservation added to the service line.');
  }
  function save() {
    const result = saveReservationPreview(data);
    if (result.ok) {
      setData(result.data);
      setStorageError('');
      setNotice('Reservation workspace saved in this browser.');
    } else setStorageError(result.error);
  }
  const selectedDay = RESERVATION_DAYS.find(item => item.id === day);
  return <main className="tw-reservations" data-reservation-theme={dark ? 'dark' : 'light'}><div className="rv-preview-line"><span>Reservations preview · Sample service · No guest is contacted</span><div className="rv-preview-actions"><button type="button" className="tw-host-test-launch" onClick={onOpenHostTest}><ShieldCheck size={16} />Host Test</button><button type="button" onClick={() => setDark(!dark)} aria-label={dark ? 'Use light Reservations theme' : 'Use dark Reservations theme'}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button></div></div><header className="rv-heading"><div><span><img src="/logo-transparent.png" width="22" height="22" alt="" />Marina Social Club / Reservations</span><h1>Tonight,<br />beautifully handled.</h1><p>One calm view for every arrival, table, guest note, and last-minute change.</p></div><nav><button type="button" onClick={() => setNewOpen(true)}><Plus size={17} />Add reservation</button><button type="button" onClick={() => setShareOpen(value => !value)}><Link2 size={17} />Link and QR</button><button type="button" className="rv-save" onClick={save}><Save size={17} />Save</button></nav></header>{shareOpen && <ReservationShare onClose={() => setShareOpen(false)} />} {storageError && <p className="rv-error" role="alert">{storageError}</p>}<div className="rv-toast" role="status">{notice}</div><DayRibbon day={day} setDay={setDay} data={data} /><section className="rv-pulse"><span><i />{data.settings.enabled ? 'Bookings open' : 'Bookings paused'}</span><div><strong>{summary.covers}</strong><small>covers</small></div><div><strong>{summary.bookings}</strong><small>bookings</small></div><div><strong>{summary.seated}</strong><small>at table</small></div><div data-attention={summary.pending > 0 ? 'true' : 'false'}><strong>{summary.pending + summary.waitlist}</strong><small>need attention</small></div></section><nav className="rv-tabs" aria-label="Reservations workspace">{[['service', CalendarDays, 'Service'], ['floor', Table2, 'Floor'], ['guest', Eye, 'Guest booking'], ['settings', Settings2, 'Settings']].map(([key, Icon, label]) => <button type="button" key={key} aria-pressed={tab === key} onClick={() => setTab(key)}><Icon size={17} />{label}</button>)}</nav>{tab === 'service' && <><ServiceTimeline bookings={dayBookings} selectedId={selectedId} onSelect={setSelectedId} /><section className="rv-service"><div className="rv-list"><header><div><span>{selectedDay?.label} · {selectedDay?.day} {selectedDay?.month}</span><h2>Arrival book</h2></div><label><ListFilter size={16} /><select aria-label="Filter reservations" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All reservations</option><option value="pending">Needs reply</option><option value="confirmed">Confirmed</option><option value="seated">At table</option><option value="waitlist">Waitlist</option></select></label></header>{shown.length ? shown.map(booking => <BookingCard key={booking.id} booking={booking} selected={selected?.id === booking.id} onSelect={() => setSelectedId(booking.id)} />) : <p className="rv-empty"><CalendarDays size={22} /><strong>No reservations here</strong><span>Choose another filter or add a booking.</span></p>}</div><BookingDetail booking={selected} tables={data.tables} onStatus={status} onAssign={assign} onCancel={setCancelBooking} /></section></>}{tab === 'floor' && <HostFloor data={data} setData={setData} day={day} selectedId={selectedId} onSelect={setSelectedId} onNotice={setNotice} onAddWalkIn={() => setNewOpen(true)} />} {tab === 'guest' && <GuestBooking data={data} setData={setData} onNotice={setNotice} menu={menu} />} {tab === 'settings' && <ReservationSettings data={data} setData={setData} onSave={save} />}<section className="rv-concierge"><Bot size={24} /><div><span>One host across every channel</span><h2>The Concierge knows the room.</h2><p>It can show the menu, answer availability, collect party details, confirm simple changes, and hand special requests to the team.</p></div><a href="?page=concierge&occasions=editorial">Open AI Concierge<ArrowRight size={16} /></a></section><footer className="rv-foot"><span><MapPin size={14} />Marina Social Club · Waterfront dining</span><span><UtensilsCrossed size={14} />Dine-in and pickup menus stay distinct</span><span><UserRound size={14} />Guest history follows every reservation</span></footer>{newOpen && <NewReservationModal day={day} onClose={() => setNewOpen(false)} onAdd={add} />} {cancelBooking && <ConfirmCancel booking={cancelBooking} onClose={() => setCancelBooking(null)} onConfirm={() => {
      status(cancelBooking.id, 'cancelled');
      setCancelBooking(null);
      setNotice('Reservation cancelled in this preview.');
    }} />}</main>;
}
