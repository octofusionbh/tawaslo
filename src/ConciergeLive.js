import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import WhatsAppExperience from './WhatsAppExperience';

const text = value => (typeof value === 'string' ? value : '');
const digitsOf = value => String(value || '').replace(/[^\d]/g, '');
// Matching on the last eight digits is how the WhatsApp webhook already pairs a
// number with a booking, so the guest book is matched the same way here.
const matchKey = value => { const d = digitsOf(value); return d.length >= 8 ? d.slice(-8) : d; };

// Avatar colours are presentation only — picked from the number so a thread keeps
// the same colour between loads, never read as information about the person.
const TONES = ['#cf6a57', '#456c67', '#7b5b70', '#9a7240', '#5e708e'];
function toneFor(value) {
  const d = digitsOf(value);
  let sum = 0;
  for (let i = 0; i < d.length; i += 1) sum += d.charCodeAt(i);
  return TONES[sum % TONES.length];
}

function initialsFor(name, phone) {
  const parts = text(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length) return parts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
  const d = digitsOf(phone);
  return d.slice(-2) || '··';
}

function relativeTime(value) {
  const at = new Date(value);
  if (!value || Number.isNaN(at.getTime())) return '';
  const minutes = Math.round((Date.now() - at.getTime()) / 60000);
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  if (hours < 48) return 'Yesterday';
  return at.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function visitLabel(value) {
  if (!value) return '';
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return '';
  return at.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function toConversation(thread, guest) {
  const phone = text(thread.wa_from).trim();
  const rows = Array.isArray(thread.messages) ? thread.messages : [];
  const messages = rows
    .map((message, index) => ({
      id: `${thread.id}-${index}`,
      side: message && message.role === 'assistant' ? 'team' : 'guest',
      text: text(message && message.content).trim(),
    }))
    .filter(message => message.text);
  const name = text(guest && guest.name).trim();
  const visits = Number(guest && guest.visits) || 0;
  return {
    id: thread.id,
    name: name || (phone ? `+${digitsOf(phone)}` : 'WhatsApp guest'),
    phone: phone ? `+${digitsOf(phone)}` : '',
    initials: initialsFor(name, phone),
    tone: toneFor(phone),
    time: relativeTime(thread.updated_at),
    preview: (messages.length && messages[messages.length - 1].text) || '',
    messages,
    // Only facts the guest book actually stores; guests has no spend or occasion column.
    details: {
      visits: visits ? `${visits} ${visits === 1 ? 'visit' : 'visits'}` : '',
      lastVisit: visitLabel(guest && guest.last_visit),
      preference: text(guest && (guest.fav_item || guest.preferences)).trim(),
    },
  };
}

export default function ConciergeLive({ client, dark = false, setDark = () => {} }) {
  const [state, setState] = useState({ status: 'loading', conversations: [], metrics: null, replies: [], error: '' });
  const idRef = useRef('');
  const clientId = client?.id || '';
  const clientName = client?.name || '';

  useEffect(() => {
    let active = true;
    if (!clientId && !clientName) { setState({ status: 'empty', conversations: [], metrics: null, replies: [], error: '' }); return undefined; }
    setState({ status: 'loading', conversations: [], metrics: null, replies: [], error: '' });
    (async () => {
      try {
        let id = clientId;
        if (!id) {
          const { data, error } = await supabase.from('clients').select('id').eq('name', clientName).limit(1);
          if (error) throw error;
          id = data && data[0] && data[0].id;
        }
        if (!id) throw new Error('This client is not in the workspace yet.');
        const ym = new Date().toISOString().slice(0, 7);
        const [threadRes, guestRes, usageRes, settingsRes, menuRes] = await Promise.all([
          supabase.from('wa_threads').select('id,wa_from,messages,updated_at').eq('client_id', id).order('updated_at', { ascending: false }),
          supabase.from('guests').select('phone,name,visits,last_visit,fav_item,preferences').eq('client_id', id),
          supabase.from('concierge_usage').select('used').eq('client_id', id).eq('ym', ym).maybeSingle(),
          supabase.from('booking_settings').select('hours').eq('client_id', id).limit(1),
          supabase.from('menus').select('slug,external_menu_url').eq('client_id', id).limit(1),
        ]);
        if (threadRes.error) throw threadRes.error;
        if (!active) return;
        idRef.current = id;
        const byPhone = new Map();
        (guestRes.data || []).forEach(guest => { const key = matchKey(guest.phone); if (key) byPhone.set(key, guest); });
        const conversations = (threadRes.data || []).map(thread => toConversation(thread, byPhone.get(matchKey(thread.wa_from))));
        const usage = usageRes.data;
        const hours = (settingsRes.data && settingsRes.data[0] && settingsRes.data[0].hours) || {};
        const menu = menuRes.data && menuRes.data[0];
        const menuUrl = text(menu && menu.external_menu_url).trim() || (menu && menu.slug ? `https://www.tawaslo.com/menu/${menu.slug}` : '');
        // Quick replies are only offered where the workspace already holds the words:
        // the concierge greeting the client wrote, and their own menu link.
        const replies = [];
        const greeting = text(hours.concierge_greeting).trim();
        if (greeting) replies.push({ id: 'greeting', label: 'Send greeting', text: greeting });
        if (menuUrl) replies.push({ id: 'menu', label: 'Share menu link', text: menuUrl });
        setState({
          status: 'ready',
          conversations,
          metrics: usage ? { chatsThisMonth: Number(usage.used) || 0 } : null,
          replies,
          error: '',
        });
      } catch (error) {
        if (!active) return;
        setState({ status: 'error', conversations: [], metrics: null, replies: [], error: (error && error.message) || 'Concierge conversations could not be loaded.' });
      }
    })();
    return () => { active = false; };
  }, [clientId, clientName]);

  const handleSend = useCallback(async (conversation, body) => {
    const to = digitsOf(conversation && conversation.phone);
    if (!to) return { error: 'This conversation has no WhatsApp number.' };
    try {
      const response = await fetch('/api/meta-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'whatsapp', to, body }),
      });
      const result = await response.json().catch(() => ({}));
      if (result && result.configured === false) return { error: 'WhatsApp is not connected yet.' };
      if (!result || !result.success) return { error: (result && result.error) || 'The reply could not be sent.' };
      // Keep the stored thread in step so the concierge answers with this reply in context.
      const sent = [...(conversation.messages || []).map(message => ({ role: message.side === 'team' ? 'assistant' : 'user', content: message.text })), { role: 'assistant', content: body }].slice(-12);
      await supabase.from('wa_threads').update({ messages: sent, updated_at: new Date().toISOString() }).eq('id', conversation.id);
      return { ok: true };
    } catch (error) {
      return { error: (error && error.message) || 'The reply could not be sent.' };
    }
  }, []);

  if (state.status !== 'ready') {
    return <main className="tw-whatsapp-desk" data-whatsapp-theme={dark ? 'dark' : 'light'}>
      <header className="wa-heading"><div>
        <span className="wa-kicker">{clientName ? `${clientName} / Concierge` : 'Concierge'}</span>
        <h1>Every conversation, understood.</h1>
        <p>{state.status === 'loading' ? 'Loading this workspace’s WhatsApp conversations…' : state.status === 'empty' ? 'Choose a client to open their concierge.' : state.error}</p>
      </div></header>
    </main>;
  }

  return <WhatsAppExperience
    dark={dark}
    setDark={setDark}
    liveConversations={state.conversations}
    clientName={clientName}
    liveMetrics={state.metrics}
    liveQuickReplies={state.replies}
    onSendMessage={handleSend}
  />;
}
