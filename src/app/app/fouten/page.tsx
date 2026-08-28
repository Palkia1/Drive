import { requireStudent } from "@/lib/session";
import { prisma } from "@/lib/db";
import { FoutenClient } from "@/components/practice/FoutenClient";

export default async function FoutenPage() {
  const { student } = await requireStudent();

  const [mistakes, saved] = await Promise.all([
    prisma.questionMark.findMany({
      where: { studentId: student.id, reason: "MISTAKE", resolvedAt: null },
      orderBy: { createdAt: "desc" },
      include: { question: { include: { topic: true } } },
    }),
    prisma.questionMark.findMany({
      where: { studentId: student.id, reason: "SAVED" },
      orderBy: { createdAt: "desc" },
      include: { question: { include: { topic: true } } },
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
