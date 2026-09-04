import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireBetaTester } from "@/lib/session";
import { prisma } from "@/lib/db";
import { BetaQuestionList } from "@/components/beta/BetaQuestionList";
import type { BetaQuestion } from "@/components/beta/BetaQuestionCard";

export default async function BetaTopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const tester = await requireBetaTester();
  const { topicId } = await params;
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic) notFound();

  const questions = await prisma.question.findMany({
    where: { topicId },
    // `id` as a tiebreaker keeps the list order stable across reloads —
    // bulk-seeded rows can share the same createdAt millisecond, and without
    // a unique secondary key Postgres doesn't guarantee a consistent order
    // for those ties, which would otherwise make cards visibly reshuffle
    // mid-review.
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      reviews: { where: { testerId: tester.id }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const clientQuestions: BetaQuestion[] = questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    explanation: q.explanation,
    type: q.type,
    status: q.status,
    difficulty: q.difficulty,
    scene: JSON.parse(q.scene),
    lastReview: q.reviews[0] ? { action: q.reviews[0].action, createdAt: q.reviews[0].createdAt.toISOString() } : null,
  }));

  return (
    <div className="space-y-4">
      <Link href="/app/beta" className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>
        <ChevronLeft size={16} /> Onderwerpen
      </Link>
      <h1 className="text-xl font-extrabold">{topic.name}</h1>
      <BetaQuestionList questions={clientQuestions} />
    </div>
  );
}
