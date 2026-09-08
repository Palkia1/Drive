import { requireStudent } from "@/lib/session";
import { prisma } from "@/lib/db";
import { FoutenClient } from "@/components/practice/FoutenClient";

export default async function FoutenPage() {
  const { student } = await requireStudent();

  const questionSelect = {
    question: { select: { id: true, prompt: true, difficulty: true, topic: { select: { name: true } } } },
  } as const;
  const [mistakes, saved] = await Promise.all([
    prisma.questionMark.findMany({
      where: { studentId: student.id, reason: "MISTAKE", resolvedAt: null },
      orderBy: { createdAt: "desc" },
      select: questionSelect,
      take: 100,
    }),
    prisma.questionMark.findMany({
      where: { studentId: student.id, reason: "SAVED" },
      orderBy: { createdAt: "desc" },
      select: questionSelect,
      take: 100,
    }),
  ]);

  const toItem = (m: (typeof mistakes)[number]) => ({
    id: m.question.id,
    prompt: m.question.prompt,
    topicName: m.question.topic.name,
    difficulty: m.question.difficulty,
  });

  return <FoutenClient mistakes={mistakes.map(toItem)} saved={saved.map(toItem)} />;
}
