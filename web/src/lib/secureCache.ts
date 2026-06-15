/**
 * secureCache.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Lightweight AES-GCM encrypted localStorage layer for PII data protection.
 *
 * Strategy: each stored payload is encrypted with AES-GCM using a key derived
 * from the browser's SubtleCrypto API.  The encryption key is itself derived
 * from a per-session secret (VITE_CACHE_SECRET) + a device-stable salt stored
 * in sessionStorage.  On logout, all PII cache keys are wiped immediately.
 *
 * PII keys managed by this module:
 *   kk_youth_profiles | kk_web_submissions | kk_current_user
 *
 * Non-PII keys (barangay config, UI prefs) are NOT touched by this module.
 * ──────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** All localStorage keys that hold PII / sensitive data. */
export const PII_CACHE_KEYS = [
  'kk_youth_profiles',
  'kk_web_submissions',
  'kk_current_user',
  'kk_desktop_auth',
  'kk_offline_queue',
] as const;

export type PiiCacheKey = typeof PII_CACHE_KEYS[number];

const SALT_SESSION_KEY = '__kk_salt__';

// ---------------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------------

/**
 * Derives a per-session AES-GCM CryptoKey from the env secret + a random salt
 * stored only in sessionStorage (wiped on tab close).
 */
async function deriveKey(): Promise<CryptoKey> {
  const secret = import.meta.env.VITE_CACHE_SECRET || 'kk-default-dev-secret-change-me';

  // Retrieve or generate a random session salt
  let saltHex = sessionStorage.getItem(SALT_SESSION_KEY);
  if (!saltHex) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem(SALT_SESSION_KEY, saltHex);
  }

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret + saltHex),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(saltHex),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ---------------------------------------------------------------------------
// Encrypt / Decrypt helpers
// ---------------------------------------------------------------------------

/**
 * Encrypts a JSON-serialisable value. Returns a Base64 string: `iv::ciphertext`.
 */
export async function encryptPayload<T>(value: T): Promise<string> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(value));

  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  const ivBase64 = btoa(String.fromCharCode(...iv));
  const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));
  return `${ivBase64}::${cipherBase64}`;
}

/**
 * Decrypts a value previously produced by `encryptPayload`.
 * Returns `null` if decryption fails (corrupt / tampered data).
 */
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

// ---------------------------------------------------------------------------
// Secure get / set / remove
// ---------------------------------------------------------------------------

/**
 * Reads and decrypts a PII cache entry. Falls back to `fallback` on miss or
 * decryption failure (e.g. first boot, tampered data).
 */
export async function getSecureCache<T>(key: string, fallback: T): Promise<T> {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  // Support legacy plain-text fallback (first migration): if not `::` format, treat as plain JSON
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

/**
 * Encrypts and stores a value for the given key.
 */
export async function setSecureCache<T>(key: string, value: T): Promise<void> {
  const encrypted = await encryptPayload(value);
  localStorage.setItem(key, encrypted);
}

/**
 * Removes a single cache entry.
 */
export function removeSecureCache(key: string): void {
  localStorage.removeItem(key);
}

// ---------------------------------------------------------------------------
// Logout purge
// ---------------------------------------------------------------------------

/**
 * MUST be called on every logout path.
 * Removes ALL PII-containing localStorage keys immediately so no residual
 * plaintext or ciphertext remains in the browser after the session ends.
 */
export function purgeAllPiiCache(): void {
  for (const key of PII_CACHE_KEYS) {
    localStorage.removeItem(key);
  }
  // Also clear the session salt so any leftover encrypted data becomes
  // permanently unreadable even if the tab was not closed.
  sessionStorage.removeItem(SALT_SESSION_KEY);
}
