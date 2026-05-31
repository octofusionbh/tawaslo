import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gtjmpmhsiyqwhykunosc.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

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

// INVOICES
export const getInvoices = async (clientId) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  return { data, error };
};