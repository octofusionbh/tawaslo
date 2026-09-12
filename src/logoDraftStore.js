const DATABASE = 'tawaslo-account-setup';
const STORE = 'logo-drafts';
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function validateKey(key) {
  if (!key || typeof key !== 'string' || key.length > 120) throw new Error('The logo draft is missing its account reference.');
}
function openStore() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser cannot save the logo yet. You can attach it after confirming your email.'));
      return;
    }
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Your browser could not save the logo. Please try attaching it again.'));
    request.onblocked = () => reject(new Error('Close other Tawaslo tabs and try saving the logo again.'));
  });
}
async function transact(mode, operation) {
  const db = await openStore();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      let result;
      const request = operation(transaction.objectStore(STORE));
      request.onsuccess = () => { result = request.result; };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(new Error('Your browser could not save the logo. Please try again.'));
      transaction.onabort = () => reject(new Error('Saving the logo was interrupted. Please try again.'));
    });
  } finally {
    db.close();
  }
}
async function removeExpired() {
  const db = await openStore();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      const request = transaction.objectStore(STORE).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        if (!cursor.value.expiresAt || cursor.value.expiresAt <= Date.now()) cursor.delete();
        cursor.continue();
      };
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}
export async function saveLogoDraft(key, file) {
  validateKey(key);
  if (!file || !TYPES.has(file.type)) throw new Error('Choose a PNG, JPG or WebP logo.');
  if (!file.size || file.size > MAX_BYTES) throw new Error('Choose a logo smaller than 5 MB.');
  await removeExpired();
  await transact('readwrite', store => store.put({ key, file, expiresAt: Date.now() + MAX_AGE }));
  return file;
}
export async function readLogoDraft(key) {
  validateKey(key);
  const row = await transact('readonly', store => store.get(key));
  if (!row) return null;
  if (row.expiresAt <= Date.now()) {
    await clearLogoDraft(key);
    return null;
  }
  if (!row.file || !TYPES.has(row.file.type) || !row.file.size || row.file.size > MAX_BYTES) {
    await clearLogoDraft(key);
    return null;
  }
  return row.file;
}
export async function clearLogoDraft(key) {
  validateKey(key);
  await transact('readwrite', store => store.delete(key));
}

