import { prisma } from "@/lib/db";

/**
 * Mastery algorithm (product brief §16, §37): never claim a learner "knows"
 * a topic from a couple of lucky guesses, and let mastery fall back down if
 * recent performance regresses. This is a deliberately simple, explainable
 * heuristic — NOT a calibrated psychometric model — see README for the
 * rationale and its known limitations.
 *
 * Inputs that feed the score:
 *  - volume     — how many questions have been answered on this topic at all
 *  - accuracy   — weighted by question difficulty (a hard question answered
 *                 correctly/incorrectly is stronger evidence than an easy one)
 *  - recency    — the last N outcomes count more than older history, so a
 *                 learner who used to be good but is now making mistakes
 *                 again sees their level drop
 *
 * The level (0-5) is *recomputed from scratch* on every attempt rather than
 * incremented/decremented by rules-of-thumb, so promotion and demotion are
 * both just "what does the current evidence say" — there's no special-cased
 * demotion logic to keep in sync.
 */

export const MIN_ATTEMPTS_FOR_ANY_LEVEL = 5;
const RECENT_WINDOW = 12;
const VOLUME_TARGET = 20; // attempts needed to stop being volume-limited
const HISTORY_CAP = 30; // how many outcomes we keep in Mastery.recentOutcomes

export type Outcome = { correct: boolean; difficulty: number };

export function encodeOutcomes(outcomes: Outcome[]): string {
  return outcomes
    .slice(-HISTORY_CAP)
    .map((o) => `${o.correct ? 1 : 0}:${o.difficulty}`)
    .join(";");
}

export function decodeOutcomes(raw: string): Outcome[] {
  if (!raw) return [];
  return raw
    .split(";")
    .filter(Boolean)
    .map((entry) => {
      const [c, d] = entry.split(":");
      return { correct: c === "1", difficulty: Number(d) || 1 };
    });
}

export function computeConfidenceAndLevel(outcomes: Outcome[]) {
  const total = outcomes.length;
  if (total < MIN_ATTEMPTS_FOR_ANY_LEVEL) {
    return { confidence: 0, level: 0, insufficientData: true };
  }

  const weightedAccuracy = (window: Outcome[]) => {
    const totalWeight = window.reduce((s, o) => s + o.difficulty, 0);
    if (totalWeight === 0) return 0;
    const correctWeight = window.reduce((s, o) => s + (o.correct ? o.difficulty : 0), 0);
    return correctWeight / totalWeight;
  };

  const overall = weightedAccuracy(outcomes);
  const recent = weightedAccuracy(outcomes.slice(-RECENT_WINDOW));
  const blended = overall * 0.4 + recent * 0.6;
  const volumeFactor = Math.min(1, total / VOLUME_TARGET);
  const confidence = blended * volumeFactor;

  let level = 0;
  if (confidence >= 0.92 && total >= VOLUME_TARGET) level = 5;
  else if (confidence >= 0.78) level = 4;
  else if (confidence >= 0.6) level = 3;
  else if (confidence >= 0.4) level = 2;
  else if (confidence >= 0.2) level = 1;

  return { confidence, level, insufficientData: false };
}

export async function recomputeMasteryAfterAttempt(
  studentId: string,
  topicId: string,
  outcome: Outcome
) {
  const existing = await prisma.mastery.findUnique({ where: { studentId_topicId: { studentId, topicId } } });
  const priorOutcomes = existing ? decodeOutcomes(existing.recentOutcomes) : [];
  const nextOutcomes = [...priorOutcomes, outcome].slice(-HISTORY_CAP);

  const totalAttempts = (existing?.totalAttempts ?? 0) + 1;
  const correctAttempts = (existing?.correctAttempts ?? 0) + (outcome.correct ? 1 : 0);
  const { confidence, level } = computeConfidenceAndLevel(nextOutcomes);

  const mastery = await prisma.mastery.upsert({
    where: { studentId_topicId: { studentId, topicId } },
    update: {
      totalAttempts,
      correctAttempts,
      recentOutcomes: encodeOutcomes(nextOutcomes),
      confidence,
      level,
      lastAttemptAt: new Date(),
    },
    create: {
      studentId,
      topicId,
      totalAttempts,
      correctAttempts,
      recentOutcomes: encodeOutcomes(nextOutcomes),
      confidence,
      level,
      lastAttemptAt: new Date(),
    },
  });

  const previousLevel = existing?.level ?? 0;
  return { mastery, leveledUp: level > previousLevel, previousLevel };
}

export type TopicMasterySummary = {
  topicId: string;
  topicName: string;
  topicSlug: string;
  level: number;
  confidence: number;
  totalAttempts: number;
  correctAttempts: number;
  insufficientData: boolean;
};

export async function getTopicMasterySummaries(studentId: string): Promise<TopicMasterySummary[]> {
  const topics = await prisma.topic.findMany({ orderBy: { order: "asc" } });
  const masteries = await prisma.mastery.findMany({ where: { studentId } });
  const byTopic = new Map(masteries.map((m) => [m.topicId, m]));

  return topics.map((topic) => {
    const m = byTopic.get(topic.id);
    return {
      topicId: topic.id,
      topicName: topic.name,
      topicSlug: topic.slug,
      level: m?.level ?? 0,
      confidence: m?.confidence ?? 0,
      totalAttempts: m?.totalAttempts ?? 0,
      correctAttempts: m?.correctAttempts ?? 0,
      insufficientData: (m?.totalAttempts ?? 0) < MIN_ATTEMPTS_FOR_ANY_LEVEL,
    };
  });
}
