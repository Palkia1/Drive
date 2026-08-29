import { NextResponse } from "next/server";
import { main as seedDatabase } from "../../../../../prisma/seed";

/**
 * One-time production seeding endpoint — gated by SEED_KEY (a plain-text env
 * var you set yourself, so its value is always visible/known — unlike a
 * "Secret"-type var such as AUTH_SECRET, which Vercel never lets you read
 * back). Meant to be visited once after the first deploy against a fresh
 * database, then this route should be deleted.
 */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.SEED_KEY || !key || key !== process.env.SEED_KEY) {
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
