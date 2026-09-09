import { prisma } from "@/lib/db";

export type HomeworkView = {
  id: string;
  topicId: string | null;
  topicName: string | null;
  targetCount: number;
  progress: number;
  done: boolean;
  note: string | null;
  dueDate: Date | null;
  overdue: boolean;
  createdAt: Date;
};

// No stored "progress" field — computed live from the student's own Attempt
// history since the homework was assigned, same reasoning as Challenge
// standings in src/lib/challenges.ts: one less thing that can drift out of
// sync with what the student actually did.
async function attachProgress(
  items: { id: string; topicId: string | null; topic: { name: string } | null; targetCount: number; note: string | null; dueDate: Date | null; createdAt: Date }[],
  studentId: string
): Promise<HomeworkView[]> {
  if (items.length === 0) return [];
  const now = new Date();
  const earliestCreatedAt = items.reduce((min, h) => (h.createdAt < min ? h.createdAt : min), items[0].createdAt);

  const attempts = await prisma.attempt.findMany({
    where: { studentId, answeredAt: { gte: earliestCreatedAt } },
    select: { answeredAt: true, question: { select: { topicId: true } } },
  });

  return items.map((h) => {
    const progress = attempts.filter((a) => a.answeredAt >= h.createdAt && (!h.topicId || a.question.topicId === h.topicId)).length;
    return {
      id: h.id,
      topicId: h.topicId,
      topicName: h.topic?.name ?? null,
      targetCount: h.targetCount,
      progress: Math.min(progress, h.targetCount),
      done: progress >= h.targetCount,
      note: h.note,
      dueDate: h.dueDate,
      overdue: Boolean(h.dueDate && h.dueDate < now && progress < h.targetCount),
      createdAt: h.createdAt,
    };
  });
}

const HOMEWORK_SELECT = {
  id: true,
  topicId: true,
  topic: { select: { name: true } },
  targetCount: true,
  note: true,
  dueDate: true,
  createdAt: true,
} as const;

/** Most recent homework for a student, newest first — capped so a long
 * history doesn't grow the home page or the instructor's student page
 * unbounded. */
export async function getHomeworkForStudent(studentId: string): Promise<HomeworkView[]> {
  const items = await prisma.homework.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: HOMEWORK_SELECT,
  });
  return attachProgress(items, studentId);
}

export async function assignHomework(
  schoolId: string,
  instructorUserId: string,
  input: { studentId: string; topicId: string | null; targetCount: number; note: string | null; dueDate: Date | null }
): Promise<{ ok: true } | { error: string }> {
  const student = await prisma.studentProfile.findUnique({
    where: { id: input.studentId },
    select: { drivingSchoolId: true },
  });
  if (!student || student.drivingSchoolId !== schoolId) return { error: "Leerling niet gevonden bij deze rijschool" };

  await prisma.homework.create({
    data: {
      drivingSchoolId: schoolId,
      studentId: input.studentId,
      topicId: input.topicId,
      targetCount: input.targetCount,
      note: input.note,
      dueDate: input.dueDate,
      createdBy: instructorUserId,
    },
  });
  return { ok: true };
}

export async function deleteHomework(schoolId: string, homeworkId: string): Promise<{ ok: true } | { error: string }> {
  const homework = await prisma.homework.findUnique({ where: { id: homeworkId }, select: { drivingSchoolId: true } });
  if (!homework || homework.drivingSchoolId !== schoolId) return { error: "Huiswerk niet gevonden" };
  await prisma.homework.delete({ where: { id: homeworkId } });
  return { ok: true };
}
