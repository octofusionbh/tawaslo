import { supabase } from './supabase';
import { readLogoDraft, clearLogoDraft } from './logoDraftStore';

const ACCOUNT_TYPES = new Set(['agency', 'corporate', 'freelancer']);
const PLANS = new Set(['starter', 'professional', 'agency', 'studio']);
const INDUSTRIES = new Set(['restaurant', 'hospitality', 'shop', 'services', 'other']);
const LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const running = new Map();
const uploaded = new Map();

function setupError(message, code = 'setup_incomplete') {
  const error = new Error(message);
  error.code = code;
  return error;
}
function newUuid() {
  const source = typeof window !== 'undefined' ? window.crypto : null;
  if (source?.randomUUID) return source.randomUUID();
  if (!source?.getRandomValues) throw setupError('Your browser could not prepare the account. Please try again.');
  const bytes = source.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}
function validateSetup(setup) {
  if (!setup || setup.version !== 1 || !UUID.test(setup.initialClientId || '')) throw setupError('We could not read your saved setup. Contact support so we can help finish your account.');
  if (!ACCOUNT_TYPES.has(setup.accountType) || !PLANS.has(setup.selectedPlan) || !['monthly', 'yearly'].includes(setup.billing)) throw setupError('Your saved account choices need to be checked. Contact support for help.');
  if (typeof setup.name !== 'string' || !setup.name.trim() || setup.name.length > 150 || typeof setup.companyName !== 'string' || !setup.companyName.trim() || setup.companyName.length > 200) throw setupError('Your saved name or organisation needs to be checked.');
  if (!Array.isArray(setup.industries) || !setup.industries.length || setup.industries.some(item => !INDUSTRIES.has(item))) throw setupError('Your saved industry choices need to be checked.');
  if (setup.logo && (!LOGO_TYPES.has(setup.logo.type) || !setup.logo.size || setup.logo.size > 5 * 1024 * 1024)) throw setupError('Your saved logo details need to be checked.');
  return setup;
}
export function buildSignupSetup({ fullName, companyName, accountType, selectedPlan, billing, industries, logoFile }) {
  const setup = {
    version: 1,
    name: String(fullName || '').trim(),
    companyName: String(companyName || '').trim(),
    accountType,
    selectedPlan,
    billing,
    industries: [...new Set(Array.isArray(industries) ? industries : [])],
    initialClientId: newUuid(),
    logo: logoFile ? { name: String(logoFile.name || 'Organisation logo').slice(0, 200), type: logoFile.type, size: logoFile.size } : null,
    createdAt: new Date().toISOString(),
  };
  return validateSetup(setup);
}
export function getPendingSetup(user) {
  const setup = user?.user_metadata?.tawaslo_setup;
  return setup && !setup.completedAt ? setup : null;
}
async function verifiedUser(expectedUser) {
  if (!expectedUser?.id) throw setupError('Sign in again to finish setting up your workspace.', 'session_required');
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user || data.user.id !== expectedUser.id) throw setupError('Your session changed. Sign in to the right account and try again.', 'session_required');
  return data.user;
}
export async function updateAccountSetupMetadata(user, patch) {
  const current = await verifiedUser(user);
  const currentSetup = current.user_metadata?.tawaslo_setup;
  if (!currentSetup || currentSetup.initialClientId !== user.user_metadata?.tawaslo_setup?.initialClientId) throw setupError('Your saved setup changed. Refresh and try again.');
  const { data, error } = await supabase.auth.updateUser({
    data: { ...current.user_metadata, tawaslo_setup: { ...currentSetup, ...patch } },
  });
  if (error) throw error;
  if (!data?.user) throw setupError('We could not confirm that your setup was saved. Please try again.');
  return data.user;
}
async function readProfile(userId) {
  const result = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}
