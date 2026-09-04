import { prisma } from "@/lib/db";

const WINDOW_MS = 60_000; // 1 minute, fixed window

/** Returns true if the request is allowed, false if `key` has hit `limit`
 * within the current 1-minute window. One upsert per call — see
 * RateLimitAttempt in prisma/schema.prisma for why this is DB-backed
 * instead of in-memory. */
export async function checkRateLimit(key: string, limit: number): Promise<boolean> {
  const windowStart = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS);
  const record = await prisma.rateLimitAttempt.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });
  return record.count <= limit;
}

/** Best-effort client IP for a Route Handler request — Vercel sets
 * x-forwarded-for; falls back to a constant so rate limiting still applies
 * (just shared across unidentified clients) rather than silently no-op-ing. */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
