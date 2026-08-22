import crypto from 'node:crypto';

// Ambiguous characters (I/O/0/1) excluded for readability when a temp
// password has to be read off an email or a screen and typed back in.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SPECIAL = '!@#$%&*';
const ALL = UPPER + LOWER + DIGITS + SPECIAL;

function pick(set) {
  return set[crypto.randomInt(set.length)];
}

function shuffle(chars) {
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars;
}

/** Generates a temp password that satisfies the same policy signup enforces. */
export function generateTempPassword(length = 12) {
  const required = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SPECIAL)];
  const rest = Array.from({ length: length - required.length }, () => pick(ALL));
  return shuffle([...required, ...rest]).join('');
}
