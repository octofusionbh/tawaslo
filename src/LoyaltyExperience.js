import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, ArrowRight, Award, BookOpen, CakeSlice, Camera, Check, CheckCircle2,
  CircleDollarSign, Coffee, Copy, Dumbbell, Eye, Flower2, Gem, Gift, Globe2, Heart,
  Link2, LockKeyhole, Moon, Music2, Palette, PawPrint, QrCode, ScanLine, Scissors,
  Search, ShieldCheck, ShoppingBag, Smartphone, Star, Sun, TicketCheck, UserPlus,
  UsersRound, UtensilsCrossed, WalletCards, X, Zap,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import QRCode from 'qrcode';
import {
  LOYALTY_FILTERS, addLoyaltyMember, findLoyaltyMember, loyaltySummary, readLoyaltyPreview,
  recordLoyaltyVisit, redeemLoyaltyReward, rewardGoal, rewardProgress,
  rewardValue, saveLoyaltyPreview, updateLoyaltyProgram,
} from './loyaltyPreviewModel';
import './loyalty-experience.css';
import './loyalty-agency.css';

const TABS = [
  { id: 'overview', label: 'Overview', Icon: Award },
  { id: 'members', label: 'Customers', Icon: UsersRound },
  { id: 'design', label: 'Design & rules', Icon: Palette },
];

const BRAND_COLORS = ['#245f55', '#c94d3f', '#7b5262', '#365f87', '#725fb6', '#bd7b27', '#292a2d'];
const ACCENT_COLORS = ['#f0b94f', '#ff8072', '#48dfba', '#9b8cff', '#f3d6a1', '#f08f38', '#e8e8f2'];
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const STAMP_SYMBOLS = [
  { id: 'star', label: 'Star', Icon: Star },
  { id: 'heart', label: 'Heart', Icon: Heart },
  { id: 'gift', label: 'Gift', Icon: Gift },
  { id: 'award', label: 'Award', Icon: Award },
  { id: 'ticket', label: 'Ticket', Icon: TicketCheck },
  { id: 'coffee', label: 'Coffee', Icon: Coffee },
  { id: 'dining', label: 'Dining', Icon: UtensilsCrossed },
  { id: 'cake', label: 'Treat', Icon: CakeSlice },
  { id: 'shopping', label: 'Shopping', Icon: ShoppingBag },
  { id: 'gem', label: 'Premium', Icon: Gem },
  { id: 'flower', label: 'Wellness', Icon: Flower2 },
  { id: 'scissors', label: 'Salon', Icon: Scissors },
  { id: 'fitness', label: 'Fitness', Icon: Dumbbell },
  { id: 'pet', label: 'Pet care', Icon: PawPrint },
  { id: 'book', label: 'Learning', Icon: BookOpen },
  { id: 'camera', label: 'Creative', Icon: Camera },
  { id: 'music', label: 'Music', Icon: Music2 },
  { id: 'bolt', label: 'Energy', Icon: Zap },
];
const EARN_ACTIONS = [
  { id: 'visit', label: 'Visit', plural: 'visits', record: 'Record this visit' },
  { id: 'purchase', label: 'Purchase', plural: 'purchases', record: 'Record this purchase' },
  { id: 'order', label: 'Order', plural: 'orders', record: 'Record this order' },
  { id: 'booking', label: 'Booking', plural: 'bookings', record: 'Record this booking' },
];
const BUSINESS_TYPES = [
  { id: 'food_drink', label: 'Food & drink' },
  { id: 'fashion', label: 'Fashion & apparel' },
  { id: 'retail', label: 'Retail & products' },
  { id: 'beauty_wellness', label: 'Beauty & wellness' },
  { id: 'services', label: 'Services & appointments' },
  { id: 'fitness', label: 'Fitness & memberships' },
  { id: 'education', label: 'Education & classes' },
  { id: 'other', label: 'Other business' },
];

const earnAction = program => EARN_ACTIONS.find(item => item.id === program.earnAction) || EARN_ACTIONS[0];
const earnUnit = (program, count) => count === 1 ? earnAction(program).label.toLowerCase() : earnAction(program).plural;
const safeGuestUrl = value => /^https:\/\/[^\s]+$/i.test(String(value || '').trim()) ? String(value).trim() : '#';

const memberCopy = program => program.guestLanguage === 'ar' ? {
  club: 'نادي العودة', reward: 'مكافأتك', journey: 'رحلة المكافأة', ready: 'مكافأتك جاهزة.',
  points: 'نقاط متبقية', one: 'زيارة واحدة متبقية', many: 'زيارات متبقية', since: 'عضو منذ', card: 'البطاقة',
} : {
  club: program.programName || 'Return club', reward: 'Reward in view', journey: 'Your return journey', ready: 'Your reward is ready.',
  points: 'points to your next reward', one: 'visit to your next reward', many: 'visits to your next reward', since: 'Member since', card: 'Card',
};

function StampMark({ filled, icon }) {
  const Icon = STAMP_SYMBOLS.find(item => item.id === icon)?.Icon || Star;
  return <span className="ly-stamp" data-filled={filled}><Icon size={14} /></span>;
}

