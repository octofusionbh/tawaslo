import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { formatInvoiceMoney } from './invoiceCurrencies';
import { CrisisExperience, ImpactExperience, ReportsExperience, VenueReportExperience } from './InsightsExperience';

// Live wrappers for the redesigned insight rooms. Each one reads the same records the
// original pages read and passes only those figures through; anything the workspace does
// not record is left out so the design hides it rather than showing an invented number.

const PERIOD_DAYS = { '7 days': 7, '30 days': 30, '90 days': 90 };
const DAY = 86400000;
const ORIGIN = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://tawaslo.com';
const SOURCE_LABEL = { bio: 'Bio link', concierge: 'AI concierge', whatsapp: 'WhatsApp', manual: 'Walk-in', walkin: 'Walk-in', online: 'Online', order: 'Online order', other: 'Other' };

const count = value => Number(value || 0).toLocaleString();
const sourceLabel = value => SOURCE_LABEL[String(value || 'other')] || String(value || 'other');

// The chart draws in a 0-100 box, so counts are scaled. An all-zero window is returned as
// null: a flat line at the floor would read as a measured result rather than no activity.
function chartSeries(counts) {
  if (!Array.isArray(counts) || counts.length < 2) return null;
  const max = Math.max(...counts);
  if (!max) return null;
  return counts.map(value => Math.round((Number(value) || 0) / max * 90));
}

function dayAxis(start, days) {
  const at = offset => new Date(start.getTime() + offset * DAY).toLocaleDateString([], { day: 'numeric', month: 'short' });
  return [at(0), at(Math.round(days / 3)), at(Math.round(days * 2 / 3)), 'Today'];
}

function useClientId(client) {
  const givenId = client && client.id ? String(client.id) : '';
  const name = (client && client.name) || '';
  const [id, setId] = useState(givenId);
  useEffect(() => {
    let active = true;
    if (givenId) { setId(givenId); return undefined; }
    if (!name) { setId(''); return undefined; }
    // Preview clients carry no real id, so the workspace row is found by name.
    supabase.from('clients').select('id').eq('name', name).limit(1)
      .then(({ data }) => { if (active) setId((data && data[0] && String(data[0].id)) || ''); }, () => { if (active) setId(''); });
    return () => { active = false; };
  }, [givenId, name]);
  return id;
}

