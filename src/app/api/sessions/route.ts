import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { selectQuestionsForSession } from "@/lib/practice";
import { toClientScene } from "@/lib/questions/sanitize";
import { getTopicMasterySummaries } from "@/lib/mastery";
import type { QuestionScene } from "@/lib/questions/types";

const bodySchema = z.object({
  mode: z.enum(["QUICK", "TOPIC", "MISTAKES", "WEAK_SPOTS", "LESSON", "EXAM"]),
  topicIds: z.array(z.string()).optional().default([]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const student = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "Geen leerlingprofiel" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  const { mode, topicIds } = parsed.data;

  const { questions, resolvedTopicIds } = await selectQuestionsForSession(student.id, mode, topicIds);
  if (questions.length === 0) {
    return NextResponse.json({ error: "Geen vragen beschikbaar voor deze keuze." }, { status: 404 });
  }

  const practiceSession = await prisma.practiceSession.create({
    data: {
      studentId: student.id,
      mode,
      topicIds: JSON.stringify(resolvedTopicIds.length ? resolvedTopicIds : topicIds),
      totalCount: questions.length,
    },
  });

  const touchedTopicIds = [...new Set(questions.map((q) => q.topicId))];
  const masterySummaries = await getTopicMasterySummaries(student.id);
  const masterySnapshot = Object.fromEntries(
    masterySummaries.filter((m) => touchedTopicIds.includes(m.topicId)).map((m) => [m.topicId, m.level])
  );

  const savedMarks = await prisma.questionMark.findMany({
    where: { studentId: student.id, reason: "SAVED", questionId: { in: questions.map((q) => q.id) } },
    select: { questionId: true },
  });

  return NextResponse.json({
    sessionId: practiceSession.id,
    mode,
    questions: questions.map((q) => ({
      id: q.id,
      topicId: q.topicId,
      type: q.type,
      difficulty: q.difficulty,
      prompt: q.prompt,
      scene: toClientScene(JSON.parse(q.scene) as QuestionScene),
    })),
    masterySnapshot,
    savedQuestionIds: savedMarks.map((m) => m.questionId),
  });
}
