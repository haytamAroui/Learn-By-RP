import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

let cachedSecret: Buffer | null | undefined;

function signingSecret(): Buffer | null {
  if (cachedSecret !== undefined) return cachedSecret;
  const configured = process.env.GUEST_IDENTITY_SECRET?.trim();
  if (configured) {
    if (configured.length < 32) throw new Error('GUEST_IDENTITY_SECRET must contain at least 32 characters');
    cachedSecret = Buffer.from(configured, 'utf8');
    return cachedSecret;
  }
  if (process.env.NODE_ENV === 'production') {
    cachedSecret = null;
    return null;
  }

  const directory = path.join(process.cwd(), '.data');
  const file = path.join(directory, 'guest-identity.secret');
  mkdirSync(directory, { recursive: true });
  if (!existsSync(file)) {
    try { writeFileSync(file, randomBytes(48), { flag: 'wx', mode: 0o600 }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
  }
  cachedSecret = readFileSync(file);
  if (cachedSecret.length < 32) throw new Error('Local guest identity signing key is invalid');
  return cachedSecret;
}

export function issueGuestIdentityToken(): string {
  const secret = signingSecret();
  if (!secret) throw new Error('Guest identity signing is not configured');
  const payload = `v1.${randomBytes(32).toString('base64url')}`;
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyGuestIdentityToken(token: string): string | null {
  const secret = signingSecret();
  if (!secret) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  const payload = `${parts[0]}.${parts[1]}`;
  let supplied: Buffer;
  try { supplied = Buffer.from(parts[2], 'base64url'); } catch { return null; }
  const expected = createHmac('sha256', secret).update(payload).digest();
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(parts[1])) return null;
  return `guest:${parts[1]}`;
}
