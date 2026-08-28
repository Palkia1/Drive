import { prisma } from "@/lib/db";
import { getTopicMasterySummaries } from "@/lib/mastery";

export function activityLabel(lastActivityAt: Date | null): { label: string; level: "high" | "medium" | "low" | "none" } {
  if (!lastActivityAt) return { label: "Nog nooit actief", level: "none" };
  const days = Math.floor((Date.now() - lastActivityAt.getTime()) / 86_400_000);
  if (days <= 0) return { label: "Vandaag actief", level: "high" };
  if (days === 1) return { label: "Gisteren actief", level: "high" };
  if (days <= 6) return { label: `${days} dagen geleden`, level: "medium" };
  return { label: `${days} dagen geleden`, level: "low" };
}

export async function getSchoolStudentsOverview(schoolId: string) {
  const students = await prisma.studentProfile.findMany({
    where: { drivingSchoolId: schoolId },
    include: { _count: { select: { examResults: true } } },
    orderBy: { lastActivityAt: "desc" },
  });

  return Promise.all(
    students.map(async (s) => {
      const masteries = await getTopicMasterySummaries(s.id);
      const measured = masteries.filter((m) => !m.insufficientData);
      const strongest = [...measured].sort((a, b) => b.confidence - a.confidence)[0] ?? null;
      const weakest = [...measured].sort((a, b) => a.confidence - b.confidence)[0] ?? null;

      return {
        studentId: s.id,
        username: s.username,
        xp: s.xp,
        level: s.level,
        streak: s.streakCount,
        activity: activityLabel(s.lastActivityAt),
        strongestTopic: strongest?.topicName ?? null,
        weakestTopic: weakest && weakest.topicId !== strongest?.topicId ? weakest.topicName : measured.length > 1 ? weakest?.topicName ?? null : null,
        examCount: s._count.examResults,
      };
    })
  );
}

export async function getStudentDetailForSchool(schoolId: string, studentId: string) {
  const student = await prisma.studentProfile.findFirst({
    where: { id: studentId, drivingSchoolId: schoolId },
    include: { user: true },
  });
  if (!student) return null;

  const [masteries, totalAttempts, correctAttempts, examResults, recentSessions, openMistakes] = await Promise.all([
    getTopicMasterySummaries(student.id),
    prisma.attempt.count({ where: { studentId: student.id } }),
    prisma.attempt.count({ where: { studentId: student.id, isCorrect: true } }),
    prisma.examResult.findMany({ where: { studentId: student.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.practiceSession.findMany({
      where: { studentId: student.id, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: 15,
    }),
    prisma.questionMark.count({ where: { studentId: student.id, reason: "MISTAKE", resolvedAt: null } }),
  ]);

  return {
    student,
    masteries,
    totalAttempts,
    correctAttempts,
    accuracyPct: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : null,
    examResults,
    recentSessions,
    openMistakes,
    activity: activityLabel(student.lastActivityAt),
  };
}
