import crypto from 'node:crypto';
export const config = { api: { bodyParser: false } };
// api/tap.js — Tawaslo billing backend (Polar webhooks + discounts + customer portal; legacy Tap kept harmless).
// Uses TAP_SECRET_KEY (legacy) and POLAR_API_TOKEN + POLAR_WEBHOOK_SECRET from Vercel env.
const PRICES = {
  Essential:   { monthly: 49,  annual: 39  },
  Professional:{ monthly: 99,  annual: 79  },
  Enterprise:  { monthly: 199, annual: 159 },
};

// Supabase (service role) — used only to validate promo codes server-side so a
// discount can never be faked from the browser. Same env vars as /api/cron.
const SUPA = process.env.SUPABASE_URL || 'https://gtjmpmhsiyqwhykunosc.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
function sbq(path, opts = {}) {
  return fetch(`${SUPA}/rest/v1/${path}`, {
    ...opts,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
}

// ── Polar (Merchant of Record) — signed webhooks, discount sync, customer portal. ──
const POLAR_API = 'https://api.polar.sh';
const POLAR_TOKEN = process.env.POLAR_API_TOKEN;
const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET;

function readRawBody(req) {
  return new Promise((resolve) => { const chunks = []; req.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))); req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', () => resolve(Buffer.alloc(0))); });
}
// Standard Webhooks signature verification (https://www.standardwebhooks.com/).
function verifyPolarSig(rawBody, headers) {
  try {
    if (!POLAR_WEBHOOK_SECRET) return false;
    const id = headers['webhook-id'], ts = headers['webhook-timestamp'], sigH = headers['webhook-signature'];
    if (!id || !ts || !sigH) return false;
    const bodyBuf = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ''), 'utf8');
    const signed = Buffer.concat([Buffer.from(`${id}.${ts}.`, 'utf8'), bodyBuf]);
    // Polar's SDK base64-encodes the FULL secret (incl. the "polar_whs_" prefix) and
    // feeds it to Standard Webhooks — net effect: the HMAC key is the raw UTF-8 bytes
    // of the whole secret string. We try that first, then fall back to other encodings.
    const full = (POLAR_WEBHOOK_SECRET || '').trim();
    const stripped = full.startsWith('polar_whs_') ? full.slice(10) : (full.startsWith('whsec_') ? full.slice(6) : full);
    const keys = [];
    keys.push(Buffer.from(full, 'utf8'));            // Polar's actual method
    try { const b = Buffer.from(stripped, 'base64'); if (b.length) keys.push(b); } catch (e) {}
    keys.push(Buffer.from(stripped, 'utf8'));
    const sigs = String(sigH).split(' ').map(p => (p.includes(',') ? p.split(',')[1] : p));
    return keys.some(key => {
      const expected = crypto.createHmac('sha256', key).update(signed).digest('base64');
      return sigs.some(s => { try { return crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)); } catch (e) { return s === expected; } });
    });
  } catch (e) { return false; }
}
function polarPlanFromName(name) { const n = String(name || ''); return /enterprise/i.test(n) ? 'Enterprise' : /professional/i.test(n) ? 'Professional' : /essential/i.test(n) ? 'Essential' : null; }

