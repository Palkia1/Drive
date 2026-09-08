import { NextResponse } from "next/server";
import { main as seedDatabase } from "../../../../../prisma/seed";
import { isValidAdminKey } from "@/lib/adminKey";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

/**
 * One-time production seeding endpoint — gated by SEED_KEY (a plain-text env
 * var you set yourself, so its value is always visible/known — unlike a
 * "Secret"-type var such as AUTH_SECRET, which Vercel never lets you read
 * back). Meant to be visited once after the first deploy against a fresh
 * database, then this route should be deleted.
 */
export async function GET(req: Request) {
  // Rate-limited before the key check itself (not after a failed check)
  // so guessing the key can't be sped up by racing past this gate — same
  // reasoning as every other secret-gated route in this app.
  const allowed = await checkRateLimit(`admin-seed:${clientIp(req)}`, 5);
  if (!allowed) {
    return NextResponse.json({ error: "Te veel pogingen. Probeer het over een minuut opnieuw." }, { status: 429 });
  }

  const key = new URL(req.url).searchParams.get("key");
  if (!isValidAdminKey(key)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await seedDatabase();
    return NextResponse.json({ ok: true, message: "Seeding voltooid." });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
