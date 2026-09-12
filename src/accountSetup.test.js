import { supabase } from './supabase';
import { readLogoDraft, clearLogoDraft } from './logoDraftStore';
import {
  buildSignupSetup, getPendingSetup, completeAccountSetup,
  finishAccountSetupWithoutLogo, updateAccountSetupMetadata,
} from './accountSetup';

jest.mock('./supabase', () => ({
  supabase: { from: jest.fn(), auth: { getUser: jest.fn(), updateUser: jest.fn() }, storage: { from: jest.fn() } },
}));
jest.mock('./logoDraftStore', () => ({
  readLogoDraft: jest.fn(), clearLogoDraft: jest.fn(),
}));

let currentUser, rows, operations, failures, bucket, sequence = 0;
const setupId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
function fixture(logo = null) {
  return {
    version: 1, name: 'Sam Example', companyName: 'Example Studio', accountType: 'agency',
    selectedPlan: 'professional', billing: 'yearly', industries: ['shop', 'services'],
    initialClientId: setupId, logo, createdAt: '2026-09-11T12:00:00.000Z',
  };
}
function failNext(key, error) {
  failures[key] = [...(failures[key] || []), error];
}
function query(table) {
  let operation = 'select', payload, filters = [];
  const builder = {
    select: () => builder,
    eq: (key, value) => { filters.push([key, value]); return builder; },
    order: () => builder,
    limit: () => builder,
    insert: value => { operation = 'insert'; payload = value; return builder; },
    update: value => { operation = 'update'; payload = value; return builder; },
    maybeSingle: () => result(),
    single: () => result(),
  };
  async function result() {
    operations.push({ table, operation, payload, filters });
    const failure = failures[table + ':' + operation]?.shift();
    if (failure) return { data: null, error: typeof failure === 'function' ? failure(payload) : failure };
    if (operation === 'insert') {
      if (rows[table].some(row => row.id === payload[0].id)) return { data: null, error: { code: '23505', message: 'Duplicate' } };
      const value = { ...payload[0] };
      rows[table].push(value);
      return { data: { ...value }, error: null };
    }
    const found = rows[table].find(row => filters.every(([key, value]) => row[key] === value));
    if (operation === 'update' && found) Object.assign(found, payload);
    return { data: found ? { ...found } : null, error: null };
  }
  return builder;
}
beforeEach(() => {
  jest.clearAllMocks();
  sequence += 1;
  currentUser = {
    id: 'user-' + sequence, email: 'test@example.com',
    user_metadata: { name: 'Sam Example', unrelated: 'keep-me', tawaslo_setup: fixture() },
  };
  rows = { profiles: [], clients: [] };
  operations = [];
  failures = {};
  supabase.from.mockImplementation(query);
  supabase.auth.getUser.mockImplementation(async () => ({ data: { user: currentUser }, error: null }));
  supabase.auth.updateUser.mockImplementation(async ({ data }) => {
    const failure = failures['auth:update']?.shift();
    if (failure) return { data: null, error: failure };
    currentUser = { ...currentUser, user_metadata: { ...currentUser.user_metadata, ...data } };
    return { data: { user: currentUser }, error: null };
  });
  bucket = {
    upload: jest.fn().mockResolvedValue({ error: null }),
    getPublicUrl: jest.fn(path => ({ data: { publicUrl: 'https://storage.example/' + path } })),
  };
  supabase.storage.from.mockReturnValue(bucket);
  readLogoDraft.mockResolvedValue(null);
  clearLogoDraft.mockResolvedValue(undefined);
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: () => setupId },
  });
});

test('builds a validated setup with billing and multiple industries, without secret fields', () => {
  const result = buildSignupSetup({
    fullName: ' Sam Example ', companyName: ' Example Studio ', accountType: 'corporate',
    selectedPlan: 'starter', billing: 'yearly', industries: ['shop', 'services', 'shop'],
    password: 'never-store-this',
  });
  expect(result).toMatchObject({ name: 'Sam Example', companyName: 'Example Studio', industries: ['shop', 'services'], billing: 'yearly', initialClientId: setupId, logo: null });
  expect(result.password).toBeUndefined();
  expect(() => buildSignupSetup({ fullName: 'A', companyName: 'B', accountType: 'owner', selectedPlan: 'starter', billing: 'monthly', industries: ['shop'] })).toThrow();
});