// Create a Polar discount that mirrors an owner-dashboard promo code.
async function polarCreateDiscount(b) {
  if (!POLAR_TOKEN) return { ok: false, data: { detail: 'POLAR_API_TOKEN not set' } };
  const body = { name: b.name || b.code, code: b.code, duration: b.duration || 'once', metadata: { source: 'tawaslo' } };
  if (b.maxRedemptions) body.max_redemptions = Number(b.maxRedemptions);
  if (b.endsAt) body.ends_at = b.endsAt;
  if (Array.isArray(b.products) && b.products.length) body.products = b.products;
  if (b.percent != null) { body.type = 'percentage'; body.basis_points = Math.round(Number(b.percent) * 100); }
  else { body.type = 'fixed'; body.amounts = { usd: Math.round(Number(b.amount || 0) * 100) }; }
  const r = await fetch(`${POLAR_API}/v1/discounts/`, { method: 'POST', headers: { Authorization: `Bearer ${POLAR_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, data };
}
// Create a Customer Portal session so a customer can self-manage / cancel.
async function polarPortalSession(customerId, email) {
  if (!POLAR_TOKEN) return { ok: false, error: 'POLAR_API_TOKEN not set' };
  const payload = customerId ? { customer_id: customerId } : { customer_external_id: email };
  const r = await fetch(`${POLAR_API}/v1/customer-sessions/`, { method: 'POST', headers: { Authorization: `Bearer ${POLAR_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, url: data.customer_portal_url || null, data };
}
// Handle a verified Polar webhook event → keep the subscriptions table in sync.
// Ask Polar's API for a customer's current subscription (robust, event-shape-independent).
async function polarActiveSub(customerId) {
  if (!POLAR_TOKEN || !customerId) return null;
  try {
    const r = await fetch(`${POLAR_API}/v1/subscriptions/?customer_id=${encodeURIComponent(customerId)}&limit=10`, { headers: { Authorization: `Bearer ${POLAR_TOKEN}` } });
    const d = await r.json().catch(() => ({}));
    const items = (d && d.items) || [];
    if (!items.length) return null;
    return items.find(s => s.status === 'active' || s.status === 'trialing') || items[0];
  } catch (e) { return null; }
}

async function handlePolarWebhook(evt) {
  const type = evt && evt.type; const data = (evt && evt.data) || {};
  if (!type) return { ignored: 'no-type' };
  // Checkout events arrive reliably; write the subscription row from a completed checkout.
  if (type === 'checkout.updated' || type === 'checkout.created') {
    const custId = data.customer_id || (data.customer && data.customer.id) || null;
    const sub = await polarActiveSub(custId);   // ask Polar for the real subscription
    if (!sub) return { checkout: true, status: data.status, noSubYet: true, custId: !!custId, hasToken: !!POLAR_TOKEN };
    const row = {
      email: (sub.customer && sub.customer.email) || data.customer_email || null,
      customer_id: custId,
      polar_subscription_id: sub.id,
      plan: polarPlanFromName((sub.product && sub.product.name) || (data.product && data.product.name)),
      interval: sub.recurring_interval || (sub.product && sub.product.recurring_interval) || null,
      status: sub.status || 'active',
      current_period_end: sub.current_period_end || null,
      updated_at: new Date().toISOString(),
    };
    let dbStatus = 0, dbErr = '';
    try { const r = await sbq(`subscriptions?on_conflict=polar_subscription_id`, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row) }); dbStatus = r.status; if (!r.ok) dbErr = (await r.text() || '').slice(0, 140); } catch (e) { dbErr = String((e && e.message) || e).slice(0, 140); }
    return { checkout: true, viaApi: true, email: row.email, plan: row.plan, wrote: dbStatus >= 200 && dbStatus < 300, dbStatus, dbErr, hasServiceKey: !!SERVICE_KEY };
  }
  if (type.indexOf('subscription.') === 0) {
    const cust = data.customer || {};
    const status = (type === 'subscription.canceled' || type === 'subscription.revoked') ? 'canceled' : (data.status || 'active');
    const row = {
      email: cust.email || data.user_email || null,
      customer_id: cust.id || data.customer_id || null,
      polar_subscription_id: data.id || null,
      plan: polarPlanFromName((data.product && data.product.name) || data.product_name),
      interval: data.recurring_interval || (data.product && data.product.recurring_interval) || null,
      status,
      current_period_end: data.current_period_end || data.ends_at || null,
      updated_at: new Date().toISOString(),
    };
    let dbStatus = 0, dbErr = '';
    try { const r = await sbq(`subscriptions?on_conflict=polar_subscription_id`, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row) }); dbStatus = r.status; if (!r.ok) { dbErr = (await r.text() || '').slice(0, 140); } } catch (e) { dbErr = String((e && e.message) || e).slice(0, 140); }
    return { sub: true, email: row.email, plan: row.plan, subId: !!row.polar_subscription_id, wrote: dbStatus >= 200 && dbStatus < 300, dbStatus, dbErr, hasServiceKey: !!SERVICE_KEY };
  }
  if (type === 'order.paid' || type === 'order.created') {
    const cust = data.customer || {};
    const cur = String(data.currency || 'usd').toUpperCase();
    const amt = data.total_amount != null ? (data.total_amount / 100) : (data.amount != null ? data.amount : '');
    if (cust.email) { try { await sendToCustomer(cust.email, 'Your Tawaslo receipt', receiptHtml({ plan: polarPlanFromName(data.product && data.product.name) || '', period: '', amount: amt, currency: cur, invoiceNo: data.id || `TW-${Date.now()}`, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), last4: '' })); } catch (e) {} }
    try { await notify(`New Tawaslo subscription: ${cur} ${amt}`, `<div style="font-family:sans-serif"><p><b>${cust.email || 'A customer'}</b> just subscribed via Polar. Order ${data.id || ''}.</p></div>`); } catch (e) {}
  }
}