export function VenueReportLive({ client = null } = {}) {
  const clientId = useClientId(client);
  const clientName = (client && client.name) || '';
  const [period, setPeriod] = useState('30 days');
  const [slug, setSlug] = useState('');
  const [live, setLive] = useState({ stats: [], momentum: null, channels: null });

  useEffect(() => {
    let active = true;
    if (!clientId) { setLive({ stats: [], momentum: null, channels: null }); setSlug(''); return undefined; }
    const days = PERIOD_DAYS[period] || 30;
    const start = new Date(Date.now() - days * DAY);
    start.setHours(0, 0, 0, 0);
    (async () => {
      try {
        const [bookingRes, orderRes, menuRes] = await Promise.all([
          supabase.from('bookings').select('party_size,status,source,starts_at,customer_phone').eq('client_id', clientId).gte('starts_at', start.toISOString()),
          supabase.from('orders').select('total,status,currency,created_at').eq('client_id', clientId).gte('created_at', start.toISOString()),
          supabase.from('menus').select('slug,currency').eq('client_id', clientId).limit(1),
        ]);
        if (!active) return;
        const menu = (menuRes.data && menuRes.data[0]) || null;
        setSlug((menu && menu.slug) || '');
        const bookings = (bookingRes.data || []).filter(row => row.status !== 'cancelled');
        const orders = (orderRes.data || []).filter(row => row.status !== 'cancelled');
        const covers = bookings.reduce((sum, row) => sum + (Number(row.party_size) || 1), 0);
        const revenue = orders.reduce((sum, row) => sum + (Number(row.total) || 0), 0);
        const currency = (menu && menu.currency) || (orders.find(row => row.currency) || {}).currency || '';
        const phones = {};
        bookings.forEach(row => {
          const digits = String(row.customer_phone || '').replace(/[^0-9]/g, '');
          if (digits.length >= 6) phones[digits] = (phones[digits] || 0) + 1;
        });
        const unique = Object.keys(phones).length;
        const repeat = Object.values(phones).filter(times => times > 1).length;

        const stats = [{ label: 'Customer actions', value: count(bookings.length + orders.length), note: ` ${count(bookings.length)} bookings · ${count(orders.length)} orders` }];
        if (bookings.length) stats.push({ label: 'Covers seated', value: count(covers), note: ' guests across confirmed bookings', tone: 'aqua' });
        if (orders.length && currency) stats.push({ label: 'Order revenue', value: formatInvoiceMoney(revenue, currency, 'en'), note: ` across ${count(orders.length)} orders`, tone: 'coral' });
        if (unique) stats.push({ label: 'Repeat customers', value: `${Math.round(repeat / unique * 100)}%`, note: ` of ${count(unique)} guests booked more than once`, tone: 'gold' });

        const buckets = new Array(days).fill(0);
        const bucketOf = value => {
          const at = new Date(value).getTime();
          if (!isFinite(at)) return -1;
          return Math.floor((at - start.getTime()) / DAY);
        };
        bookings.forEach(row => { const index = bucketOf(row.starts_at); if (index >= 0 && index < days) buckets[index] += 1; });
        orders.forEach(row => { const index = bucketOf(row.created_at); if (index >= 0 && index < days) buckets[index] += 1; });
        const values = chartSeries(buckets);

        const bySource = {};
        const add = (key, field) => { const name = sourceLabel(key); bySource[name] = bySource[name] || { bookings: 0, orders: 0 }; bySource[name][field] += 1; };
        bookings.forEach(row => add(row.source, 'bookings'));
        orders.forEach(() => add('order', 'orders'));
        const total = bookings.length + orders.length;
        const rows = Object.entries(bySource)
          .map(([name, value]) => ({ name, ...value, total: value.bookings + value.orders }))
          .sort((a, b) => b.total - a.total)
          .map(row => [row.name, count(row.bookings), count(row.orders), count(row.total), total ? `${Math.round(row.total / total * 100)}%` : '—']);

        setLive({
          stats,
          momentum: values ? { values, axis: dayAxis(start, days) } : null,
          channels: rows.length ? { head: ['Source', 'Bookings', 'Orders', 'Customer actions', 'Share'], rows } : null,
        });
      } catch (error) {
        if (active) setLive({ stats: [], momentum: null, channels: null });
      }
    })();
    return () => { active = false; };
  }, [clientId, period]);

  const reportUrl = slug ? `${ORIGIN}/rreport/${slug}` : '';
  const copyShareLink = useCallback(async () => {
    if (!reportUrl) return 'This client has no public report page yet.';
    try { await navigator.clipboard.writeText(reportUrl); return 'Report link copied.'; } catch (error) { return reportUrl; }
  }, [reportUrl]);
  const exportPdf = useCallback(async () => {
    if (!reportUrl) return 'This client has no public report page yet.';
    if (typeof window !== 'undefined') window.open(reportUrl, '_blank');
    return 'The report opened in a new tab — print it to PDF from there.';
  }, [reportUrl]);

  return <VenueReportExperience live={live} clientName={clientName} onPeriodChange={setPeriod} onCopyShareLink={copyShareLink} onExportPdf={exportPdf}/>;
}

// Same keyword pass the original radar used — it is the only tone signal the app has.
const NEGATIVE_WORDS = ['bad', 'worst', 'terrible', 'awful', 'poor', 'slow', 'disappointed', 'hate', 'rude', 'broken', 'late', 'problem', 'issue', 'refund', 'wrong', 'angry', 'scam', 'disgusting', 'avoid', 'dirty', 'overpriced', '😡', '👎', '😠', '🤬'];
const NEGATIVE_AR = /(سيء|سيئ|مشكلة|بطيء|وقح|زفت|مزعج|رفض|خداع|غاضب|وسخ|غالي)/;
function isNegative(text) {
  const value = ` ${String(text || '').toLowerCase()} `;
  if (NEGATIVE_WORDS.some(word => value.includes(word))) return true;
  return NEGATIVE_AR.test(String(text || ''));
}