test('accounts without pending setup require no provisioning', async () => {
  const user = { id: 'existing', user_metadata: {} };
  expect(getPendingSetup(user)).toBeNull();
  expect(await completeAccountSetup(user)).toEqual({ status: 'ready', user });
  expect(supabase.auth.getUser).not.toHaveBeenCalled();
  expect(supabase.from).not.toHaveBeenCalled();
});

test('completed setup does not run again', async () => {
  currentUser.user_metadata.tawaslo_setup.completedAt = 'done';
  expect(getPendingSetup(currentUser)).toBeNull();
  await completeAccountSetup(currentUser);
  expect(supabase.from).not.toHaveBeenCalled();
});

test('pending setup requires an authenticated matching user', async () => {
  supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
  await expect(completeAccountSetup(currentUser)).rejects.toMatchObject({ code: 'session_required' });
  expect(supabase.from).not.toHaveBeenCalled();
  supabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'another-account' } }, error: null });
  await expect(completeAccountSetup(currentUser)).rejects.toMatchObject({ code: 'session_required' });
  expect(supabase.from).not.toHaveBeenCalled();
});

test('creates a trial profile and stable client while preserving plan/billing preferences', async () => {
  const result = await completeAccountSetup(currentUser);
  expect(result.status).toBe('ready');
  expect(rows.profiles[0]).toMatchObject({ plan: 'trial', company_name: 'Example Studio', account_type: 'agency' });
  expect(rows.clients[0]).toMatchObject({ id: setupId, plan: 'Trial', industries: ['shop', 'services'], business_type: 'shop' });
  expect(result.user.user_metadata).toMatchObject({ unrelated: 'keep-me', tawaslo_setup: { selectedPlan: 'professional', billing: 'yearly', logoStatus: 'not-requested', clientId: setupId } });
  expect(result.user.user_metadata.tawaslo_setup.completedAt).toBeTruthy();
});

test('preserves existing profile and existing brand details', async () => {
  rows.profiles.push({ id: currentUser.id, name: 'Already edited', plan: 'studio' });
  rows.clients.push({ id: 'legacy-client', owner_id: currentUser.id, name: 'Already named', plan: 'Professional' });
  const result = await completeAccountSetup(currentUser);
  expect(result.client.id).toBe('legacy-client');
  expect(rows.profiles[0].name).toBe('Already edited');
  expect(rows.clients[0].name).toBe('Already named');
  expect(operations.filter(item => item.operation === 'insert')).toHaveLength(0);
});

test('deduplicates concurrent completion calls', async () => {
  const first = completeAccountSetup(currentUser);
  const second = completeAccountSetup(currentUser);
  expect(first).toBe(second);
  await Promise.all([first, second]);
  expect(rows.profiles).toHaveLength(1);
  expect(rows.clients).toHaveLength(1);
  expect(operations.filter(item => item.operation === 'insert')).toHaveLength(2);
});

test('profile lookup and insert errors propagate without creating a client', async () => {
  failNext('profiles:select', { code: '42501', message: 'Permission denied' });
  await expect(completeAccountSetup(currentUser)).rejects.toMatchObject({ code: '42501' });
  expect(rows.clients).toHaveLength(0);
  failNext('profiles:insert', { code: '23514', message: 'Constraint failed' });
  await expect(completeAccountSetup(currentUser)).rejects.toMatchObject({ code: '23514' });
  expect(rows.clients).toHaveLength(0);
});

