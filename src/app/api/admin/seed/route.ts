import { NextResponse } from "next/server";
import { main as seedDatabase } from "../../../../../prisma/seed";

/**
 * One-time production seeding endpoint — gated by AUTH_SECRET (already
 * configured, no extra env var to set up) rather than left open. Meant to be
 * visited once after the first deploy against a fresh database, then this
 * route should be deleted.
 */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!key || key !== process.env.AUTH_SECRET) {
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
