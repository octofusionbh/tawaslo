import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oarlmvhgvinldkbprnfo.supabase.co';
const supabaseAnonKey = 'sb_publishable_1835PinpKR_mrrCbEcXi5g_DKzBeOA_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// AUTH FUNCTIONS
export const signUp = async (email, password, name, setup) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, ...(setup ? { tawaslo_setup: setup } : {}) },
      emailRedirectTo: `${window.location.origin}/?auth=confirm`,
    }
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// CLIENTS
export const getClients = async (ownerId) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createClient_ = async (clientData) => {
  const { data, error } = await supabase
    .from('clients')
    .insert([clientData])
    .select();
  return { data, error };
};

// POSTS
export const getPosts = async (clientId) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('client_id', clientId)
    .order('scheduled_at', { ascending: true });
  return { data, error };
};

export const createPost = async (postData) => {
  const { data, error } = await supabase
    .from('posts')
    .insert([postData])
    .select();
  return { data, error };
};

export const updatePost = async (postId, updates) => {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select();
  return { data, error };
};

export const deletePost = async (postId) => {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);
  return { error };
};

// INBOX
export const getInboxMessages = async (clientId) => {
  const { data, error } = await supabase
    .from('inbox_messages')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const markMessageRead = async (messageId) => {
  const { data, error } = await supabase
    .from('inbox_messages')
    .update({ is_read: true })
    .eq('id', messageId);
  return { data, error };
};

// ANALYTICS
export const getAnalytics = async (clientId) => {
  const { data, error } = await supabase
    .from('analytics')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false })
    .limit(30);
  return { data, error };
};

// CAMPAIGNS
export const getCampaigns = async (clientId) => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  return { data, error };
};

// SOCIAL ACCOUNTS
export const getSocialAccounts = async (clientId) => {
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('client_id', clientId);
  return { data, error };
};

// PROFILE
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select();
  return { data, error };
};

// CREATE PROFILE (called after signup)
export const createProfile = async (userId, name, email, plan = 'trial', accountType = 'agency', companyName = '') => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ id: userId, name, email, plan, role: 'owner', account_type: accountType, company_name: companyName || name }])
    .select()
    .single();
  return { data, error };
};

// CREATE INITIAL WORKSPACE CLIENT (called after signup)
export const createInitialClient = async (ownerId, companyName, plan, accountType, businessType = 'restaurant') => {
  const { data: existingArr } = await supabase
    .from('clients')
    .select('id')
    .eq('owner_id', ownerId)
    .limit(1);
  if (existingArr && existingArr.length > 0) return { data: existingArr[0] };
  const planLabel = plan === 'starter' ? 'Essential' : plan === 'agency' ? 'Enterprise' : plan === 'studio' ? 'Studio' : 'Professional';
  const allowed = new Set(['restaurant', 'hospitality', 'shop', 'services', 'other']);
  const industries = [...new Set((Array.isArray(businessType) ? businessType : String(businessType || '').split(','))
    .map(value => String(value).trim().toLowerCase())
    .filter(value => allowed.has(value)))];
  if (!industries.length) industries.push('restaurant');
  // Keep the legacy single-value field compatible with product views while the
  // full selection lives in `industries`.
  const legacyType = { hospitality: 'restaurant', other: 'services' }[industries[0]] || industries[0];
  const row = {
    owner_id: ownerId,
    name: companyName,
    plan: planLabel,
    status: 'active',
    is_free: false,
    account_type: accountType,
    business_type: legacyType,
    industries,
  };
  let result = await supabase.from('clients').insert([row]).select().single();
  // Safe rollout: older environments may not have the new array column yet.
  // Keep signup working there while preserving a compatible primary type.
  if (result.error && /industries/i.test(String(result.error.message || result.error))) {
    const legacyRow = { ...row };
    delete legacyRow.industries;
    result = await supabase.from('clients').insert([legacyRow]).select().single();
  }
  return result;
};

// AUTO-CREATE OCTO FUSION FREE CLIENT (called on first login for Octo Fusion email)
export const ensureOctoFusionClient = async (ownerId) => {
  const { data: existingArr } = await supabase
    .from('clients')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('name', 'Octo Fusion')
    .limit(1);
  if (existingArr && existingArr.length > 0) return { data: existingArr[0] };
  const { data, error } = await supabase
    .from('clients')
    .insert([{
      owner_id: ownerId,
      name: 'Octo Fusion',
      plan: 'Internal',
      status: 'active',
      is_free: true,
    }])
    .select()
    .single();
  return { data, error };
};