function ColorControl({ label, value, presets, onChange }) {
  const [draft, setDraft] = useState(value.toUpperCase());
  const [touched, setTouched] = useState(false);
  useEffect(() => { setDraft(value.toUpperCase()); setTouched(false); }, [value]);
  const updateDraft = next => {
    const formatted = `#${next.replace(/#/g, '')}`.slice(0, 7).toUpperCase();
    setDraft(formatted); setTouched(true);
    if (HEX_COLOR.test(formatted)) onChange(formatted.toLowerCase());
  };
  const invalid = touched && !HEX_COLOR.test(draft);
  const helpId = `${label.toLowerCase().replace(/\s+/g, '-')}-hex-help`;
  return <fieldset className="ly-color-control">
    <legend>{label}</legend>
    <div className="ly-colors">{presets.map(color => <button type="button" key={color} aria-label={`Use ${color} for ${label.toLowerCase()}`} aria-pressed={value.toLowerCase() === color.toLowerCase()} style={{ background: color }} onClick={() => onChange(color)} />)}</div>
    <div className="ly-hex-row"><input aria-label={`Open ${label.toLowerCase()} picker`} type="color" value={value} onChange={event => onChange(event.target.value)} /><label>HEX<input aria-label={`${label} HEX value`} aria-invalid={invalid} aria-describedby={helpId} value={draft} onBlur={() => setTouched(true)} onChange={event => updateDraft(event.target.value)} inputMode="text" maxLength="7" spellCheck="false" /></label><span className="ly-color-sample" style={{ background: value }} aria-hidden="true" /></div>
    <small id={helpId} data-error={invalid}>{invalid ? 'Use a six-digit HEX value, for example #245F55.' : 'Choose visually or paste your exact brand HEX.'}</small>
  </fieldset>;
}

function MemberCard({ data, member, compact = false }) {
  const { program } = data;
  const copy = memberCopy(program);
  const value = rewardValue(program, member);
  const goal = rewardGoal(program);
  const count = program.type === 'stamps' ? Math.min(program.stampGoal, 12) : 8;
  const filled = program.type === 'stamps'
    ? Math.min(value, count)
    : Math.min(count, Math.round((value / goal) * count));
  const remaining = Math.max(0, goal - value);
  return <article className="ly-member-card" dir={program.guestLanguage === 'ar' ? 'rtl' : 'ltr'} data-theme={program.cardTheme} data-compact={compact} style={{ '--ly-brand': program.brandColor, '--ly-accent': program.accentColor }}>
    <div className="ly-card-art" aria-hidden="true"><i /><i /><i /><i /></div>
    <span className="ly-card-serial" aria-hidden="true">MSC · MEMBER PASS · 2025</span>
    <header>
      <div className="ly-card-lockup"><span>M</span><p><strong>Marina</strong><small>Social Club</small></p></div>
      <span className="ly-card-kind"><i />{copy.club}</span>
    </header>
    <div className="ly-card-copy"><small>{copy.reward}</small><h3>{program.reward}</h3><p>{compact ? member.name.split(' ')[0] : member.name}</p></div>
    <section className="ly-card-journey">
      <div><span>{copy.journey}</span><strong>{value}<small>/ {goal}</small></strong></div>
      <div className="ly-stamps" aria-label={`${value} of ${goal}`}>
        {Array.from({ length: count }, (_, index) => <StampMark key={index} icon={program.stampIcon} filled={index < filled} />)}
      </div>
      <p>{remaining === 0 ? copy.ready : `${remaining} ${program.type === 'points' ? copy.points : earnUnit(program, remaining)} to your next reward`}</p>
    </section>
    <footer><span><small>{copy.since}</small><b>2025</b></span><span><small>{copy.card}</small><b>{member.code}</b></span><WalletCards size={20} /></footer>
  </article>;
}

function Progress({ data, member }) {
  const progress = rewardProgress(data.program, member);
  return <span className="ly-progress" aria-label={`${progress}% toward reward`}><i style={{ width: `${progress}%` }} /></span>;
}

function SharePanel({ data, qr, onClose, onCopy, copied }) {
  const origin = typeof window === 'undefined' ? 'https://tawaslo.com' : window.location.origin;
  const url = `${origin}/loyalty/${data.share.slug}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`Marina Social Club - your loyalty card: ${url}`)}`;
  return createPortal(<div className="ly-overlay" role="presentation" onClick={onClose}>
    <section className="ly-share" role="dialog" aria-modal="true" aria-labelledby="ly-share-title" onClick={event => event.stopPropagation()}>
      <button type="button" className="ly-close" aria-label="Close share card" onClick={onClose}><X size={19} /></button>
      <span>Customer card</span><h2 id="ly-share-title">One link. Every return.</h2>
      <p>Place the QR at checkout, on a receipt, or share the card directly with a customer anywhere in the world.</p>
      <div className="ly-share-body">
        <figure>{qr ? <img src={qr} alt="Loyalty card QR code" /> : <QrCode size={90} />}<figcaption>Marina Social Club<br /><small>Scan to join</small></figcaption></figure>
        <div><label>Customer loyalty link<input readOnly value={url} /></label>
          <div className="ly-share-actions">
            <button type="button" onClick={onCopy}><Copy size={16} />{copied ? 'Copied' : 'Copy link'}</button>
            <a href={wa} target="_blank" rel="noreferrer"><FaWhatsapp />Share to WhatsApp</a>
            {qr && <a href={qr} download="marina-loyalty-qr.png"><QrCode size={16} />Download QR</a>}
          </div>
        </div>
      </div>
    </section>
  </div>, document.body);
}

