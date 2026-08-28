import { prisma } from "@/lib/db";
import type { Question } from "@prisma/client";

export const SESSION_SIZE = 8;
export const EXAM_SIZE = 20;
export const LESSON_PRACTICE_SIZE = 4;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Orders candidates so never-seen / long-unseen questions surface first — a
 * lightweight stand-in for real spaced repetition (brief §15): we don't model
 * per-question forgetting curves, just "what have you not seen in a while". */
async function orderBySpacing(studentId: string, questions: Question[]) {
  const lastSeen = await prisma.attempt.groupBy({
    by: ["questionId"],
    where: { studentId, questionId: { in: questions.map((q) => q.id) } },
    _max: { answeredAt: true },
  });
  const lastSeenMap = new Map(lastSeen.map((r) => [r.questionId, r._max.answeredAt?.getTime() ?? 0]));

  return [...questions].sort((a, b) => (lastSeenMap.get(a.id) ?? 0) - (lastSeenMap.get(b.id) ?? 0));
}

async function pickFromPool(studentId: string, questions: Question[], count: number) {
  const ordered = await orderBySpacing(studentId, questions);
  const pool = ordered.slice(0, Math.max(count * 3, count));
  return shuffle(pool).slice(0, Math.min(count, ordered.length));
}

export async function selectQuestionsForSession(
  studentId: string,
  mode: "QUICK" | "TOPIC" | "MISTAKES" | "WEAK_SPOTS" | "LESSON" | "EXAM",
  topicIds: string[]
): Promise<{ questions: Question[]; resolvedTopicIds: string[] }> {
  if (mode === "MISTAKES") {
    const marks = await prisma.questionMark.findMany({
      where: { studentId, reason: "MISTAKE", resolvedAt: null },
      orderBy: { createdAt: "asc" },
      include: { question: true },
      take: SESSION_SIZE * 2,
    });
    const questions = shuffle(marks.map((m) => m.question)).slice(0, SESSION_SIZE);
    return { questions, resolvedTopicIds: [...new Set(questions.map((q) => q.topicId))] };
  }

  if (mode === "WEAK_SPOTS") {
    const masteries = await prisma.mastery.findMany({ where: { studentId }, orderBy: { confidence: "asc" } });
    const attemptedWeak = masteries.filter((m) => m.totalAttempts > 0).slice(0, 3).map((m) => m.topicId);
    let weakTopicIds = attemptedWeak;
    if (weakTopicIds.length < 3) {
      const attemptedIds = new Set(masteries.map((m) => m.topicId));
      const unattempted = await prisma.topic.findMany({ where: { id: { notIn: [...attemptedIds] } }, take: 3 - weakTopicIds.length });
      weakTopicIds = [...weakTopicIds, ...unattempted.map((t) => t.id)];
    }
    const questions = await prisma.question.findMany({ where: { topicId: { in: weakTopicIds }, status: "PUBLISHED" } });
    return { questions: await pickFromPool(studentId, questions, SESSION_SIZE), resolvedTopicIds: weakTopicIds };
  }

  if (mode === "EXAM") {
    const questions = await prisma.question.findMany({ where: { status: "PUBLISHED" } });
    return { questions: shuffle(questions).slice(0, Math.min(EXAM_SIZE, questions.length)), resolvedTopicIds: [] };
  }

  if (mode === "LESSON") {
    const questions = await prisma.question.findMany({ where: { topicId: { in: topicIds }, status: "PUBLISHED" } });
    return { questions: await pickFromPool(studentId, questions, LESSON_PRACTICE_SIZE), resolvedTopicIds: topicIds };
  }

  if (mode === "TOPIC" && topicIds.length > 0) {
    const questions = await prisma.question.findMany({ where: { topicId: { in: topicIds }, status: "PUBLISHED" } });
    return { questions: await pickFromPool(studentId, questions, SESSION_SIZE), resolvedTopicIds: topicIds };
  }

  // QUICK (default): a bit of everything.
  const questions = await prisma.question.findMany({ where: { status: "PUBLISHED" } });
  return { questions: await pickFromPool(studentId, questions, SESSION_SIZE), resolvedTopicIds: [] };
}
