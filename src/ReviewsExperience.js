import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight, BarChart3, Check, CheckCircle2, ChevronRight, Copy, Eye,
  HeartHandshake, Inbox, Link2, MessageCircle, QrCode, Settings2,
  ShieldCheck, Star, TrendingUp, WandSparkles, X,
} from 'lucide-react';
import { FaGoogle, FaWhatsapp } from 'react-icons/fa';
import QRCode from 'qrcode';
import {
  readReviewsPreview, reviewsSummary, saveReviewsPreview, updateReviewItem,
  updateReviewSettings, updateReviewTouchpoints,
} from './reviewsPreviewModel';
import './reviews-experience.css';

const TABS = [
  { id: 'pulse', label: 'Overview', Icon: BarChart3 },
  { id: 'inbox', label: 'Review inbox', Icon: Inbox },
  { id: 'request', label: 'Request reviews', Icon: QrCode },
  { id: 'settings', label: 'Settings', Icon: Settings2 },
];

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'care', label: 'Needs care' },
  { id: 'unanswered', label: 'Needs reply' },
  { id: 'direct', label: 'Direct' },
  { id: 'google', label: 'Google' },
];

const SIGNALS = [
  { label: 'Quality', value: 92 }, { label: 'Service', value: 88 },
  { label: 'Value', value: 81 }, { label: 'Speed', value: 67 },
];

function Stars({ value, size = 15 }) {
  return <span className="re-stars" aria-label={`${value} out of 5 stars`}>{[1, 2, 3, 4, 5].map(star => <Star aria-hidden="true" key={star} size={size} fill={star <= value ? 'currentColor' : 'none'} />)}</span>;
}

function Source({ source }) {
  const google = source === 'google';
  return <span className="re-source" data-source={source}>{google ? <FaGoogle aria-hidden="true" /> : <MessageCircle aria-hidden="true" size={13} />}{google ? 'Google' : 'Direct'}</span>;
}

