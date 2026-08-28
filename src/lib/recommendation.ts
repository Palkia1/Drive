import { getTopicMasterySummaries, type TopicMasterySummary } from "@/lib/mastery";

const LEVEL_THRESHOLDS = [0, 0.2, 0.4, 0.6, 0.78, 0.92];

export type Recommendation =
  | { kind: "almost_level"; topic: TopicMasterySummary; nextLevel: number }
  | { kind: "weak_topic"; topic: TopicMasterySummary }
  | { kind: "new_topic"; topic: TopicMasterySummary }
  | { kind: "default" };

/**
 * Deliberately simple and explainable (brief §9): every branch here maps
 * directly to a number we can point at (confidence, level, attempt count) —
 * no invented "AI insight" language.
 */
export async function getRecommendation(studentId: string): Promise<Recommendation> {
  const topics = await getTopicMasterySummaries(studentId);

  const almost = topics
    .filter((t) => !t.insufficientData && t.level < 5)
    .find((t) => t.confidence >= LEVEL_THRESHOLDS[t.level + 1] - 0.08);
  if (almost) return { kind: "almost_level", topic: almost, nextLevel: almost.level + 1 };

  const weak = topics
    .filter((t) => !t.insufficientData && t.level <= 1)
    .sort((a, b) => a.confidence - b.confidence)[0];
  if (weak) return { kind: "weak_topic", topic: weak };

  const untried = topics.filter((t) => t.insufficientData)[0];
  if (untried) return { kind: "new_topic", topic: untried };

  return { kind: "default" };
}
