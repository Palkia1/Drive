import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Read-only export of what beta-testers actually changed, keyed by
 * QuestionReview action rather than a blind snapshot of every question's
 * current content — scripts/sync-seed-from-live.ts patches only the fields
 * a review action actually touched, so an untouched question's hand-
 * formatted `scene` (comments included) is never rewritten. Gated by the
 * same SEED_KEY as /api/admin/seed.
 */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.SEED_KEY || !key || key !== process.env.SEED_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const questions = await prisma.question.findMany({
    where: { seedKey: { not: null }, reviews: { some: {} } },
    select: {
      seedKey: true,
      prompt: true,
      explanation: true,
      scene: true,
      status: true,
      reviews: { select: { action: true } },
    },
  });

  const patches = questions
    .map((q) => {
      const actions = new Set(q.reviews.map((r) => r.action));
      const patch: { seedId: string; prompt?: string; explanation?: string; scene?: unknown; archived?: boolean } = {
        seedId: q.seedKey!,
      };
      if (actions.has("EDITED_PROMPT")) {
        patch.prompt = q.prompt;
        patch.explanation = q.explanation ?? "";
      }
      if (actions.has("EDITED_ANSWERS")) patch.scene = JSON.parse(q.scene);
      if (actions.has("DISCARDED") && q.status === "ARCHIVED") patch.archived = true;
      return patch;
    })
    .filter((p) => Object.keys(p).length > 1);

  return NextResponse.json({ patches });
}
