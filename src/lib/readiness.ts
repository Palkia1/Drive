import { prisma } from "@/lib/db";
import { getTopicMasterySummaries } from "@/lib/mastery";

export type ExamReadiness =
  | { kind: "not_enough_data"; examCount: number }
  | { kind: "ready" }
  | { kind: "almost"; weakTopics: string[] }
  | { kind: "not_ready"; weakTopics: string[] };

const MIN_EXAMS_FOR_ASSESSMENT = 2;

/**
 * A single passed oefenexamen never implies "klaar voor het examen" (brief
 * §24-25). This looks at recent exam scores *and* topic mastery together —
 * both have to look solid before we say "ready".
 */
export async function getExamReadiness(studentId: string): Promise<ExamReadiness> {
  const recentExams = await prisma.examResult.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  if (recentExams.length < MIN_EXAMS_FOR_ASSESSMENT) {
    return { kind: "not_enough_data", examCount: recentExams.length };
  }

  const avgScore = recentExams.reduce((s, e) => s + e.scorePct, 0) / recentExams.length;
  const topics = await getTopicMasterySummaries(studentId);
  const weakTopics = topics.filter((t) => !t.insufficientData && t.level <= 2).map((t) => t.topicName);

  if (avgScore >= 88 && weakTopics.length === 0) return { kind: "ready" };
  if (avgScore >= 78) return { kind: "almost", weakTopics };
  return { kind: "not_ready", weakTopics };
}