// Look a code up in promo_codes and apply every rule: active, not expired,
// under its usage limit, and valid for this plan. Returns a normalized result.
async function lookupPromo(rawCode, plan) {
  if (!SERVICE_KEY || !rawCode) return { valid: false, reason: 'unavailable' };
  const code = String(rawCode).toUpperCase().replace(/\s/g, '');
  try {
    const r = await sbq(`promo_codes?code=eq.${encodeURIComponent(code)}&select=*&limit=1`);
    const rows = r.ok ? await r.json() : [];
    const row = rows && rows[0];
    if (!row) return { valid: false, reason: 'notfound' };
    if (row.active === false) return { valid: false, reason: 'inactive' };
    if (row.expiry) { const exp = new Date(row.expiry); if (isFinite(exp.getTime()) && exp < new Date(new Date().toDateString())) return { valid: false, reason: 'expired' }; }
    const limit = Number(row.usage_limit) || 0, uses = Number(row.uses) || 0;
    if (limit > 0 && uses >= limit) return { valid: false, reason: 'limit' };
    const applies = row.applies_to || 'All plans';
    if (plan && applies !== 'All plans' && applies !== plan) return { valid: false, reason: 'plan', applies };
    const type = row.discount_type === 'fixed' ? 'fixed' : 'percent';
    const value = Number(row.discount_value) || 0;
    const label = type === 'percent' ? `${value}% off` : `$${value} off`;
    return { valid: true, id: row.id, code, type, value, label, applies, uses, limit };
  } catch (e) { return { valid: false, reason: 'error' }; }
}

function applyDiscount(amount, type, value) {
  let a = type === 'percent' ? amount * (1 - (value / 100)) : amount - value;
  a = Math.round(a * 100) / 100;
  return Math.max(1, a); // Tap requires a positive charge
}

// Email the Tawaslo team about an event. No-op until RESEND_API_KEY is set in Vercel,
// so this is safe to ship now and "just works" once email is configured later.
//   RESEND_API_KEY  — from resend.com
//   NOTIFY_EMAIL    — where alerts go (default support@tawaslo.com; comma-separate for several)
//   NOTIFY_FROM     — verified sender (default "Tawaslo <notifications@tawaslo.com>")
async function notify(subject, html) {
  const KEY = process.env.RESEND_API_KEY;
  if (!KEY) return; // email not connected yet
  const to = (process.env.NOTIFY_EMAIL || 'support@tawaslo.com').split(',').map(s => s.trim());
  const from = process.env.NOTIFY_FROM || 'Tawaslo <notifications@tawaslo.com>';
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
  } catch (e) { /* notifications must never break the payment flow */ }
}

