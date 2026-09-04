import Link from "next/link";
import { FlaskConical, ChevronRight } from "lucide-react";
import { requireBetaTester } from "@/lib/session";
import { prisma } from "@/lib/db";
import { TopicIcon, getTopicColor } from "@/components/topics/TopicIcon";

export default async function BetaPortalPage() {
  await requireBetaTester();
  const topics = await prisma.topic.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { questions: true } } },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="icon-bubble shrink-0" style={{ width: 34, height: 34, borderRadius: 11, background: "var(--purple-600)" }}>
          <FlaskConical size={17} color="white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold">Feedbackportaal</h1>
          <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
            Beoordeel content per onderwerp
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {topics.map((t) => (
          <Link key={t.id} href={`/app/beta/${t.id}`} className="card p-4 flex items-center gap-3">
            <div className="icon-bubble shrink-0" style={{ width: 38, height: 38, borderRadius: 12, background: getTopicColor(t.icon) }}>
              <TopicIcon icon={t.icon} size={19} />
            </div>
            <span className="font-semibold flex-1">{t.name}</span>
            <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>
              {t._count.questions}
            </span>
            <ChevronRight size={16} style={{ color: "var(--foreground-muted)" }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