function ReviewRow({ review, selected, onSelect, compact = false }) {
  return <button type="button" data-review-id={review.id} className={`re-review-row${compact ? ' is-compact' : ''}`} aria-pressed={selected} onClick={onSelect}>
    <span className="re-avatar" aria-hidden="true">{review.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span>
    <span className="re-review-copy"><span><strong>{review.name}</strong><time>{review.when}</time></span><Stars value={review.rating} size={11} /><small>{review.comment}</small>{!compact && <span className="re-tags">{review.tags.map(tag => <i key={tag}>{tag}</i>)}</span>}</span>
    <span className="re-row-side"><Source source={review.source} /><i data-status={review.status}>{review.status === 'needs-care' ? 'Needs care' : review.status === 'unanswered' ? 'Reply' : review.status === 'draft' ? 'Draft' : 'Replied'}</i><ChevronRight aria-hidden="true" size={17} /></span>
  </button>;
}

function ReplyStudio({ review, onChange, notify, open, onClose }) {
  if (!review) return <aside className={`re-reply re-reply-empty${open ? ' is-mobile-open' : ''}`}><HeartHandshake aria-hidden="true" size={32} /><h3>Choose a review.</h3><p>The review, context, and response tools will open here.</p></aside>;
  const direct = review.source === 'direct';
  const firstName = review.name.split(' ')[0];
  const draft = () => {
    const reply = review.rating <= 3
      ? `Thank you for sharing this, ${firstName}. We are sorry the experience missed the mark. We are reviewing the details and would value a chance to make it right.`
      : `Thank you, ${firstName}. We are glad your experience stood out${review.tags[0] ? `, especially the ${review.tags[0]}` : ''}. We appreciate you taking the time to tell us.`;
    onChange({ reply, status: 'draft' });
    notify('A draft is ready for you to review.');
  };
  return <aside className={`re-reply${open ? ' is-mobile-open' : ''}`} aria-label="Review response">
    <button type="button" className="re-mobile-close" onClick={onClose}><X aria-hidden="true" size={16} />Close response</button>
    <header><div><Source source={review.source} /><Stars value={review.rating} size={14} /></div><span data-tone={review.rating <= 3 ? 'care' : 'public'}>{review.rating <= 3 ? 'Needs thoughtful care' : direct ? 'Direct response' : 'Public response'}</span></header>
    <div className="re-quote"><span aria-hidden="true">“</span><p>{review.comment}</p><small>{review.name} · {review.when}</small></div>
    {review.rating <= 3 && <div className="re-care-note"><HeartHandshake aria-hidden="true" size={17} /><span><strong>Respond to the detail.</strong><small>Acknowledge what happened and give a clear next step.</small></span></div>}
    <label htmlFor={`review-response-${review.id}`}>Response<textarea id={`review-response-${review.id}`} rows="5" value={review.reply} onChange={event => onChange({ reply: event.target.value, status: event.target.value ? 'draft' : review.status })} placeholder="Write a clear, specific response…" /></label>
    <div className="re-reply-actions"><button type="button" onClick={draft}><WandSparkles aria-hidden="true" size={16} />Suggest a reply</button><button type="button" disabled={!review.reply.trim()} onClick={() => { onChange({ status: 'replied' }); notify(direct ? 'Marked as followed up.' : 'Response marked ready. Nothing was posted from this preview.'); }}><CheckCircle2 aria-hidden="true" size={16} />{direct ? 'Mark followed up' : 'Mark ready'}</button></div>
    {direct && review.phone && <a className="re-whatsapp" href={`https://wa.me/${review.phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" />Continue on WhatsApp</a>}
    <small className="re-safety"><ShieldCheck aria-hidden="true" size={14} />You review every response before it is sent.</small>
  </aside>;
}

function Pulse({ data, summary, onInbox, onRequest }) {
  const attention = data.reviews.filter(review => review.status === 'needs-care' || review.status === 'unanswered').slice(0, 3);
  return <>
    <section className="re-pulse-grid">
      <article className="re-score-card">
        <header><span>Reputation now</span><small><TrendingUp aria-hidden="true" size={14} />0.3 this month</small></header>
        <div className="re-score-main"><div><strong>{summary.average.toFixed(1)}</strong><Stars value={Math.round(summary.average)} size={17} /><small>{summary.count} recent reviews</small></div><div className="re-distribution">{summary.distribution.map(item => { const pct = summary.count ? Math.round((item.count / summary.count) * 100) : 0; return <div key={item.rating}><span>{item.rating}<Star aria-hidden="true" size={10} fill="currentColor" /></span><i><b style={{ width: `${pct}%` }} /></i><small>{item.count}</small></div>; })}</div></div>
        <div className="re-stat-strip"><div><span>Would recommend</span><strong>{summary.recommendation}%</strong></div><div><span>Needs reply</span><strong>{summary.needsReply}</strong></div><div><span>Response rate</span><strong>{summary.responseRate}%</strong></div></div>
      </article>
      <article className="re-attention-card">
        <header><div><span>Needs attention</span><h2>{summary.needsReply} conversations waiting</h2></div><button type="button" onClick={onInbox}>Open inbox <ArrowRight aria-hidden="true" size={15} /></button></header>
        <div>{attention.map(review => <ReviewRow key={review.id} review={review} compact onSelect={onInbox} />)}</div>
      </article>
    </section>
    <section className="re-insight-grid">
      <article className="re-signal-card"><header><div><span>Customer signals</span><h2>What people notice most</h2></div><BarChart3 aria-hidden="true" size={20} /></header><div>{SIGNALS.map(signal => <div key={signal.label}><span>{signal.label}</span><i><b style={{ width: `${signal.value}%` }} /></i><strong>{signal.value}%</strong></div>)}</div></article>
      <article className="re-guidance-card"><span>Opportunity this week</span><h2>Speed is the only signal slipping.</h2><p>Two recent reviews mention a slower handoff. Check the journey—from purchase or booking to completion—and give the team one clear improvement to test.</p><button type="button" onClick={onInbox}>Review the feedback <ArrowRight aria-hidden="true" size={15} /></button></article>
      <article className="re-request-card"><span>Keep feedback flowing</span><h2>Share one link everywhere.</h2><p>Use the same fair review journey after a purchase, booking, visit, delivery, or completed service.</p><button type="button" onClick={onRequest}><QrCode aria-hidden="true" size={16} />Open link & QR</button></article>
    </section>
  </>;
}

function InboxView({ data, setData, notify }) {
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(data.reviews[0]?.id || '');
  const [replyOpen, setReplyOpen] = useState(false);
  const filtered = useMemo(() => data.reviews.filter(review => filter === 'all' || (filter === 'care' && review.rating <= 3 && review.status !== 'replied') || (filter === 'unanswered' && review.status !== 'replied') || review.source === filter), [data.reviews, filter]);
  const selected = filtered.find(review => review.id === selectedId) || filtered[0] || null;
  const patch = update => selected && setData(current => updateReviewItem(current, selected.id, update));
  const closeReply = () => { setReplyOpen(false); window.requestAnimationFrame(() => document.querySelector(`[data-review-id="${selected?.id}"]`)?.focus()); };
  useEffect(() => { if (!replyOpen) return undefined; const close = event => event.key === 'Escape' && closeReply(); window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); });
  const selectReview = id => { setSelectedId(id); setReplyOpen(true); if (window.matchMedia('(max-width: 760px)').matches) window.requestAnimationFrame(() => document.querySelector('.re-mobile-portal .re-mobile-close')?.focus()); };
  const mobileReply = replyOpen && typeof document !== 'undefined' ? createPortal(<div className="re-mobile-portal"><button type="button" className="re-mobile-scrim" aria-label="Close response panel" onClick={closeReply} /><ReplyStudio review={selected} onChange={patch} notify={notify} open onClose={closeReply} /></div>, document.body) : null;
  return <section className="re-work-view"><header className="re-section-head"><div><span>Reply workspace</span><h2>Every review gets a clear next step.</h2><p>Read the context, respond, and keep follow-up visible.</p></div><small><ShieldCheck aria-hidden="true" size={14} />Nothing sends automatically</small></header><div className="re-filter-bar" role="group" aria-label="Review filters">{FILTERS.map(item => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setReplyOpen(false); }}>{item.label}</button>)}</div><div className="re-inbox-shell"><div className="re-review-list">{filtered.map(review => <ReviewRow key={review.id} review={review} selected={review.id === selected?.id} onSelect={() => selectReview(review.id)} />)}{!filtered.length && <p className="re-empty">No reviews match this view.</p>}</div><ReplyStudio review={selected} onChange={patch} notify={notify} open={false} onClose={closeReply} /></div>{mobileReply}</section>;
}

function RequestReviews({ data, setData, qr, copied, onCopy, onCustomer }) {
  const origin = typeof window === 'undefined' ? 'https://tawaslo.com' : window.location.origin;
  const url = `${origin}/review/${data.share.slug}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`We would value your feedback on Marina Social Club: ${url}`)}`;
  const touchpoints = [
    ['pointOfSaleQr', 'At checkout', 'Place the QR where the purchase or service finishes'],
    ['receiptQr', 'Receipt or invoice', 'Add the link to digital and printed receipts'],
    ['completedJourney', 'After completion', 'Follow up after an order, booking, visit, or service'],
    ['loyaltyReward', 'After a loyalty moment', 'Ask after a reward or meaningful return'],
  ];
  return <section className="re-work-view"><header className="re-section-head"><div><span>Review requests</span><h2>One link, ready for every customer journey.</h2><p>Use it online, in-store, after a service, or wherever the experience ends.</p></div><button type="button" onClick={onCustomer}><Eye aria-hidden="true" size={16} />Customer view</button></header><div className="re-request-grid"><article className="re-share-card"><div className="re-qr-art"><span>MARINA<br />SOCIAL CLUB</span>{qr ? <img src={qr} alt="Customer review QR code" /> : <QrCode aria-hidden="true" size={128} />}<small>SCAN TO SHARE FEEDBACK</small></div><div><span>Shareable review link</span><h3>Ready wherever customers meet your brand.</h3><p>{url}</p><div><button type="button" onClick={onCopy}><Copy aria-hidden="true" size={16} />{copied ? 'Copied' : 'Copy link'}</button><a href={wa} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" />Share to WhatsApp</a></div><small><ShieldCheck aria-hidden="true" size={14} />Every rating follows the same optional public-review path.</small></div></article><aside className="re-touchpoints"><span>Touchpoints</span><h3>Choose where the invitation appears.</h3>{touchpoints.map(([key, title, note]) => <button type="button" key={key} aria-pressed={data.touchpoints[key]} onClick={() => setData(current => updateReviewTouchpoints(current, { [key]: !current.touchpoints[key] }))}><span><strong>{title}</strong><small>{note}</small></span><i aria-hidden="true"><b /></i></button>)}</aside></div></section>;
}

function SettingsView({ data, setData }) {
  const patch = update => setData(current => updateReviewSettings(current, update));
  const settings = data.settings;
  return <section className="re-work-view"><header className="re-section-head"><div><span>Review journey</span><h2>A fair, brand-ready feedback flow.</h2><p>Shape the message once, then use it across every location and touchpoint.</p></div></header><div className="re-settings-grid"><div><section><span>Customer message</span><h3>The first thing people see</h3><label htmlFor="re-headline">Prompt headline<input id="re-headline" value={settings.headline} onChange={event => patch({ headline: event.target.value })} /></label><label htmlFor="re-private-prompt">Feedback prompt<textarea id="re-private-prompt" rows="3" value={settings.privatePrompt} onChange={event => patch({ privatePrompt: event.target.value })} /></label></section><section><span>Public review destination</span><h3>Where customers can continue</h3><label htmlFor="re-google-url">Google review link<input id="re-google-url" type="url" value={settings.googleUrl} onChange={event => patch({ googleUrl: event.target.value })} /></label><p><ShieldCheck aria-hidden="true" size={15} />The public-review option is offered consistently, regardless of rating.</p></section></div><aside><span>Journey status</span><h3>{settings.enabled ? 'Your review journey is active.' : 'The journey is paused.'}</h3><p>Nothing is posted automatically. Customers always choose whether to leave feedback or continue to Google.</p><button type="button" aria-pressed={settings.enabled} onClick={() => patch({ enabled: !settings.enabled })}><span><strong>{settings.enabled ? 'Review journey on' : 'Review journey off'}</strong><small>{settings.enabled ? 'The link and QR are available' : 'The link shows a paused message'}</small></span><i aria-hidden="true"><b /></i></button><button type="button" aria-pressed={settings.followupOn} onClick={() => patch({ followupOn: !settings.followupOn })}><span><strong>Follow up after completion</strong><small>Works after purchases, bookings, visits, and services</small></span><i aria-hidden="true"><b /></i></button></aside></div></section>;
}

function CustomerReview({ data, onClose }) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [phase, setPhase] = useState('rate');
  useEffect(() => { const close = event => event.key === 'Escape' && onClose(); window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [onClose]);
  return <div className="re-overlay" role="presentation" onClick={onClose}><section className="re-customer" role="dialog" aria-modal="true" aria-labelledby="re-customer-title" onClick={event => event.stopPropagation()}><button type="button" autoFocus className="re-close" aria-label="Close customer review preview" onClick={onClose}><X aria-hidden="true" size={19} /></button><header><span>MSC</span><small>Marina Social Club</small></header>{phase === 'rate' && <div className="re-customer-step"><span>A note from Marina</span><h2 id="re-customer-title">{data.settings.headline}</h2><p>Your feedback helps our team improve the experience.</p><div className="re-star-pick" aria-label="Choose a rating">{[1, 2, 3, 4, 5].map(value => <button type="button" key={value} aria-label={`${value} star${value > 1 ? 's' : ''}`} onClick={() => { setRating(value); setPhase('feedback'); }}><Star aria-hidden="true" size={28} /></button>)}</div><small>Your feedback goes directly to the business.</small></div>}{phase === 'feedback' && <div className="re-customer-step"><HeartHandshake aria-hidden="true" size={29} /><span>Thank you for rating us</span><h2 id="re-customer-title">What should the team know?</h2><p>{data.settings.privatePrompt}</p><label htmlFor="re-customer-note">Your feedback<textarea id="re-customer-note" rows="5" value={note} onChange={event => setNote(event.target.value)} placeholder="Tell us what stood out or what could be better." /></label><button type="button" className="re-customer-primary" onClick={() => setPhase('share')}>Send feedback <ArrowRight aria-hidden="true" size={16} /></button><small>{rating} stars · This step is shared directly with Marina.</small></div>}{phase === 'share' && <div className="re-customer-step re-customer-done"><CheckCircle2 aria-hidden="true" size={43} /><span>Feedback received</span><h2 id="re-customer-title">Thank you for helping us improve.</h2><p>If you would like, you can also share your experience publicly. This option is the same for every rating.</p><a className="re-customer-primary" href={data.settings.googleUrl} target="_blank" rel="noreferrer"><FaGoogle aria-hidden="true" />Continue to Google</a><button type="button" className="re-customer-secondary" onClick={onClose}>Done</button></div>}<footer>Made with Tawaslo</footer></section></div>;
}

export default function ReviewsExperience({ dark }) {
  const [data, setData] = useState(() => readReviewsPreview());
  const [tab, setTab] = useState('pulse');
  const [customerOpen, setCustomerOpen] = useState(false);
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const summary = useMemo(() => reviewsSummary(data), [data]);
  useEffect(() => { if (data.version === 4) saveReviewsPreview(data); }, [data]);
  useEffect(() => { const scrollArea = document.querySelector('.tw-scroll-area'); if (scrollArea) scrollArea.scrollTop = 0; }, [tab]);
  useEffect(() => { const origin = typeof window === 'undefined' ? 'https://tawaslo.com' : window.location.origin; QRCode.toDataURL(`${origin}/review/${data.share.slug}`, { width: 320, margin: 1, color: { dark: '#15162b', light: '#fffdf8' } }).then(setQr).catch(() => setQr('')); }, [data.share.slug]);
  const notify = message => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const copy = async () => { const origin = typeof window === 'undefined' ? 'https://tawaslo.com' : window.location.origin; try { await navigator.clipboard.writeText(`${origin}/review/${data.share.slug}`); } catch (_) {} setCopied(true); window.setTimeout(() => setCopied(false), 1500); };
  return <main className="tw-reviews" data-theme={dark ? 'dark' : 'light'}>
    <header className="re-page-head"><div><span><Star aria-hidden="true" size={15} />Marina Social Club / Reviews</span><h1>Every review, handled.</h1><p>See the signal, respond with care, and build trust across every customer journey.</p></div><div><button type="button" onClick={() => setCustomerOpen(true)}><Eye aria-hidden="true" size={16} />Customer view</button><button type="button" onClick={() => setTab('request')}><Link2 aria-hidden="true" size={16} />Link & QR</button></div></header>
    <nav className="re-tabs" aria-label="Reviews workspace">{TABS.map(item => <button type="button" key={item.id} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}><item.Icon aria-hidden="true" size={17} />{item.label}{item.id === 'inbox' && summary.needsReply ? <b>{summary.needsReply}</b> : null}</button>)}</nav>
    {tab === 'pulse' && <Pulse data={data} summary={summary} onInbox={() => setTab('inbox')} onRequest={() => setTab('request')} />}
    {tab === 'inbox' && <InboxView data={data} setData={setData} notify={notify} />}
    {tab === 'request' && <RequestReviews data={data} setData={setData} qr={qr} copied={copied} onCopy={copy} onCustomer={() => setCustomerOpen(true)} />}
    {tab === 'settings' && <SettingsView data={data} setData={setData} />}
    <footer className="re-foot"><span><Check aria-hidden="true" size={14} />Sample changes save on this device</span><span>No review or response is sent from this preview</span></footer>
    {customerOpen && <CustomerReview data={data} onClose={() => setCustomerOpen(false)} />}
    {toast && <div className="re-toast" role="status" aria-live="polite">{toast}</div>}
  </main>;
}
