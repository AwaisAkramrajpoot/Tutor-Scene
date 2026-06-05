import { createHash } from 'crypto';

const REFERRAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReferralCode(userId: number, firstName?: string): string {
  const prefix = String(firstName || 'TS')
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 2)
    .toUpperCase()
    .padEnd(2, 'X');

  const digest = createHash('sha256')
    .update(`tutor-scene-ref:${userId}`)
    .digest();

  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += REFERRAL_ALPHABET[digest[i] % REFERRAL_ALPHABET.length];
  }

  return `${prefix}${suffix}`;
}

export function buildReferralLink(baseUrl: string, code: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  return `${normalizedBase}/signup?ref=${encodeURIComponent(code)}`;
}