// Send a branded email to a customer (receipt / payment issue). Safe no-op until RESEND_API_KEY is set.
async function sendToCustomer(to, subject, html) {
  const KEY = process.env.RESEND_API_KEY;
  if (!KEY || !to) return;
  const from = process.env.BILLING_FROM || 'Tawaslo <billing@tawaslo.com>';
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
  } catch (e) { /* never break the payment flow */ }
}

const EMAIL_FOOTER = `
  <tr><td style="background:#060810;padding:24px 40px;text-align:center;border-top:1px solid #1E2838;">
    <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 12px;"><tr>
      <td style="padding:0 13px;"><a href="https://www.instagram.com/tawaslo" style="font-size:11px;font-weight:700;letter-spacing:1px;color:#9FB0C8;text-decoration:none;">INSTAGRAM</a></td>
      <td style="color:#243A57;font-size:12px;">&middot;</td>
      <td style="padding:0 13px;"><a href="https://www.linkedin.com/company/tawaslo" style="font-size:11px;font-weight:700;letter-spacing:1px;color:#9FB0C8;text-decoration:none;">LINKEDIN</a></td>
      <td style="color:#243A57;font-size:12px;">&middot;</td>
      <td style="padding:0 13px;"><a href="https://tawaslo.com" style="font-size:11px;font-weight:700;letter-spacing:1px;color:#9FB0C8;text-decoration:none;">WEBSITE</a></td>
    </tr></table>
    <div style="font-size:11px;color:#3D5068;">&copy; 2026 Tawaslo. All rights reserved.</div>
  </td></tr>`;