async function ensureProfile(user, setup) {
  const existing = await readProfile(user.id);
  if (existing) return existing;
  const result = await supabase.from('profiles').insert([{
    id: user.id, name: setup.name, email: user.email, plan: 'trial',
    role: 'owner', account_type: setup.accountType, company_name: setup.companyName,
  }]).select().single();
  if (result.error?.code === '23505') {
    const recovered = await readProfile(user.id);
    if (recovered) return recovered;
  }
  if (result.error) throw result.error;
  if (!result.data) throw setupError('The profile could not be saved. Please try again.');
  return result.data;
}
function missingIndustries(error) {
  return !!error && ['42703', 'PGRST204'].includes(error.code) && /\bindustries\b/i.test(error.message || '');
}
async function readInitialClient(userId, setup) {
  const exact = await supabase.from('clients').select('*').eq('id', setup.initialClientId).eq('owner_id', userId).maybeSingle();
  if (exact.error) throw exact.error;
  if (exact.data) return exact.data;
  // Preserve an already-created brand from an earlier signup attempt.
  const existing = await supabase.from('clients').select('*').eq('owner_id', userId).order('created_at', { ascending: true }).limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  return existing.data;
}
async function ensureClient(user, setup) {
  const existing = await readInitialClient(user.id, setup);
  if (existing) return existing;
  const primary = { hospitality: 'restaurant', other: 'services' }[setup.industries[0]] || setup.industries[0];
  const row = {
    id: setup.initialClientId, owner_id: user.id, name: setup.companyName,
    plan: 'Trial', status: 'active', is_free: false,
    account_type: setup.accountType, business_type: primary, industries: setup.industries,
  };
  let result = await supabase.from('clients').insert([row]).select().single();
  if (missingIndustries(result.error)) {
    const { industries, ...legacyRow } = row;
    result = await supabase.from('clients').insert([legacyRow]).select().single();
  }
  if (result.error?.code === '23505') {
    const recovered = await readInitialClient(user.id, setup);
    if (recovered) return recovered;
  }
  if (result.error) throw result.error;
  if (!result.data) throw setupError('The workspace could not be saved. Please try again.');
  return result.data;
}
function logoRevision(setup) {
  if (!setup.logoRevision) return '';
  if (typeof setup.logoRevision !== 'string' || !/^[a-zA-Z0-9_-]{1,40}$/.test(setup.logoRevision)) throw setupError('Your logo reference needs to be checked. Choose the file again.');
  return setup.logoRevision;
}
function logoCacheKey(user, setup, revision) {
  return user.id + ':' + setup.initialClientId + ':' + (revision || 'original');
}
async function updateLogo(table, row, userId, url, replace = false) {
  if (row.logo_url === url || (row.logo_url && !replace)) return row;
  let query = supabase.from(table).update({ logo_url: url }).eq('id', row.id);
  if (table === 'clients') query = query.eq('owner_id', userId);
  const { data, error } = await query.select().single();
  if (error) throw error;
  if (!data) throw setupError('Your logo could not be attached to the workspace. Please try again.');
  return data;
}
async function completeLogo(user, setup, profile, client) {
  const revision = logoRevision(setup);
  if (!revision && profile.logo_url && client.logo_url) return { user, client };
  const cacheKey = logoCacheKey(user, setup, revision);
  let url = (!revision && (profile.logo_url || client.logo_url)) || uploaded.get(cacheKey) || setup.logoUpload?.url;
  if (!url) {
    const file = await readLogoDraft(setup.initialClientId);
    if (!file) throw setupError('Your account details are saved. Attach your logo again to finish, or continue without it.', 'logo_missing');
    if (!LOGO_TYPES.has(file.type) || !file.size || file.size > 5 * 1024 * 1024) throw setupError('Choose a PNG, JPG or WebP logo smaller than 5 MB.', 'logo_invalid');
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = user.id + '/workspace-logo-' + setup.initialClientId + (revision ? '-' + revision : '') + '.' + extension;
    const bucket = supabase.storage.from('media');
    const { error } = await bucket.upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data } = bucket.getPublicUrl(path);
    if (!data?.publicUrl) throw setupError('Your logo was uploaded but its address could not be saved. Please try again.');
    url = data.publicUrl;
    uploaded.set(cacheKey, url);
    user = await updateAccountSetupMetadata(user, { logoUpload: { path, url } });
  }
  await updateLogo('profiles', profile, user.id, url, !!revision);
  const updatedClient = await updateLogo('clients', client, user.id, url, !!revision);
  return { user, client: updatedClient };
}
async function finish(user, setup, client, logoStatus) {
  const updatedUser = await updateAccountSetupMetadata(user, {
    completedAt: new Date().toISOString(), clientId: client.id, logoStatus,
  });
  // The account is complete even when this browser blocks local cleanup.
  try { await clearLogoDraft(setup.initialClientId); } catch (_) {}
  const cachePrefix = user.id + ':' + setup.initialClientId + ':';
  for (const key of uploaded.keys()) if (key.startsWith(cachePrefix)) uploaded.delete(key);
  return { status: 'ready', user: updatedUser, client };
}
async function runCompletion(expectedUser, skipLogo) {
  if (!getPendingSetup(expectedUser)) return { status: 'ready', user: expectedUser };
  let user = await verifiedUser(expectedUser);
  const rawSetup = getPendingSetup(user);
  if (!rawSetup) return { status: 'ready', user };
  const setup = validateSetup(rawSetup);
  const profile = await ensureProfile(user, setup);
  let client = await ensureClient(user, setup);
  if (setup.logo && !skipLogo) {
    try {
      const result = await completeLogo(user, setup, profile, client);
      user = result.user;
      client = result.client;
    } catch (logoError) {
      return { status: 'logo-required', user, setup, client, logoError };
    }
  }
  return finish(user, setup, client, setup.logo ? skipLogo ? 'deferred' : 'saved' : 'not-requested');
}
function deduplicated(user, skipLogo) {
  const key = user?.id || 'missing-user';
  if (running.has(key)) return running.get(key);
  const promise = runCompletion(user, skipLogo).finally(() => {
    if (running.get(key) === promise) running.delete(key);
  });
  running.set(key, promise);
  return promise;
}
export function completeAccountSetup(user) {
  return deduplicated(user, false);
}
export function finishAccountSetupWithoutLogo(user) {
  return deduplicated(user, true);
}
