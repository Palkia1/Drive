import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkAnswer } from "@/lib/answers";
import { recomputeMasteryAfterAttempt } from "@/lib/mastery";
import type { QuestionScene } from "@/lib/questions/types";

const answerSchema = z.union([
  z.object({ kind: z.literal("SINGLE_CHOICE"), optionId: z.string() }),
  z.object({ kind: z.literal("MULTIPLE_CHOICE"), optionIds: z.array(z.string()) }),
  z.object({ kind: z.literal("HOTSPOT_SLOT"), slot: z.string() }),
  z.object({ kind: z.literal("HOTSPOT_SIGN"), signId: z.string() }),
]);

const bodySchema = z.object({
  questionId: z.string(),
  answer: answerSchema,
  timeMs: z.number().int().min(0).max(10 * 60 * 1000),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const student = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (!student) return NextResponse.json({ error: "Geen leerlingprofiel" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  const { questionId, answer, timeMs } = parsed.data;

  const practiceSession = await prisma.practiceSession.findUnique({ where: { id: sessionId } });
  if (!practiceSession || practiceSession.studentId !== student.id) {
    return NextResponse.json({ error: "Sessie niet gevonden" }, { status: 404 });
  }
  if (practiceSession.completedAt) {
    return NextResponse.json({ error: "Sessie is al afgerond" }, { status: 409 });
  }

  const existingAttempt = await prisma.attempt.findFirst({ where: { sessionId, questionId } });
  if (existingAttempt) {
    return NextResponse.json({ error: "Deze vraag is al beantwoord in deze sessie" }, { status: 409 });
  }

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) return NextResponse.json({ error: "Vraag niet gevonden" }, { status: 404 });

  const scene = JSON.parse(question.scene) as QuestionScene;
  const isCorrect = checkAnswer(scene, answer);

  await prisma.attempt.create({
    data: {
      studentId: student.id,
      questionId,
      sessionId,
      isCorrect,
      answer: JSON.stringify(answer),
      timeMs,
    },
  });

  // A question can count toward more than one topic (e.g. one that's really
  // about both voorrang and weggebruikers) — credit its primary topic plus
  // any secondaryTopicIds, so mastery reflects every category the question
  // actually tests rather than an arbitrary single bucket.
  const secondaryTopicIds: string[] = question.secondaryTopicIds ? JSON.parse(question.secondaryTopicIds) : [];
  for (const topicId of [question.topicId, ...secondaryTopicIds]) {
    await recomputeMasteryAfterAttempt(student.id, topicId, {
      correct: isCorrect,
      difficulty: question.difficulty,
    });
  }

  if (isCorrect) {
    await prisma.questionMark.updateMany({
      where: { studentId: student.id, questionId, reason: "MISTAKE", resolvedAt: null },
      data: { resolvedAt: new Date() },
    });
  } else {
    await prisma.questionMark.upsert({
      where: { studentId_questionId_reason: { studentId: student.id, questionId, reason: "MISTAKE" } },
      update: { resolvedAt: null },
      create: { studentId: student.id, questionId, reason: "MISTAKE" },
    });
  }

  return NextResponse.json({ isCorrect });
}