function emailShell(inner) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="color-scheme" content="dark"/></head>
  <body style="margin:0;padding:0;background:#080B11;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#080B11;padding:32px 16px;"><tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:560px;background:#0F141C;border-radius:16px;border:1px solid #1E2838;overflow:hidden;">
    <tr><td style="background:#060810;padding:18px 30px;border-bottom:1px solid #1E2838;">
      <img src="https://tawaslo.com/logo-transparent.png" width="26" height="26" alt="" style="vertical-align:middle;border:0;"/>
      <span style="color:#E8EFF8;font-size:17px;font-weight:800;letter-spacing:-0.3px;vertical-align:middle;padding-left:8px;">Tawaslo</span>
    </td></tr>
    ${inner}
    ${EMAIL_FOOTER}
  </table></td></tr></table></body></html>`;
}

function receiptHtml({ plan, period, amount, currency, invoiceNo, date, last4 }) {
  const row = (l, v) => `<tr><td style="font-size:12.5px;color:#7A8BA8;padding:0 0 10px;">${l}</td><td align="right" style="font-size:12.5px;color:#E8EFF8;font-weight:700;padding:0 0 10px;">${v}</td></tr>`;
  return emailShell(`
    <tr><td style="padding:34px 40px 6px;">
      <div style="display:inline-block;background:rgba(16,185,129,0.14);color:#10B981;font-size:11px;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;padding:5px 12px;border-radius:20px;border:1px solid rgba(16,185,129,0.3);margin-bottom:16px;">Payment received</div>
      <h1 style="margin:0 0 6px;font-size:23px;font-weight:800;color:#E8EFF8;letter-spacing:-0.4px;">Thank you, your payment is confirmed</h1>
      <p style="margin:0;font-size:13.5px;line-height:1.7;color:#A8B9CE;">Here is your receipt for the Tawaslo ${plan} plan. A copy is saved in your billing history.</p>
    </td></tr>
    <tr><td style="padding:20px 40px 6px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid #1E2838;border-radius:12px;"><tr><td style="padding:22px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${row('Plan', 'Tawaslo ' + plan)}${row('Billing period', period)}${row('Invoice number', invoiceNo)}${row('Date', date)}${row('Payment method', 'Card ending ' + last4)}
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1E2838;"><tr><td style="font-size:14px;color:#E8EFF8;font-weight:800;padding:14px 0 0;">Total paid</td><td align="right" style="font-size:20px;color:#6E8CAB;font-weight:800;padding:14px 0 0;">${currency} ${amount}</td></tr></table>
      </td></tr></table>
    </td></tr>
    <tr><td style="padding:18px 40px 36px;text-align:center;">
      <table cellpadding="0" cellspacing="0" align="center"><tr><td align="center" bgcolor="#6E8CAB" style="border-radius:11px;background:linear-gradient(135deg,#6E8CAB,#4F6B8C);">
        <a href="https://tawaslo.com" style="display:inline-block;padding:14px 34px;font-size:14px;font-weight:700;color:#FFFFFF;border-radius:11px;text-decoration:none;">View billing history</a>
      </td></tr></table>
      <p style="margin:14px 0 0;font-size:12px;color:#7A8BA8;">Need a tax invoice or have a billing question? Reply to this email.</p>
    </td></tr>`);
}

function paymentFailedHtml({ firstName, plan, amount, currency }) {
  return emailShell(`
    <tr><td style="padding:34px 40px 6px;">
      <div style="display:inline-block;background:rgba(239,68,68,0.14);color:#EF4444;font-size:11px;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;padding:5px 12px;border-radius:20px;border:1px solid rgba(239,68,68,0.3);margin-bottom:16px;">Action needed</div>
      <h1 style="margin:0 0 10px;font-size:23px;font-weight:800;color:#E8EFF8;letter-spacing:-0.4px;">We could not process your payment</h1>
      <p style="margin:0;font-size:13.5px;line-height:1.7;color:#A8B9CE;">Hi ${firstName}, the payment of ${currency} ${amount} for your Tawaslo ${plan} plan did not go through. This usually happens when a card expires or has insufficient funds.</p>
    </td></tr>
    <tr><td style="padding:20px 40px 36px;text-align:center;">
      <table cellpadding="0" cellspacing="0" align="center"><tr><td align="center" bgcolor="#6E8CAB" style="border-radius:11px;background:linear-gradient(135deg,#6E8CAB,#4F6B8C);">
        <a href="https://tawaslo.com" style="display:inline-block;padding:15px 38px;font-size:15px;font-weight:700;color:#FFFFFF;border-radius:11px;text-decoration:none;">Update payment method</a>
      </td></tr></table>
      <p style="margin:14px 0 0;font-size:12px;color:#7A8BA8;">Already fixed it? You can ignore this email. Questions? Just reply.</p>
    </td></tr>`);
}

export default async function handler(req, res) {
  const KEY = process.env.TAP_SECRET_KEY;

  // Validate a promo code: GET /api/tap?promo=CODE&plan=Professional
  // (no Tap key needed — only checks the promo_codes table.)
  if (req.method === 'GET' && req.query && req.query.promo) {
    const v = await lookupPromo(req.query.promo, req.query.plan);
    return res.status(200).json(v);
  }

  // Verify a charge after redirect: GET /api/tap?charge_id=chg_xxx
  if (req.method === 'GET') {
    if (!KEY) return res.status(200).json({ configured: false });
    const id = req.query && req.query.charge_id;
    if (!id) return res.status(400).json({ error: 'charge_id required' });
    try {
      const r = await fetch(`https://api.tap.company/v2/charges/${id}`, { headers: { Authorization: `Bearer ${KEY}` } });
      const d = await r.json();
      return res.status(200).json({ status: d.status, amount: d.amount, currency: d.currency });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // bodyParser is disabled, so read the raw body (needed to verify Polar's signed webhooks).
  const rawBody = await readRawBody(req);

  // ── Polar webhook (Standard Webhooks, signed). ──
  if (req.headers['webhook-signature'] || req.headers['webhook-id']) {
    if (!verifyPolarSig(rawBody, req.headers)) return res.status(401).json({ error: 'invalid signature', debug: { bodyLen: (rawBody && rawBody.length) || 0, hasId: !!req.headers['webhook-id'], hasTs: !!req.headers['webhook-timestamp'], hasSig: !!req.headers['webhook-signature'], secretLen: (process.env.POLAR_WEBHOOK_SECRET || '').length } });
    let evt = {}; try { evt = JSON.parse(rawBody.toString('utf8')); } catch (e) {}
    let result = {}; try { result = (await handlePolarWebhook(evt)) || {}; } catch (e) { result = { error: String((e && e.message) || e) }; }
    return res.status(200).json({ received: true, type: evt && evt.type, ...result });
  }

  const rawStr = rawBody && rawBody.length ? rawBody.toString('utf8') : '';
  let body = {}; try { body = rawStr ? JSON.parse(rawStr) : {}; } catch (e) { body = {}; }

  // ── Owner dashboard → create a matching Polar discount for a promo code. ──
  if (body.action === 'polar_create_discount') {
    const out = await polarCreateDiscount(body);
    return res.status(out.ok ? 200 : 400).json(out.ok ? { ok: true, discount: out.data } : { ok: false, error: (out.data && out.data.detail) || 'create failed', data: out.data });
  }
  // ── Customer Portal session (Manage subscription / cancel). ──
  if (body.action === 'polar_portal') {
    const out = await polarPortalSession(body.customer_id, body.email);
    return res.status(out.ok ? 200 : 400).json(out);
  }

  // Tap webhooks POST the charge object (no plan field).
  if (!body || !body.plan) {
    try {
      const c = body || {};
      const cur = c.currency || 'USD';
      const email = c.customer && c.customer.email;
      const firstName = (c.customer && c.customer.first_name) || 'there';
      const plan = (c.metadata && c.metadata.plan) || 'Professional';
      const period = (c.metadata && c.metadata.period) || 'monthly';
      const last4 = (c.card && (c.card.last_four || c.card.last4)) || (c.source && c.source.last_four) || '0000';

      if (c.status === 'CAPTURED') {
        const who = email || [c.customer && c.customer.first_name, c.customer && c.customer.last_name].filter(Boolean).join(' ') || 'A customer';
        // 1) Notify the team (internal)
        await notify(`New Tawaslo purchase: ${cur} ${c.amount}`,
          `<div style="font-family:sans-serif"><h2 style="margin:0 0 8px">New purchase</h2>
           <p><b>${who}</b> just paid <b>${cur} ${c.amount}</b> for the <b>${plan}</b> plan${period ? ` (${period})` : ''}.</p>
           <p style="color:#667">Charge ID: ${c.id || 'n/a'}</p></div>`);
        // 2) Send the customer their receipt
        await sendToCustomer(email, `Your Tawaslo receipt: ${cur} ${c.amount}`, receiptHtml({
          plan, period: period === 'annual' ? 'Annual' : 'Monthly', amount: c.amount, currency: cur,
          invoiceNo: c.id || `TW-${Date.now()}`,
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          last4,
        }));
      } else if (c.status === 'DECLINED' || c.status === 'FAILED' || c.status === 'CANCELLED') {
        // Tell the customer the payment did not go through
        await sendToCustomer(email, 'Action needed: your Tawaslo payment did not go through', paymentFailedHtml({
          firstName, plan, amount: c.amount, currency: cur,
        }));
      }
    } catch (e) { /* ignore */ }
    return res.status(200).json({ received: true });
  }

  if (!KEY) return res.status(200).json({ configured: false, error: 'Payments not connected yet. Add TAP_SECRET_KEY in Vercel.' });

  const { plan, period, name, email, promo, addon, topup } = body;

  // One-time image-credit top-up — a standalone charge, no plan change.
  if (topup) {
    const TOPUPS = { t50: 14.9, t100: 24.9, t250: 49.9 };
    if (!TOPUPS[topup]) return res.status(400).json({ error: 'unknown top-up' });
    try {
      const r = await fetch('https://api.tap.company/v2/charges/', {
        method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({