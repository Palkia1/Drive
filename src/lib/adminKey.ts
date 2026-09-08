import { timingSafeEqual } from "node:crypto";

/** Timing-safe comparison against SEED_KEY, shared by the two admin routes
 * gated on it. A plain `===` leaks how many leading characters matched via
 * response time; this always compares the full fixed-length digest instead.
 * Different-length inputs return false immediately (that early return only
 * leaks length, not content, and SEED_KEY's length isn't itself secret). */
export function isValidAdminKey(key: string | null): boolean {
  const expected = process.env.SEED_KEY;
  if (!expected || !key) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