test('client failure can retry without duplicating the saved profile', async () => {
  failNext('clients:insert', { code: '42501', message: 'Permission denied' });
  await expect(completeAccountSetup(currentUser)).rejects.toMatchObject({ code: '42501' });
  expect(rows.profiles).toHaveLength(1);
  expect(getPendingSetup(currentUser)).not.toBeNull();
  expect((await completeAccountSetup(currentUser)).status).toBe('ready');
  expect(rows.profiles).toHaveLength(1);
  expect(rows.clients).toHaveLength(1);
});

test('client lookup errors cannot become a duplicate insert', async () => {
  failNext('clients:select', { code: '08006', message: 'Connection lost' });
  await expect(completeAccountSetup(currentUser)).rejects.toMatchObject({ code: '08006' });
  expect(operations.filter(item => item.table === 'clients' && item.operation === 'insert')).toHaveLength(0);
});

test.each(['42703', 'PGRST204'])('only a missing industries column uses the compatible fallback (%s)', async code => {
  failNext('clients:insert', { code, message: "Could not find the 'industries' column" });
  const result = await completeAccountSetup(currentUser);
  expect(result.status).toBe('ready');
  expect(rows.clients[0].industries).toBeUndefined();
  expect(result.user.user_metadata.tawaslo_setup.industries).toEqual(['shop', 'services']);
  expect(operations.filter(item => item.table === 'clients' && item.operation === 'insert')).toHaveLength(2);
});

test('other errors mentioning industries are not silently retried', async () => {
  failNext('clients:insert', { code: '42501', message: 'industries permission denied' });
  await expect(completeAccountSetup(currentUser)).rejects.toMatchObject({ code: '42501' });
  expect(operations.filter(item => item.table === 'clients' && item.operation === 'insert')).toHaveLength(1);
});

test('recovers a concurrently inserted profile and stable initial client', async () => {
  failNext('profiles:insert', payload => {
    rows.profiles.push({ ...payload[0], name: 'Concurrent name' });
    return { code: '23505' };
  });
  failNext('clients:insert', payload => {
    rows.clients.push({ ...payload[0], name: 'Concurrent brand' });
    return { code: '23505' };
  });
  const result = await completeAccountSetup(currentUser);
  expect(result.status).toBe('ready');
  expect(rows.profiles[0].name).toBe('Concurrent name');
  expect(result.client.name).toBe('Concurrent brand');
});

test('a missing saved logo requests reattachment after saving the account details', async () => {
  currentUser.user_metadata.tawaslo_setup.logo = { name: 'logo.png', type: 'image/png', size: 10 };
  const result = await completeAccountSetup(currentUser);
  expect(result.status).toBe('logo-required');
  expect(result.logoError.code).toBe('logo_missing');
  expect(rows.profiles).toHaveLength(1);
  expect(rows.clients).toHaveLength(1);
  expect(currentUser.user_metadata.tawaslo_setup.completedAt).toBeUndefined();
});

test('a failed logo upload is visible and explicit skip marks it deferred', async () => {
  currentUser.user_metadata.tawaslo_setup.logo = { name: 'logo.png', type: 'image/png', size: 10 };
  readLogoDraft.mockResolvedValue({ name: 'logo.png', type: 'image/png', size: 10 });
  bucket.upload.mockResolvedValue({ error: { code: 'storage_error', message: 'Upload failed' } });
  expect((await completeAccountSetup(currentUser)).status).toBe('logo-required');
  const result = await finishAccountSetupWithoutLogo(currentUser);
  expect(result.status).toBe('ready');
  expect(result.user.user_metadata.tawaslo_setup.logoStatus).toBe('deferred');
  expect(result.user.user_metadata.tawaslo_setup.logo).toBeTruthy();
});