// AUTH — reset password email
export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/?auth=recovery`,
  });
  return { data, error };
};

// AUTH — set a new password (used after clicking the reset link)
export const updatePassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
};

// ───────────────────────── TAWASLO HQ (admin) ─────────────────────────
// PROMO CODES
export const getPromoCodes = async () => {
  const { data, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
  return { data, error };
};
export const createPromoCode = async (row) => {
  const { data, error } = await supabase.from('promo_codes').insert([row]).select();
  return { data, error };
};
export const updatePromoCode = async (id, updates) => {
  const { data, error } = await supabase.from('promo_codes').update(updates).eq('id', id).select();
  return { data, error };
};
export const deletePromoCode = async (id) => {
  const { error } = await supabase.from('promo_codes').delete().eq('id', id);
  return { error };
};

// GIFT CARDS
export const getGiftCards = async () => {
  const { data, error } = await supabase.from('gift_cards').select('*').order('created_at', { ascending: false });
  return { data, error };
};
export const createGiftCard = async (row) => {
  const { data, error } = await supabase.from('gift_cards').insert([row]).select();
  return { data, error };
};
export const updateGiftCard = async (id, updates) => {
  const { data, error } = await supabase.from('gift_cards').update(updates).eq('id', id).select();
  return { data, error };
};

// SUPPORT TICKETS + MESSAGES
export const getSupportTickets = async () => {
  const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
  return { data, error };
};
export const createSupportTicket = async (row) => {
  const { data, error } = await supabase.from('support_tickets').insert([row]).select().single();
  return { data, error };
};
export const updateSupportTicket = async (id, updates) => {
  const { data, error } = await supabase.from('support_tickets').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select();
  return { data, error };
};
export const getSupportMessages = async (ticketId) => {
  const { data, error } = await supabase.from('support_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
  return { data, error };
};
export const addSupportMessage = async (ticketId, sender, body) => {
  const { data, error } = await supabase.from('support_messages').insert([{ ticket_id: ticketId, sender, body }]).select();
  return { data, error };
};

// INVOICES
export const getInvoices = async (clientId) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  return { data, error };
};

// ───────────────────────── TEAM MEMBERS / INVITES ─────────────────────────
export const getTeam = async (ownerId) => {
  const { data, error } = await supabase
    .from('team_members').select('*').eq('owner_id', ownerId)
    .order('created_at', { ascending: true });
  return { data, error };
};

export const inviteTeamMember = async (ownerId, email, role = 'Editor', name = null, hq = false) => {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const { data, error } = await supabase
    .from('team_members')
    .upsert([{ owner_id: ownerId, email: email.trim().toLowerCase(), role, name, hq, status: 'pending', token, updated_at: new Date().toISOString() }], { onConflict: 'owner_id,email' })
    .select()
    .single();
  return { data, error };
};

export const updateTeamMemberRole = async (id, role) => {
  const { data, error } = await supabase.from('team_members').update({ role, updated_at: new Date().toISOString() }).eq('id', id).select();
  return { data, error };
};

export const removeTeamMember = async (id) => {
  const { error } = await supabase.from('team_members').delete().eq('id', id);
  return { error };
};

// Called on login: attach the user to any workspace they were invited to.
export const claimInvites = async (userId, email) => {
  if (!userId || !email) return { data: null };
  const { data, error } = await supabase
    .from('team_members')
    .update({ member_id: userId, status: 'active', updated_at: new Date().toISOString() })
    .eq('status', 'pending')
    .ilike('email', email.trim().toLowerCase())
    .select();
  return { data, error };
};

// The workspace this user belongs to as a member (owner_id), if any.
export const getMyWorkspace = async (userId) => {
  if (!userId) return { data: null };
  const { data, error } = await supabase
    .from('team_members')
    .select('owner_id, role, hq')
    .eq('member_id', userId).eq('status', 'active')
    .limit(1).maybeSingle();
  return { data, error };
};
// ───────────────────────── ERROR LOGS (HQ) ─────────────────────────
// Best-effort crash capture. Never throws (must not break the error path).
export const logError = async (row) => {
  try {
    await supabase.from('error_logs').insert([row]);
    return { ok: true };
  } catch (e) { return { ok: false }; }
};

export const getErrorLogs = async (limit = 300) => {
  const { data, error } = await supabase
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
};

export const resendConfirmation = async (email) => supabase.auth.resend({
  type: 'signup', email,
  options: { emailRedirectTo: `${window.location.origin}/?auth=confirm` },
});

export const resolveErrorLog = async (id, resolved = true) => {
  const { data, error } = await supabase
    .from('error_logs')
    .update({ resolved, resolved_at: resolved ? new Date().toISOString() : null })
    .eq('id', id)
    .select();
  return { data, error };
};
