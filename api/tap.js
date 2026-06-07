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

  // Tap webhooks POST the charge object (no plan field). Email the team on a successful capture.
  if (!req.body || !req.body.plan) {
    try {
      const c = req.body || {};
      if (c.status === 'CAPTURED') {
        const cur = c.currency || 'USD';
        const who = (c.customer && (c.customer.email || [c.customer.first_name, c.customer.last_name].filter(Boolean).join(' '))) || 'A customer';
        const plan = (c.metadata && c.metadata.plan) || 'a plan';
        const period = (c.metadata && c.metadata.period) || '';
        await notify(`💰 New Tawaslo purchase — ${cur} ${c.amount}`,
          `<div style="font-family:sans-serif"><h2 style="margin:0 0 8px">New purchase 🎉</h2>
           <p><b>${who}</b> just paid <b>${cur} ${c.amount}</b> for the <b>${plan}</b> plan${period ? ` (${period})` : ''}.</p>
           <p style="color:#667">Charge ID: ${c.id || '—'}</p></div>`);
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