test('saves an uploaded logo to profile and client, preserving metadata and clearing the local draft', async () => {
  currentUser.user_metadata.tawaslo_setup.logo = { name: 'logo.webp', type: 'image/webp', size: 10 };
  readLogoDraft.mockResolvedValue({ name: 'logo.webp', type: 'image/webp', size: 10 });
  const result = await completeAccountSetup(currentUser);
  expect(result.status).toBe('ready');
  expect(bucket.upload).toHaveBeenCalledWith(currentUser.id + '/workspace-logo-' + setupId + '.webp', expect.anything(), { upsert: true, contentType: 'image/webp' });
  expect(rows.profiles[0].logo_url).toBe(rows.clients[0].logo_url);
  expect(result.user.user_metadata.tawaslo_setup.logoStatus).toBe('saved');
  expect(clearLogoDraft).toHaveBeenCalledWith(setupId);
});

test('retry after logo-link failure reuses the uploaded object', async () => {
  currentUser.user_metadata.tawaslo_setup.logo = { name: 'logo.png', type: 'image/png', size: 10 };
  readLogoDraft.mockResolvedValue({ name: 'logo.png', type: 'image/png', size: 10 });
  failNext('profiles:update', { code: '08006', message: 'Connection lost' });
  expect((await completeAccountSetup(currentUser)).status).toBe('logo-required');
  expect((await completeAccountSetup(currentUser)).status).toBe('ready');
  expect(bucket.upload).toHaveBeenCalledTimes(1);
  expect(rows.profiles).toHaveLength(1);
  expect(rows.clients).toHaveLength(1);
});

test('completion metadata failure stays retryable without repeating row inserts', async () => {
  failNext('auth:update', { code: 'network_error', message: 'Connection lost' });
  await expect(completeAccountSetup(currentUser)).rejects.toMatchObject({ code: 'network_error' });
  expect((await completeAccountSetup(currentUser)).status).toBe('ready');
  expect(rows.profiles).toHaveLength(1);
  expect(rows.clients).toHaveLength(1);
});

test('reattaching a different logo after partial save replaces the original image on both rows', async () => {
  currentUser.user_metadata.tawaslo_setup.logo = { name: 'original.png', type: 'image/png', size: 10 };
  readLogoDraft.mockResolvedValue({ name: 'original.png', type: 'image/png', size: 10 });
  failNext('clients:update', { code: '08006', message: 'Connection lost' });
  expect((await completeAccountSetup(currentUser)).status).toBe('logo-required');
  const originalUrl = rows.profiles[0].logo_url;
  expect(originalUrl).toBeTruthy();
  expect(rows.clients[0].logo_url).toBeUndefined();

  currentUser = await updateAccountSetupMetadata(currentUser, {
    logo: { name: 'replacement.webp', type: 'image/webp', size: 20 },
    logoUpload: null, logoRevision: '1726056000000',
  });
  const replacement = { name: 'replacement.webp', type: 'image/webp', size: 20 };
  readLogoDraft.mockResolvedValue(replacement);
  expect((await completeAccountSetup(currentUser)).status).toBe('ready');
  expect(bucket.upload).toHaveBeenCalledTimes(2);
  expect(bucket.upload).toHaveBeenLastCalledWith(currentUser.id + '/workspace-logo-' + setupId + '-1726056000000.webp', replacement, { upsert: true, contentType: 'image/webp' });
  expect(rows.profiles[0].logo_url).not.toBe(originalUrl);
  expect(rows.profiles[0].logo_url).toBe(rows.clients[0].logo_url);
  expect(currentUser.user_metadata.tawaslo_setup.logoStatus).toBe('saved');
});

test('logo revision cannot introduce unsafe storage path segments', async () => {
  currentUser.user_metadata.tawaslo_setup.logo = { name: 'logo.png', type: 'image/png', size: 10 };
  currentUser.user_metadata.tawaslo_setup.logoRevision = '../another-folder';
  const result = await completeAccountSetup(currentUser);
  expect(result.status).toBe('logo-required');
  expect(bucket.upload).not.toHaveBeenCalled();
});

test('metadata update refuses a different setup reference', async () => {
  const expected = { ...currentUser, user_metadata: { tawaslo_setup: { ...fixture(), initialClientId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' } } };
  await expect(updateAccountSetupMetadata(expected, { completedAt: 'now' })).rejects.toThrow('saved setup changed');
});
