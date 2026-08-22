import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, companyId: user.company_id, role: user.role },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );
}

export function signRefreshToken(user) {
  // jti ensures uniqueness even if two tokens are issued for the same user
  // within the same second (sub+iat alone would collide byte-for-byte,
  // which breaks the DB's UNIQUE constraint on the hashed token).
  return jwt.sign({ sub: user.id, jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

/** Opaque, single-use tokens (email verification, password reset). */
export function generateOpaqueToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = hashOpaqueToken(raw);
  return { raw, hash };
}

export function hashOpaqueToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function refreshExpiryDate() {
  const ms = parseDurationToMs(env.jwt.refreshExpiresIn);
  return new Date(Date.now() + ms);
}

function parseDurationToMs(duration) {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const [, amount, unit] = match;
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(amount) * unitMs[unit];
}
