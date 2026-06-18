// keys holding PII / sensitive data
export const PII_CACHE_KEYS = [
  'kk_youth_profiles',
  'kk_web_submissions',
  'kk_current_user',
  'kk_desktop_auth',
  'kk_offline_queue',
] as const;

export type PiiCacheKey = typeof PII_CACHE_KEYS[number];

const SALT_SESSION_KEY = '__kk_salt__';

// derives session key from cache secret + session salt
async function deriveKey(): Promise<CryptoKey> {
  const secret = import.meta.env.VITE_CACHE_SECRET || 'kk-default-dev-secret-change-me';

  // retrieve or generate session salt
  let saltHex = sessionStorage.getItem(SALT_SESSION_KEY);
  if (!saltHex) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem(SALT_SESSION_KEY, saltHex);
  }

  const enc = new TextEncoder();
  const rawKeyMaterial = enc.encode(secret + saltHex);

  // ponytail: fast SHA-256 hash instead of 100k iteration PBKDF2.
  // Ceiling: doesn't stretch key space. Upgrade path: PBKDF2 if required by compliance.
  const keyBuffer = await crypto.subtle.digest('SHA-256', rawKeyMaterial);

  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// encrypts json payload to a string of 'iv::ciphertext'
export async function encryptPayload<T>(value: T): Promise<string> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(value));

  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  const ivBase64 = btoa(String.fromCharCode(...iv));
  const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));
  return `${ivBase64}::${cipherBase64}`;
}

// decrypts payload, returns null if fails or tampered
export async function decryptPayload<T>(raw: string): Promise<T | null> {
  try {
    const [ivBase64, cipherBase64] = raw.split('::');
    if (!ivBase64 || !cipherBase64) return null;

    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const cipher = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));

    const key = await deriveKey();
    const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return JSON.parse(new TextDecoder().decode(plainBuffer)) as T;
  } catch {
    return null;
  }
}

// read and decrypt from cache, uses fallback on failure
export async function getSecureCache<T>(key: string, fallback: T): Promise<T> {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  // support old plain-text JSON fallback
  if (!raw.includes('::')) {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  const decrypted = await decryptPayload<T>(raw);
  return decrypted ?? fallback;
}

// encrypts and stores in cache
export async function setSecureCache<T>(key: string, value: T): Promise<void> {
  const encrypted = await encryptPayload(value);
  localStorage.setItem(key, encrypted);
}

export function removeSecureCache(key: string): void {
  localStorage.removeItem(key);
}

// wipe all cached PII keys
export function purgeAllPiiCache(): void {
  for (const key of PII_CACHE_KEYS) {
    localStorage.removeItem(key);
  }
  // clear salt so leftovers can't be read
  sessionStorage.removeItem(SALT_SESSION_KEY);
}
