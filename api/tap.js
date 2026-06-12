// api/tap.js — Tap Payments checkout (create charge + verify + webhook)
// Uses TAP_SECRET_KEY (sk_test_... or sk_live_...) from Vercel env. Runs in test mode until live keys are set.
const PRICES = {
  Essential:   { monthly: 49,  annual: 39  },
  Professional:{ monthly: 99,  annual: 79  },
  Enterprise:  { monthly: 199, annual: 159 },
};

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

  // Tap webhooks POST the charge object (no plan field).
  if (!req.body || !req.body.plan) {
    try {
      const c = req.body || {};
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

  const { plan, period, name, email } = req.body;
  const amount = (PRICES[plan] || PRICES.Professional)[period === 'annual' ? 'annual' : 'monthly'];

  try {
    const r = await fetch('https://api.tap.company/v2/charges/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount, currency: 'USD', customer_initiated: true, threeDSecure: true,
        description: `Tawaslo ${plan} plan (${period || 'monthly'})`,
        metadata: { plan, period: period || 'monthly' },
        reference: { transaction: `tw_${Date.now()}` },
        customer: { first_name: (name || 'Customer').split(' ')[0] || 'Customer', email: email || 'billing@tawaslo.com' },
        source: { id: 'src_all' },
        redirect: { url: 'https://tawaslo.com/?tap_return=1' },
        post: { url: 'https://tawaslo.com/api/tap' },
      }),
    });
    const d = await r.json();
    if (d && d.transaction && d.transaction.url) return res.status(200).json({ url: d.transaction.url, id: d.id });
    const msg = (d && d.errors && d.errors[0] && d.errors[0].description) || 'Could not start checkout';
    return res.status(400).json({ error: msg, details: d });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
