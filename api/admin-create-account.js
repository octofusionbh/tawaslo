import crypto from 'node:crypto';

// api/admin-create-account.js — Tawaslo HQ only.
// Public sign-ups are closed, so new client accounts are created from the HQ
// dashboard. This route creates the auth user with the same `tawaslo_setup`
// metadata the normal sign-up writes, so the existing setup gate builds the
// workspace on the person's first sign-in. It then emails them a link to set
// their own password — no password is ever handled here.

const SUPA = process.env.SUPABASE_URL || 'https://oarlmvhgvinldkbprnfo.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const ADMIN_EMAILS = String(process.env.TAWASLO_ADMIN_EMAILS || 'demo@tawaslo.com,octofusionbh@gmail.com')
  .split(',').map(value => value.trim().toLowerCase()).filter(Boolean);

const ACCOUNT_TYPES = new Set(['agency', 'corporate', 'freelancer']);
const PLANS = new Set(['starter', 'professional', 'agency', 'studio']);
const INDUSTRIES = new Set(['restaurant', 'hospitality', 'shop', 'services', 'other']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') { try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; } }
  return req.body;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!SERVICE_KEY) return res.status(500).json({ error: 'Server is not configured for account creation.' });

  // 1. Who is asking? The caller must send their own Supabase access token.
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Sign in again and retry.' });

  let caller = null;
  try {
    const meRes = await fetch(`${SUPA}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return res.status(401).json({ error: 'Sign in again and retry.' });
    caller = await meRes.json();
  } catch (e) {
    return res.status(502).json({ error: 'Could not verify your session.' });
  }
  const callerEmail = String(caller?.email || '').toLowerCase();
  if (!callerEmail || !ADMIN_EMAILS.includes(callerEmail)) {
    return res.status(403).json({ error: 'Only Tawaslo HQ can create accounts.' });
  }

  // 2. Validate the new account details.
  const body = readBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const companyName = String(body.companyName || '').trim();
  const accountType = ACCOUNT_TYPES.has(body.accountType) ? body.accountType : 'agency';
  const plan = PLANS.has(body.plan) ? body.plan : 'professional';
  const billing = body.billing === 'yearly' ? 'yearly' : 'monthly';
  const industry = INDUSTRIES.has(body.industry) ? body.industry : 'other';

  if (!EMAIL.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!name || name.length > 150) return res.status(400).json({ error: 'Enter the person’s full name.' });
  if (!companyName || companyName.length > 200) return res.status(400).json({ error: 'Enter the company name.' });

  const setup = {
    version: 1,
    name,
    companyName,
    accountType,
    selectedPlan: plan,
    billing,
    industries: [industry],
    initialClientId: crypto.randomUUID(),
    logo: null,
    createdAt: new Date().toISOString(),
  };

  // 3. Create the account. email_confirm skips the confirmation email —
  // the password-setup email below is the one they receive.
  let created = {};
  try {
    const createRes = await fetch(`${SUPA}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, email_confirm: true, user_metadata: { full_name: name, tawaslo_setup: setup } }),
    });
    created = await createRes.json().catch(() => ({}));
    if (!createRes.ok) {
      const message = String(created?.msg || created?.message || created?.error_description || '');
      if (/already|exists|registered/i.test(message)) return res.status(409).json({ error: 'An account already uses that email.' });
      return res.status(502).json({ error: message || 'Could not create the account.' });
    }
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach the account service.' });
  }

  // 4. Email them a link to choose their own password.
  let emailSent = false;
  try {
    const recoverRes = await fetch(`${SUPA}/auth/v1/recover`, {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    emailSent = recoverRes.ok;
  } catch (e) { emailSent = false; }

  return res.status(200).json({ ok: true, userId: created?.id || null, emailSent });
}
