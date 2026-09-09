// One-off data migration for the bord-naar-betekenis / betekenis-naar-bord
// merge: after the code change (generateSignQuestions.ts now tags BOTH
// directions with the "bord-naar-betekenis" slug, and that slug's entry in
// TOPICS was renamed/kept as the sole survivor) and after re-seeding
// (`npm run db:seed`, which deletes+recreates every Question — so by the
// time this runs, the old "betekenis-naar-bord" topic already has zero
// Question rows left, just any pre-existing per-student Mastery rows),
// this folds those leftover Mastery rows into the surviving topic and
// deletes the now-empty old Topic row.
//
// Safe to run more than once — if the old topic doesn't exist, it's a no-op.
//
// Usage (against whichever DATABASE_URL is active in the environment):
//   npx tsx scripts/merge-sign-recognition-topics.ts
import { PrismaClient } from "@prisma/client";

const OLD_SLUG = "betekenis-naar-bord";
const SURVIVING_SLUG = "bord-naar-betekenis";

async function main() {
  const prisma = new PrismaClient();

  const oldTopic = await prisma.topic.findUnique({ where: { slug: OLD_SLUG } });
  if (!oldTopic) {
    console.log(`No "${OLD_SLUG}" topic found — already merged, nothing to do.`);
    await prisma.$disconnect();
    return;
  }
  const survivingTopic = await prisma.topic.findUnique({ where: { slug: SURVIVING_SLUG } });
  if (!survivingTopic) {
    throw new Error(`Surviving topic "${SURVIVING_SLUG}" not found — reseed before running this.`);
  }

  const leftoverQuestions = await prisma.question.count({ where: { topicId: oldTopic.id } });
  if (leftoverQuestions > 0) {
    throw new Error(
      `"${OLD_SLUG}" still has ${leftoverQuestions} question(s) — run \`npm run db:seed\` first so they move to the merged topic.`
    );
  }

  const oldMasteries = await prisma.mastery.findMany({ where: { topicId: oldTopic.id } });
  let merged = 0;
  let reassigned = 0;
  for (const m of oldMasteries) {
    const existing = await prisma.mastery.findUnique({
      where: { studentId_topicId: { studentId: m.studentId, topicId: survivingTopic.id } },
    });
    if (existing) {
      await prisma.mastery.update({
        where: { id: existing.id },
        data: {
          totalAttempts: existing.totalAttempts + m.totalAttempts,
          correctAttempts: existing.correctAttempts + m.correctAttempts,
          level: Math.max(existing.level, m.level),
          confidence: Math.max(existing.confidence, m.confidence),
        },
      });
      await prisma.mastery.delete({ where: { id: m.id } });
      merged++;
    } else {
      await prisma.mastery.update({ where: { id: m.id }, data: { topicId: survivingTopic.id } });
      reassigned++;
    }
  }

  await prisma.topic.delete({ where: { id: oldTopic.id } });
  console.log(
    `Merged ${merged} and reassigned ${reassigned} Mastery row(s) from "${OLD_SLUG}" into "${SURVIVING_SLUG}"; deleted the old topic.`
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