function GuestPreview({ data, member, onClose }) {
  const arabic = data.program.guestLanguage === 'ar';
  const [stage, setStage] = useState('welcome');
  const [path, setPath] = useState('join');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [terms, setTerms] = useState(false);
  const [updates, setUpdates] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const phoneValid = /^\+?[\d\s()-]{7,}$/.test(phone.trim());
  const guestUrl = safeGuestUrl(data.program.guestActionUrl);
  const joining = stage === 'join';
  const previewMember = path === 'join'
    ? { ...member, name: firstName.trim() ? `${firstName.trim()} Member` : member.name, phone: phone || member.phone }
    : member;
  const begin = nextPath => {
    setPath(nextPath); setFirstName(''); setPhone(''); setTerms(false); setUpdates(false); setCode(''); setError(''); setStage(nextPath);
  };
  const verify = event => {
    event.preventDefault();
    if (code.replace(/\D/g, '') !== '123456') return setError('That sample code is not correct. Try 123456.');
    setError(''); setStage('card');
  };
  return createPortal(<div className="ly-overlay" role="presentation" onClick={onClose}>
    <section className="ly-guest-preview" data-stage={stage} dir={arabic ? 'rtl' : 'ltr'} role="dialog" aria-modal="true" aria-labelledby="ly-preview-title" onClick={event => event.stopPropagation()}>
      <button type="button" className="ly-close" aria-label="Close customer preview" onClick={onClose}><X size={19} /></button>
      <div className="ly-phone-top"><span>9:41</span><i /></div>
      {stage === 'welcome' && <div className="ly-join-welcome">
        <div className="ly-guest-brand"><span>MSC</span><small>Marina Social Club</small><h2 id="ly-preview-title">A little more to look forward to.</h2><p>Join {data.program.programName} and collect progress with every qualifying {earnAction(data.program).label.toLowerCase()}.</p></div>
        <div className="ly-join-reward"><Gift size={20} /><span><small>Your next reward</small><strong>{data.program.reward}</strong></span><b>{rewardGoal(data.program)} {data.program.type === 'points' ? 'points' : earnUnit(data.program, rewardGoal(data.program))}</b></div>
        {data.program.enabled ? <button type="button" className="ly-guest-book" onClick={() => begin('join')}>Join in under a minute <ArrowRight size={16} /></button> : <div className="ly-paused-notice" role="status"><LockKeyhole size={17} /><span><strong>New memberships are paused.</strong><small>Existing members can still open and redeem their cards.</small></span></div>}
        <button type="button" className="ly-journey-link" onClick={() => begin('returning')}>I already have a card</button>
        <div className="ly-join-trust"><span><Smartphone size={14} />No app</span><span><LockKeyhole size={14} />No password</span><span><ShieldCheck size={14} />Opt out anytime</span></div>
      </div>}
      {(joining || stage === 'returning') && <form className="ly-join-form" onSubmit={event => { event.preventDefault(); setError(''); setStage('verify'); }}>
        <button type="button" className="ly-journey-back" onClick={() => setStage('welcome')}><ArrowLeft size={15} />Back</button>
        <span>{joining ? 'Step 1 of 2 · Join' : 'Welcome back'}</span>
        <h2 id="ly-preview-title">{joining ? 'Where should we keep your card?' : 'Open your saved card.'}</h2>
        <p>{joining ? 'Only the essentials now. You can add optional details later.' : 'Use the international number linked to your loyalty card.'}</p>
        {joining && <label>First name<input autoComplete="given-name" value={firstName} onChange={event => setFirstName(event.target.value)} placeholder="Your first name" /></label>}
        <label>International mobile<input autoComplete="tel" inputMode="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="+000 000 000 000" /><small>Include the country code, for example +973, +971, or +44.</small></label>
        {joining && <div className="ly-consents"><label><input type="checkbox" checked={terms} onChange={event => setTerms(event.target.checked)} /><span>I agree to the loyalty terms and privacy notice.</span></label><label><input type="checkbox" checked={updates} onChange={event => setUpdates(event.target.checked)} /><span>Send me occasional rewards and updates. <b>Optional</b></span></label></div>}
        <button type="submit" className="ly-guest-book" disabled={!phoneValid || (joining && (!firstName.trim() || !terms))}>{joining ? 'Continue securely' : 'Send secure code'} <ArrowRight size={16} /></button>
      </form>}
      {stage === 'verify' && <form className="ly-verify" onSubmit={verify}>
        <button type="button" className="ly-journey-back" onClick={() => { setError(''); setStage(path); }}><ArrowLeft size={15} />Back</button>
        <span>{path === 'join' ? 'Step 2 of 2 · Verify' : 'Secure verification'}</span><LockKeyhole size={27} />
        <h2 id="ly-preview-title">Check your phone.</h2><p>Enter the six-digit code sent to {phone}. In this preview, use <strong>123456</strong>.</p>
        <label>Verification code<input autoFocus autoComplete="one-time-code" inputMode="numeric" maxLength="6" value={code} onChange={event => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} placeholder="000000" /></label>
        {error && <p className="ly-journey-error" role="alert">{error}</p>}
        <button type="submit" className="ly-guest-book" disabled={code.length !== 6}>{path === 'join' ? 'Create my card' : 'Open my card'} <ArrowRight size={16} /></button>
        <button type="button" className="ly-journey-link" onClick={() => setStage('card')}>Use a secure sign-in link instead</button>
      </form>}
      {stage === 'card' && <div className="ly-card-arrival">
        <div className="ly-guest-brand"><span>MSC</span><small>Marina Social Club</small><h2 id="ly-preview-title">{arabic ? `يسعدنا عودتك، ${previewMember.name.split(' ')[0]}.` : path === 'returning' ? `Welcome back, ${previewMember.name.split(' ')[0]}.` : `Your card is ready, ${previewMember.name.split(' ')[0]}.`}</h2></div>
        <MemberCard data={data} member={previewMember} compact />
        <div className="ly-guest-reward"><Gift size={18} /><span><strong>{data.program.reward}</strong><small>{rewardProgress(data.program, previewMember) >= 100 ? (arabic ? 'جاهزة للاستمتاع بها في المرة القادمة.' : 'Ready to enjoy next time.') : (arabic ? `${rewardGoal(data.program) - rewardValue(data.program, previewMember)} زيارات متبقية.` : `${rewardGoal(data.program) - rewardValue(data.program, previewMember)} more ${data.program.type === 'points' ? 'points' : earnUnit(data.program, rewardGoal(data.program) - rewardValue(data.program, previewMember))} to go.`)}</small></span></div>
        <a className="ly-guest-book" href={guestUrl} onClick={event => { if (guestUrl === '#') event.preventDefault(); }} target={guestUrl === '#' ? undefined : '_blank'} rel={guestUrl === '#' ? undefined : 'noreferrer'} aria-disabled={guestUrl === '#'}>{data.program.guestAction} <ArrowRight size={16} /></a>
        <button type="button" className="ly-journey-link" onClick={() => setStage('welcome')}>Back to signup preview</button>
      </div>}
      <small className="ly-powered">Powered by Tawaslo</small>
    </section>
  </div>, document.body);
}

