// Password hashing for offline (no-Supabase) admin accounts.
// Not a substitute for real auth — used only to gate the local demo/offline
// login path so it can't be bypassed by matching an email/role alone.

export const hashPassword = async (password: string): Promise<string> => {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const verifyPassword = async (password: string, hash: string | undefined): Promise<boolean> => {
  if (!hash) return false;
  const candidate = await hashPassword(password);
  return candidate === hash;
};

// Generates a random one-time temporary password for newly provisioned accounts.
// Callers must surface this to the admin so it can be handed off out-of-band,
// and the new user should change it on first login.
export const generateTempPassword = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join('');
};
