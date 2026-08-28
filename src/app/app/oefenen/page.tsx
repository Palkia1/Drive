import { requireStudent } from "@/lib/session";
import { getTopicMasterySummaries } from "@/lib/mastery";
import { prisma } from "@/lib/db";
import { OefenenClient } from "@/components/practice/OefenenClient";

export default async function OefenenPage() {
  const { student } = await requireStudent();
  const [topics, mistakesCount] = await Promise.all([
    getTopicMasterySummaries(student.id),
    prisma.questionMark.count({ where: { studentId: student.id, reason: "MISTAKE", resolvedAt: null } }),
  ]);

  return <OefenenClient topics={topics} mistakesCount={mistakesCount} />;
}