function AddMemberPanel({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const valid = name.trim() && /^\+?[\d\s()-]{7,}$/.test(phone.trim());
  return createPortal(<div className="ly-overlay" role="presentation" onClick={onClose}>
    <form className="ly-add-member" role="dialog" aria-modal="true" aria-labelledby="ly-add-title" onClick={event => event.stopPropagation()} onSubmit={event => { event.preventDefault(); if (valid) onSave({ name, phone }); }}>
      <button type="button" className="ly-close" aria-label="Close add member" onClick={onClose}><X size={19} /></button>
      <span>New loyalty member</span><h2 id="ly-add-title">Welcome someone in.</h2>
      <p>Add the customer only after they agree to join. Use their full international number so the same record works across countries.</p>
      <label>Customer name<input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Full name" /></label>
      <label>International phone<input inputMode="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="+000 000 000 000" /></label>
      <small><Globe2 size={14} />Supports every international calling code, including all GCC countries.</small>
      <footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={!valid}><UserPlus size={16} />Add member</button></footer>
    </form>
  </div>, document.body);
}

function Overview({ data, summary, onTab, onShare, onPreview, onHostTest }) {
  const feature = data.members[0];
  const ready = data.members.find(member => rewardProgress(data.program, member) >= 100) || data.members[1];
  const close = data.members.filter(member => {
    const progress = rewardProgress(data.program, member);
    return progress >= 70 && progress < 100;
  });
  return <>
    <section className="ly-hero">
      <div className="ly-hero-copy"><span>Return, remembered</span><h2>Turn one good experience<br />into the next.</h2><p>A digital loyalty program that feels like the brand. No app, no plastic card, and no awkward signup at the counter.</p>
        <div><button type="button" onClick={() => onTab('design')}><Palette size={17} />Edit program</button><button type="button" onClick={onShare}><FaWhatsapp />Share customer card</button></div>
      </div>
      <div className="ly-card-stage"><span className="ly-card-caption"><i />Live card · customer view</span><button type="button" aria-label="Preview customer loyalty card" onClick={onPreview}><MemberCard data={data} member={feature} /><span>Tap to open customer view <ArrowRight size={14} /></span></button></div>
    </section>

    <section className="ly-pulse">
      <div><span>This month</span><strong>{summary.repeatRate}%</strong><small>of members returned</small></div>
      <div><strong>{summary.members}</strong><small>regulars remembered</small></div>
      <div><strong>{summary.ready}</strong><small>rewards waiting</small></div>
      <div><strong>{summary.redemptions}</strong><small>little thank-yous enjoyed</small></div>
    </section>

    <section className="ly-rhythm"><header><div><span>Recent return activity</span><h3>Every return leaves a trace.</h3></div><small>Live sample activity</small></header><div>{data.activity.slice(0, 4).map(item => <article key={item.id} data-tone={item.tone}><time>{item.time}</time><i /><strong>{item.name}</strong><span>{item.action}</span></article>)}</div></section>

    <section className="ly-notice-grid">
      <article className="ly-ready"><div><Award size={22} /><span>Reward ready</span></div><h3>{ready.name}</h3><p>{ready.visits} {earnUnit(data.program, ready.visits)} remembered · {ready.redeemed} rewards already enjoyed</p><Progress data={data} member={ready} /><button type="button" onClick={() => onHostTest(ready.id)}>Test in host view <ArrowRight size={15} /></button></article>
      <article className="ly-near"><header><div><span>Almost there</span><h3>A gentle nudge, never spam.</h3></div><TicketCheck size={22} /></header>{close.slice(0, 3).map(member => { const remaining = rewardGoal(data.program) - rewardValue(data.program, member); return <div key={member.id}><span>{member.name.split(' ')[0]}<small>{remaining} {data.program.type === 'points' ? 'points' : earnUnit(data.program, remaining)} away</small></span><Progress data={data} member={member} /></div>; })}</article>
      <article className="ly-opportunity"><span>Return opportunity</span><h3>Invite familiar faces back.</h3><p>Four regulars have not returned in six weeks. Prepare a warm message for the brand’s quieter hours.</p><button type="button" onClick={onShare}><FaWhatsapp />Prepare return invitation</button></article>
    </section>
  </>;
}

function StampDesk({ data, setData, selectedId, setSelectedId, notify }) {
  const [query, setQuery] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const member = data.members.find(item => item.id === selectedId) || null;
  const find = () => {
    const match = findLoyaltyMember(data, query);
    if (!match) return notify('No member found. Try a name, phone number, or card code.');
    setSelectedId(match.id); setQuery(''); notify(`${match.name} is ready in the host test.`);
  };
  const add = () => {
    if (!member || !data.program.enabled) return;
    setData(current => recordLoyaltyVisit(current, member.id));
    notify(`${earnAction(data.program).label} recorded for ${member.name}.`);
  };
  const redeem = () => {
    if (!member || rewardProgress(data.program, member) < 100) return;
    setData(current => redeemLoyaltyReward(current, member.id));
    notify(`${data.program.reward} redeemed for ${member.name}.`);
  };
  return <section className="ly-stamp-desk">
    <header><span>Host test · sample data</span><h2>Test the operator flow.</h2><p>This safe simulation mirrors the host-only loyalty desk. Scan a customer card or find them by name, phone, or card code.</p></header>
    <div className="ly-stamp-layout">
      <div className="ly-finder"><div className="ly-scan-window" data-scanning={scanOpen}><i /><i /><i /><i />{scanOpen ? <><ScanLine size={48} /><strong>Camera preview</strong><span>Hold the customer QR inside the frame</span><button type="button" onClick={() => setScanOpen(false)}>Use manual search</button></> : <><QrCode size={54} /><strong>Scan a customer card</strong><span>The camera is only used while this window is open.</span><button type="button" onClick={() => setScanOpen(true)}><ScanLine size={16} />Open scanner</button></>}</div><div className="ly-or"><span>or find a member</span></div><div className="ly-member-search"><Search size={17} /><input aria-label="Member name, phone, or card code" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => event.key === 'Enter' && find()} placeholder="Name, phone, or MAR-LZ84" /><button type="button" disabled={!query.trim()} onClick={find}>Find</button></div></div>
      <aside className="ly-stamp-result">{member ? <><span>Customer found</span><MemberCard data={data} member={member} compact /><div className="ly-result-person"><div>{member.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</div><span><strong>{member.name}</strong><small>{member.phone} · {member.visits} {earnUnit(data.program, member.visits)}</small></span></div><Progress data={data} member={member} /><p>{rewardProgress(data.program, member) >= 100 ? `${data.program.reward} is ready.` : `${rewardGoal(data.program) - rewardValue(data.program, member)} more to unlock ${data.program.reward.toLowerCase()}.`}</p><button type="button" className="ly-add-visit" disabled={!data.program.enabled} onClick={add}><CheckCircle2 size={17} />{data.program.enabled ? earnAction(data.program).record : 'Program paused'}</button><button type="button" className="ly-redeem" disabled={rewardProgress(data.program, member) < 100} onClick={redeem}><Gift size={17} />Redeem reward</button></> : <div className="ly-result-empty"><Star size={35} /><strong>The customer card will appear here.</strong><span>Select a member below or scan their QR.</span></div>}</aside>
    </div>
    <div className="ly-quick-picks"><span>Recent regulars</span>{data.members.slice(0, 5).map(item => <button type="button" key={item.id} aria-pressed={item.id === selectedId} onClick={() => setSelectedId(item.id)}><i>{item.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</i><span><strong>{item.name}</strong><small>{item.lastVisit}</small></span><ArrowRight size={14} /></button>)}</div>
  </section>;
}

function HostTestPanel({ data, setData, selectedId, setSelectedId, notify, onClose, dark }) {
  return createPortal(<div className="ly-overlay ly-host-test-overlay" data-theme={dark ? 'dark' : 'light'} role="presentation" onClick={onClose}>
    <section className="ly-host-test" role="dialog" aria-modal="true" aria-labelledby="ly-host-test-title" onClick={event => event.stopPropagation()}>
      <div className="ly-host-test-bar"><div><ShieldCheck size={18} /><span><strong id="ly-host-test-title">Agency sandbox</strong><small>This operator tool lives in the separate host dashboard.</small></span></div><button type="button" aria-label="Close host test" onClick={onClose}><X size={18} /></button></div>
      <StampDesk data={data} setData={setData} selectedId={selectedId} setSelectedId={setSelectedId} notify={notify} />
    </section>
  </div>, document.body);
}

function Members({ data, setSelectedId, onHostTest, onAdd }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const members = useMemo(() => data.members.filter(member => {
    const progress = rewardProgress(data.program, member);
    const bucket = filter === 'all' || (filter === 'ready' && progress >= 100) || (filter === 'close' && progress >= 70 && progress < 100) || (filter === 'quiet' && member.quiet);
    const search = !query.trim() || `${member.name} ${member.phone} ${member.code}`.toLowerCase().includes(query.toLowerCase());
    return bucket && search;
  }), [data, filter, query]);
  return <section className="ly-members"><header><div><span>Customer memory</span><h2>Know the people who come back.</h2></div><button type="button" onClick={onAdd}><UserPlus size={16} />Add member</button></header><div className="ly-member-tools"><label><Search size={16} /><input aria-label="Search loyalty members" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search members" /></label><nav aria-label="Member filters">{LOYALTY_FILTERS.map(item => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</nav></div><div className="ly-member-list"><header><span>Member</span><span>Last seen</span><span>Progress</span><span>Memory</span><span /></header>{members.map(member => <article key={member.id}><div className="ly-member-person"><i>{member.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</i><span><strong>{member.name}</strong><small>{member.phone} · {member.code}</small></span></div><span className="ly-last-seen">{member.lastVisit}</span><div className="ly-member-progress"><strong>{rewardValue(data.program, member)} / {rewardGoal(data.program)}</strong><Progress data={data} member={member} /></div><span className="ly-memory"><strong>{member.favorite}</strong><small>{member.note}</small></span><button type="button" aria-label={`Test ${member.name} in host view`} onClick={() => { setSelectedId(member.id); onHostTest(member.id); }}><ArrowRight size={16} /></button></article>)}{members.length === 0 && <p className="ly-empty">No members match this view.</p>}</div></section>;
}

function AgencyMembers({ data, setSelectedId, onHostTest, onPreview }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const members = useMemo(() => data.members.filter(member => {
    const progress = rewardProgress(data.program, member);
    const bucket = filter === 'all' || (filter === 'ready' && progress >= 100) || (filter === 'close' && progress >= 70 && progress < 100) || (filter === 'quiet' && member.quiet);
    const search = !query.trim() || `${member.name} ${member.phone} ${member.code}`.toLowerCase().includes(query.toLowerCase());
    return bucket && search;
  }), [data, filter, query]);

  return <section className="ly-members ly-agency-members">
    <header><div><span>Customer insight</span><h2>Know the people who come back.</h2><p>Review customer progress here. Signup, earning, and redemption happen with the host.</p></div><button type="button" onClick={onPreview}><Eye size={16} />Preview customer card</button></header>
    <div className="ly-member-tools"><label><Search size={16} /><input aria-label="Search loyalty customers" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search customers" /></label><nav aria-label="Customer filters">{LOYALTY_FILTERS.map(item => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</nav></div>
    <div className="ly-member-list"><header><span>Customer</span><span>Last seen</span><span>Progress</span><span>Memory</span><span /></header>{members.map(member => <article key={member.id}><div className="ly-member-person"><i>{member.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</i><span><strong>{member.name}</strong><small>{member.phone} · {member.code}</small></span></div><span className="ly-last-seen">{member.lastVisit}</span><div className="ly-member-progress"><strong>{rewardValue(data.program, member)} / {rewardGoal(data.program)}</strong><Progress data={data} member={member} /></div><span className="ly-memory"><strong>{member.favorite}</strong><small>{member.note}</small></span><button type="button" aria-label={`Test ${member.name} in Host Test`} onClick={() => { setSelectedId(member.id); onHostTest(member.id); }}><ShieldCheck size={16} /></button></article>)}{members.length === 0 && <p className="ly-empty">No customers match this view.</p>}</div>
  </section>;
}

function LoyaltyDesignPreview({ data, onPreview, dark, className, previewRef }) {
  const { program } = data;
  const sample = data.members[0];
  return <aside ref={previewRef} className={`ly-design-preview ${className}`} data-theme={dark ? 'dark' : 'light'} style={{ '--ly-brand': program.brandColor, '--ly-accent': program.accentColor }}><div className="ly-preview-title"><span>Live customer card</span><small><i data-enabled={program.enabled} />{program.enabled ? 'Customer-ready' : 'Program paused'}</small></div><MemberCard data={data} member={sample} compact /><p>{program.welcome}</p><button type="button" onClick={onPreview}><Eye size={16} />Open full customer view</button></aside>;
}

function LoyaltyDesignPortalPreview({ data, onPreview, dark }) {
  const previewRef = useRef(null);
  useLayoutEffect(() => {
    const preview = previewRef.current;
    const scroller = document.querySelector('.tw-scroll-area');
    const tabs = document.querySelector('.ly-tabs');
    const layout = document.querySelector('.ly-design-layout');
    const rules = document.querySelector('.ly-rules');
    if (!preview || !scroller || !tabs || !layout || !rules) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!window.matchMedia('(min-width: 901px)').matches) return;
      const scrollerRect = scroller.getBoundingClientRect();
      const tabsRect = tabs.getBoundingClientRect();
      const layoutRect = layout.getBoundingClientRect();
      const rulesRect = rules.getBoundingClientRect();
      const previewHeight = preview.getBoundingClientRect().height;
      const gap = Number.parseFloat(getComputedStyle(layout).columnGap) || 18;
      const left = rulesRect.right + gap;
      const centeredTop = scrollerRect.top + Math.max(18, (scrollerRect.height - previewHeight) / 2);
      preview.style.setProperty('--ly-preview-top', `${Math.max(rulesRect.top, tabsRect.bottom + 20, centeredTop)}px`);
      preview.style.setProperty('--ly-preview-left', `${left}px`);
      preview.style.setProperty('--ly-preview-width', `${Math.max(300, layoutRect.right - left)}px`);
    };
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    if (observer) observer.observe(preview);
    return () => {
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (observer) observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [data.program.welcome, data.program.reward, data.program.stampGoal, data.program.type]);
  return typeof document === 'undefined' ? null : createPortal(<LoyaltyDesignPreview data={data} onPreview={onPreview} dark={dark} className="ly-design-preview-portal" previewRef={previewRef} />, document.body);
}

function DesignRules({ data, setData, onPreview, dark }) {
  const program = data.program;
  const patch = update => setData(current => updateLoyaltyProgram(current, update));
  const action = earnAction(program);
  return <section className="ly-design">
    <header><span>Program studio</span><h2>Make returning feel like the brand.</h2><p>Set the reward logic, customer experience, and the card people keep on their phone.</p></header>
    <div className="ly-design-layout">
      <div className="ly-rules">
        <section>
          <div className="ly-section-heading"><div><span>Program basics</span><h3>Name it and make it live</h3></div><button type="button" className="ly-status-toggle" aria-pressed={program.enabled} onClick={() => patch({ enabled: !program.enabled })}><i />{program.enabled ? 'Active' : 'Paused'}</button></div>
          <div className="ly-rule-grid"><label>Business type<select value={program.businessType} onChange={event => patch({ businessType: event.target.value })}>{BUSINESS_TYPES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Program name<input value={program.programName} maxLength="36" onChange={event => patch({ programName: event.target.value })} /></label></div>
          <p className="ly-field-note">Business type keeps future suggestions relevant without limiting your reward options. The program name appears on the customer card.</p>
          <p className="ly-field-note">Pausing keeps member progress but stops new earning.</p>
        </section>

        <section>
          <span>Reward logic</span><h3>How customers earn</h3>
          <div className="ly-type-choice"><button type="button" aria-pressed={program.type === 'stamps'} onClick={() => patch({ type: 'stamps' })}><TicketCheck size={18} /><strong>Actions</strong><small>One stamp per qualifying action</small></button><button type="button" aria-pressed={program.type === 'points'} onClick={() => patch({ type: 'points' })}><CircleDollarSign size={18} /><strong>Points</strong><small>Flexible for higher-value programs</small></button></div>
          <div className="ly-rule-grid"><label>Qualifying action<select value={program.earnAction} onChange={event => patch({ earnAction: event.target.value })}>{EARN_ACTIONS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Reward<input value={program.reward} maxLength="60" onChange={event => patch({ reward: event.target.value })} /></label></div>
          <div className="ly-rule-grid">{program.type === 'stamps' ? <label>{action.label}s required<input type="number" min="2" max="20" value={program.stampGoal} onChange={event => patch({ stampGoal: Number(event.target.value) })} /></label> : <><label>Points per {action.label.toLowerCase()}<input type="number" min="1" value={program.pointsPerVisit} onChange={event => patch({ pointsPerVisit: Number(event.target.value) })} /></label><label>Points required<input type="number" min="10" value={program.pointsGoal} onChange={event => patch({ pointsGoal: Number(event.target.value) })} /></label></>}<label>Expiry window<select value={program.expiryDays} onChange={event => patch({ expiryDays: Number(event.target.value) })}><option value="90">90 days</option><option value="180">180 days</option><option value="365">1 year</option><option value="730">2 years</option></select></label></div>
        </section>

        <section>
          <span>Global customer experience</span><h3>Language and next step</h3>
          <div className="ly-rule-grid"><label>Customer card language<select value={program.guestLanguage} onChange={event => patch({ guestLanguage: event.target.value })}><option value="workspace">Use workspace language</option><option value="en">English</option><option value="ar">Arabic · RTL</option></select></label><label>Button label<input value={program.guestAction} maxLength="48" onChange={event => patch({ guestAction: event.target.value })} /></label></div>
          <label>Button destination<input type="url" value={program.guestActionUrl} onChange={event => patch({ guestActionUrl: event.target.value })} placeholder="https://yourwebsite.com" aria-describedby="ly-destination-help" /><small className="ly-input-help" id="ly-destination-help" data-error={program.guestActionUrl && safeGuestUrl(program.guestActionUrl) === '#'}>{program.guestActionUrl && safeGuestUrl(program.guestActionUrl) === '#' ? 'Use a complete, secure https:// link.' : 'Where the customer button opens, such as a shop, product, booking, menu, or website.'}</small></label>
          <p className="ly-world-note"><Globe2 size={16} />International phone numbers, universal links and QR work globally. Messaging remains optional for businesses that use it.</p>
        </section>

        <section>
          <span>Card art direction</span><h3>Colour, mood and symbol</h3>
          <div className="ly-color-grid"><ColorControl label="Brand colour" value={program.brandColor} presets={BRAND_COLORS} onChange={brandColor => patch({ brandColor })} /><ColorControl label="Highlight colour" value={program.accentColor} presets={ACCENT_COLORS} onChange={accentColor => patch({ accentColor })} /></div>
          <fieldset className="ly-choice-group"><legend>Reward symbol</legend><p>Choose a clear mark that suits the business. The selected symbol appears on every progress stamp.</p><div className="ly-symbol-grid">{STAMP_SYMBOLS.map(({ id, label, Icon }) => <button type="button" key={id} aria-label={`Use ${label} reward symbol`} aria-pressed={program.stampIcon === id} onClick={() => patch({ stampIcon: id })}><Icon size={18} aria-hidden="true" /><span>{label}</span></button>)}</div></fieldset>
          <fieldset className="ly-choice-group"><legend>Card mood</legend><div className="ly-theme-choice">{[['tide', 'Sunset tide'], ['paper', 'Pearl paper'], ['night', 'After dark']].map(([id, label]) => <button type="button" key={id} aria-pressed={program.cardTheme === id} onClick={() => patch({ cardTheme: id })}>{label}</button>)}</div></fieldset>
          <label>Welcome note<textarea rows="3" maxLength="180" value={program.welcome} onChange={event => patch({ welcome: event.target.value })} /><small className="ly-character-count">{program.welcome.length}/180</small></label>
        </section>
      </div>
      <LoyaltyDesignPreview data={data} onPreview={onPreview} dark={dark} className="ly-design-preview-inline" />
    </div>
    <LoyaltyDesignPortalPreview data={data} onPreview={onPreview} dark={dark} />
  </section>;
}

export default function LoyaltyExperience({ dark, setDark, onOpenHostTest = () => {} }) {
  const [data, setData] = useState(() => readLoyaltyPreview());
  const [tab, setTab] = useState('overview');
  const [selectedId, setSelectedId] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const summary = useMemo(() => loyaltySummary(data), [data]);
  const feature = data.members[0];
  const openHostTest = memberId => {
    setSelectedId(memberId || feature?.id || '');
    onOpenHostTest();
  };
  useEffect(() => { saveLoyaltyPreview(data); }, [data]);
  useEffect(() => {
    const origin = typeof window === 'undefined' ? 'https://tawaslo.com' : window.location.origin;
    QRCode.toDataURL(`${origin}/loyalty/${data.share.slug}`, { width: 360, margin: 1, color: { dark: '#16332d', light: '#fffaf0' } }).then(setQr).catch(() => setQr(''));
  }, [data.share.slug]);
  const notify = message => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const copy = async () => {
    const origin = typeof window === 'undefined' ? 'https://tawaslo.com' : window.location.origin;
    try { await navigator.clipboard.writeText(`${origin}/loyalty/${data.share.slug}`); } catch (_) {}
    setCopied(true); window.setTimeout(() => setCopied(false), 1500);
  };
  return <main className="tw-loyalty" data-theme={dark ? 'dark' : 'light'}>
    <div className="ly-preview-bar"><span>Loyalty preview · Sample members · Nothing is sent automatically</span><button type="button" aria-label={dark ? 'Use light Loyalty theme' : 'Use dark Loyalty theme'} onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button></div>
    <header className="ly-heading"><div><span><Award size={16} />Loyalty / Marina Social Club</span><h1>Make coming back <em>feel personal.</em></h1><p>Run the reward, remember the customer, and give every regular a beautiful card without asking them to download another app.</p></div><div><button type="button" onClick={() => setGuestOpen(true)}><Eye size={16} />Customer view</button><button type="button" onClick={() => setShareOpen(true)}><Link2 size={16} />Link & QR</button></div></header>
    <section className="ly-agency-boundary"><ShieldCheck size={20} /><div><strong>The agency builds and reviews the loyalty program.</strong><span>Customer signup, earning, redemption, and counter activity belong to the future Host dashboard.</span></div><button type="button" onClick={() => openHostTest()}>Test the host flow<ArrowRight size={16} /></button></section>
    <nav className="ly-tabs" aria-label="Loyalty setup sections">{TABS.map(item => <button type="button" key={item.id} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}><item.Icon size={16} />{item.label}</button>)}<button type="button" className="ly-host-test-tab tw-host-test-launch" onClick={() => openHostTest()}><ShieldCheck size={16} />Host Test</button></nav>
    {tab === 'overview' && <Overview data={data} summary={summary} onTab={setTab} onShare={() => setShareOpen(true)} onPreview={() => setGuestOpen(true)} onHostTest={openHostTest} />}
    {tab === 'members' && <AgencyMembers data={data} setSelectedId={setSelectedId} onHostTest={openHostTest} onPreview={() => setGuestOpen(true)} />}
    {tab === 'design' && <DesignRules data={data} setData={setData} onPreview={() => setGuestOpen(true)} dark={dark} />}
    <footer className="ly-foot"><span><Check size={14} />Sample changes save on this device</span><span>No customer is contacted from this preview</span></footer>
    {shareOpen && <SharePanel data={data} qr={qr} onClose={() => setShareOpen(false)} onCopy={copy} copied={copied} />}
    {guestOpen && <GuestPreview data={data} member={feature} onClose={() => setGuestOpen(false)} />}
    {toast && <div className="ly-toast" role="status">{toast}</div>}
  </main>;
}
