import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gtjmpmhsiyqwhykunosc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0am1wbWhzaXlxd2h5a3Vub3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNjAzODAsImV4cCI6MjA5NTczNjM4MH0.atOyop4rZGuNnuc05Ek2XLCd4mc_c4RJJzdKrNZJczY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// AUTH FUNCTIONS
export const signUp = async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
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
export const createInitialClient = async (ownerId, companyName, plan, accountType) => {
  const { data: existingArr } = await supabase
    .from('clients')
    .select('id')
    .eq('owner_id', ownerId)
    .limit(1);
  if (existingArr && existingArr.length > 0) return { data: existingArr[0] };
  const planLabel = plan === 'starter' ? 'Starter' : plan === 'agency' ? 'Agency' : 'Professional';
  const { data, error } = await supabase
    .from('clients')
    .insert([{
      owner_id: ownerId,
      name: companyName,
      plan: planLabel,
      status: 'active',
      is_free: false,
      account_type: accountType,
    }])
    .select()
    .single();
  return { data, error };
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
    redirectTo: `${window.location.origin}/reset-password`,
  });
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