const CRISIS_COPY = {
  calm: { title: 'No unusual negativity spike.', summary: 'Nothing in the recent comments and messages reads as a spike in negative feedback.' },
  watch: { title: 'Worth a look.', summary: 'Some negative feedback is coming in. Keep an eye on it before it builds.' },
  alert: { title: 'Negativity spike.', summary: 'Several negative messages landed recently. Respond quickly to get ahead of it.' },
};

export function CrisisLive({ client = null, onOpenInbox = null, onConnectAccounts = null } = {}) {
  const clientId = useClientId(client);
  const clientName = (client && client.name) || '';
  const [live, setLive] = useState({ connected: true, scanning: true, level: 'calm', title: 'Checking recent conversations…', summary: '', negative24: null, rate: null, scanned: null, volume: null, signals: [] });

  const scan = useCallback(async () => {
    if (!clientId) {
      setLive({ connected: false, scanning: false, level: 'calm', title: 'No client selected.', summary: 'Choose a client to watch its comments and messages.', negative24: null, rate: null, scanned: null, volume: null, signals: [] });
      return 'Choose a client first.';
    }
    setLive(current => ({ ...current, scanning: true }));
    let accounts = [];
    try {
      const { data } = await supabase.from('social_accounts').select('account_id,access_token,account_name,platform').eq('client_id', clientId).neq('is_active', false);
      accounts = (data || []).filter(row => row.platform === 'ig' && row.account_id && row.access_token);
    } catch (error) { accounts = []; }
    if (!accounts.length) {
      setLive({ connected: false, scanning: false, level: 'calm', title: 'Connect Instagram to watch.', summary: 'Crisis Radar reads this client’s comments and messages. Connect an Instagram account to start watching.', negative24: null, rate: null, scanned: null, volume: null, signals: [] });
      return 'No Instagram account is connected yet.';
    }
    const messages = [];
    for (const account of accounts) {
      for (const type of ['comments', 'messages']) {
        try {
          const response = await fetch('/api/instagram-inbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: account.account_id, accessToken: account.access_token, type }) });
          const payload = await response.json();
          if (payload && payload.data) messages.push(...payload.data.map(item => ({ ...item, accountName: account.account_name })));
        } catch (error) { /* one failed account must not hide the rest */ }
      }
    }
    const negatives = messages.filter(item => isNegative(item.text));
    const negative24 = negatives.filter(item => { const at = new Date(item.time).getTime(); return isFinite(at) && Date.now() - at <= DAY; }).length;
    const rate = messages.length ? Math.round(negatives.length / messages.length * 100) : 0;
    const level = (negative24 >= 3 || (rate >= 40 && negatives.length >= 3)) ? 'alert' : (negative24 >= 1 || rate >= 20) ? 'watch' : 'calm';
    const buckets = new Array(14).fill(0);
    messages.forEach(item => {
      const at = new Date(item.time).getTime();
      if (!isFinite(at)) return;
      const index = 13 - Math.floor((Date.now() - at) / (DAY / 14));
      if (index >= 0 && index < 14) buckets[index] += 1;
    });
    setLive({
      connected: true,
      scanning: false,
      level,
      title: CRISIS_COPY[level].title,
      summary: CRISIS_COPY[level].summary,
      negative24,
      rate,
      scanned: messages.length,
      volume: chartSeries(buckets),
      signals: negatives.slice(0, 8).map((item, index) => ({
        id: String(item.id || `${index}`),
        title: String(item.text || '').slice(0, 90) || 'Message with no text',
        meta: `${item.from ? `@${item.from} · ` : ''}${item.type === 'dm' ? 'Direct message' : 'Comment'}${item.accountName ? ` · ${item.accountName}` : ''}`,
        warn: true,
      })),
    });
    return `Scan complete. ${negatives.length} of ${messages.length} messages read as negative.`;
  }, [clientId]);

  useEffect(() => { scan(); }, [scan]);

  const openInbox = useCallback(async () => {
    if (onOpenInbox) { onOpenInbox(); return 'Inbox opened.'; }
    return 'Open Inbox from the sidebar to reply.';
  }, [onOpenInbox]);
  const connectAccounts = useCallback(async () => {
    if (onConnectAccounts) { onConnectAccounts(); return 'Account settings opened.'; }
    return 'Open Social accounts from the sidebar to connect Instagram.';
  }, [onConnectAccounts]);

  return <CrisisExperience live={live} clientName={clientName} onRescan={scan} onOpenInbox={openInbox} onConnectAccounts={connectAccounts}/>;
}

export function ImpactLive({ client = null } = {}) {
  const clientId = useClientId(client);
  const clientName = (client && client.name) || '';
  const [period, setPeriod] = useState('30 days');
  const [live, setLive] = useState({ stats: [], breakdown: null });

  useEffect(() => {
    let active = true;
    if (!clientId) { setLive({ stats: [], breakdown: null }); return undefined; }
    const days = PERIOD_DAYS[period] || 30;
    const since = new Date(Date.now() - days * DAY).toISOString();
    (async () => {
      try {
        const [bookingRes, loyaltyRes, reviewRes, guestRes, accountRes] = await Promise.all([
          supabase.from('bookings').select('party_size,status,source,starts_at').eq('client_id', clientId).gte('starts_at', since),
          supabase.from('loyalty_cards').select('visits,created_at').eq('client_id', clientId),
          supabase.from('reviews').select('rating,created_at').eq('client_id', clientId).gte('created_at', since),
          supabase.from('guests').select('id').eq('client_id', clientId),
          supabase.from('social_accounts').select('account_id,access_token,platform,followers_count').eq('client_id', clientId).neq('is_active', false),
        ]);
        if (!active) return;
        const bookings = (bookingRes.data || []).filter(row => row.status !== 'cancelled');
        const covers = bookings.reduce((sum, row) => sum + (Number(row.party_size) || 1), 0);
        const concierge = bookings.filter(row => row.source === 'concierge').length;
        const cards = loyaltyRes.data || [];
        const visits = cards.reduce((sum, row) => sum + (Number(row.visits) || 0), 0);
        const reviews = reviewRes.data || [];
        const rating = reviews.length ? reviews.reduce((sum, row) => sum + (Number(row.rating) || 0), 0) / reviews.length : 0;
        const contacts = (guestRes.data || []).length;

        const stats = [];
        if (bookings.length) stats.push({ label: 'Bookings', value: count(bookings.length), note: concierge ? ` ${count(concierge)} via Concierge` : ' confirmed in this period' });
        if (covers) stats.push({ label: 'Covers seated', value: count(covers), note: ' guests hosted', tone: 'aqua' });
        if (reviews.length) stats.push({ label: 'Reviews', value: count(reviews.length), note: ` ★ ${rating.toFixed(1)} average`, tone: 'coral' });
        if (contacts) stats.push({ label: 'Contacts captured', value: count(contacts), note: ' people in the guest book', tone: 'gold' });
        if (cards.length) stats.push({ label: 'Loyalty members', value: count(cards.length), note: visits ? ` ${count(visits)} recorded visits` : ' enrolled', tone: 'aqua' });

        const instagram = (accountRes.data || []).find(row => row.platform === 'ig' && row.account_id && row.access_token);
        const followers = (accountRes.data || []).reduce((sum, row) => sum + (Number(row.followers_count) || 0), 0);
        if (followers) stats.push({ label: 'Followers', value: count(followers), note: ' across connected accounts' });
        if (instagram) {
          try {
            const response = await fetch('/api/instagram-analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: instagram.account_id, accessToken: instagram.access_token }) });
            const payload = await response.json();
            if (active && payload && !payload.error) {
              const reach = Number((payload.summary && payload.summary.totalReach) || payload.reach || 0);
              const posts = Array.isArray(payload.recentPosts) ? payload.recentPosts : [];
              const engagement = posts.reduce((sum, post) => sum + (Number(post.likes) || 0) + (Number(post.comments) || 0), 0);
              if (reach) stats.push({ label: 'Accounts reached', value: count(reach), note: ' reported by Instagram', tone: 'coral' });
              if (engagement) stats.push({ label: 'Engagement', value: count(engagement), note: ' likes and comments on recent posts', tone: 'gold' });
            }
          } catch (error) { /* the network figure is simply left out */ }
        }

        const bySource = {};
        bookings.forEach(row => { const name = sourceLabel(row.source); bySource[name] = (bySource[name] || 0) + 1; });
        const entries = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
        const top = entries.length ? entries[0][1] : 0;
        const breakdown = entries.length ? {
          eyebrow: 'Bookings by source',
          title: 'Where the bookings came from.',
          rows: entries.map(([name, value]) => ({ label: name, value: `${Math.round(value / bookings.length * 100)}%`, width: top ? Math.round(value / top * 100) : 0 })),
        } : null;

        if (active) setLive({ stats, breakdown });
      } catch (error) {
        if (active) setLive({ stats: [], breakdown: null });
      }
    })();
    return () => { active = false; };
  }, [clientId, period]);

  // There is no impact export endpoint; printing this page is the honest equivalent.
  const exportImpact = useCallback(async () => {
    if (typeof window !== 'undefined') window.print();
    return 'Print dialog opened — save it as a PDF from there.';
  }, []);

  return <ImpactExperience live={live} clientName={clientName} onPeriodChange={setPeriod} onExport={exportImpact}/>;
}

export function ReportsLive({ client = null } = {}) {
  const clientId = useClientId(client);
  const clientName = (client && client.name) || '';
  const [slug, setSlug] = useState('');
  const [schedule, setSchedule] = useState(null);

  useEffect(() => {
    let active = true;
    if (!clientId) { setSlug(''); setSchedule(null); return undefined; }
    (async () => {
      try {
        const { data } = await supabase.from('menus').select('slug').eq('client_id', clientId).limit(1);
        if (active) setSlug((data && data[0] && data[0].slug) || '');
      } catch (error) { if (active) setSlug(''); }
      try {
        // auto_report / report_email are optional columns; without them scheduling is hidden.
        const { data, error } = await supabase.from('clients').select('auto_report,report_email').eq('id', clientId).limit(1);
        if (!active) return;
        const row = data && data[0];
        setSchedule(error || !row ? null : { enabled: row.auto_report === true, email: row.report_email || '' });
      } catch (error) { if (active) setSchedule(null); }
    })();
    return () => { active = false; };
  }, [clientId]);

  const reportUrl = slug ? `${ORIGIN}/rreport/${slug}` : '';
  const openBusinessReport = useCallback(async () => {
    if (!reportUrl) return 'This client has no report page yet — publish a menu to create one.';
    if (typeof window !== 'undefined') window.open(reportUrl, '_blank');
    return 'The business report opened in a new tab.';
  }, [reportUrl]);

  const toggleSchedule = useCallback(async next => {
    if (!clientId) return 'Choose a client first.';
    const { error } = await supabase.from('clients').update({ auto_report: next }).eq('id', clientId);
    if (error) return 'Monthly delivery could not be changed.';
    setSchedule(current => ({ enabled: next, email: (current && current.email) || '' }));
    return next ? 'Monthly delivery is on.' : 'Monthly delivery is off.';
  }, [clientId]);

  // Only the business report has a generator behind it, so it is the only template offered.
  const live = {
    templates: reportUrl ? [{ id: 'business', title: 'Business report', copy: 'Bookings, orders, reviews and loyalty for this client' }] : [],
    library: null,
    schedule,
  };

  return <ReportsExperience live={live} clientName={clientName} onCreateReport={openBusinessReport} onUseTemplate={openBusinessReport} onToggleSchedule={toggleSchedule}/>;
}
