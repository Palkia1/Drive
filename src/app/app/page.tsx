import Link from "next/link";
import { requireStudent } from "@/lib/session";
import { getRecommendation } from "@/lib/recommendation";
import { getExamReadiness } from "@/lib/readiness";
import { getOrCreateDailyGoal } from "@/lib/gamification";
import { getTopicMasterySummaries } from "@/lib/mastery";
import { getHomeworkForStudent } from "@/lib/homework";
import { RECOGNITION_TOPIC_SLUGS } from "@/lib/practice";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TopicPath } from "@/components/topics/TopicPath";
import { Mascot } from "@/components/mascot/Mascot";
import { Star, PartyPopper, CircleAlert, Hourglass, BookOpen, Target } from "lucide-react";
import { StreakFlameIcon } from "@/components/icons/StreakFlameIcon";
import { Greeting } from "@/components/ui/Greeting";
import { EmailVerificationBanner } from "@/components/ui/EmailVerificationBanner";

export default async function HomePage() {
  const { student } = await requireStudent();
  const [recommendation, dailyGoal, readiness, topics, homework] = await Promise.all([
    getRecommendation(student.id),
    getOrCreateDailyGoal(student.id),
    getExamReadiness(student.id),
    getTopicMasterySummaries(student.id),
    getHomeworkForStudent(student.id),
  ]);
  const openHomework = homework.filter((h) => !h.done);
  const progressTopics = topics.filter((t) => !RECOGNITION_TOPIC_SLUGS.includes(t.topicSlug));

  const recommendedTopicId = recommendation.kind !== "default" ? recommendation.topic.topicId : null;
  const recommendedOnPath = progressTopics.some((t) => t.topicId === recommendedTopicId);
  const recHref =
    recommendation.kind === "default"
      ? "/app/sessie?mode=QUICK"
      : `/app/sessie?mode=TOPIC&topics=${recommendation.topic.topicId}`;

  return (
    <div className="space-y-6">
      {!student.user.emailVerified && <EmailVerificationBanner />}
      {/* Identity strip: naam + level links, streak + xp rechts — elk stukje data precies één keer. */}
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white"
            style={{ background: "var(--brand-500)" }}
          >
            {student.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate font-extrabold">{student.username}</p>
            <span className="shrink-0 rounded-full px-2 py-1 text-xs font-bold" style={{ background: "var(--surface-muted)", color: "var(--foreground-muted)" }}>
              Niv. {student.level}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1">
            <StreakFlameIcon size={18} color="var(--gold-600)" />
            <span className="text-sm font-extrabold">{student.streakCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={18} strokeWidth={2.5} fill="var(--brand-500)" style={{ color: "var(--brand-500)" }} />
            <span className="text-sm font-extrabold">{student.xp.toLocaleString("nl-NL")}</span>
          </div>
        </div>
      </div>

      {/* Mascot + speech bubble: ONE thing to read, ONE thing to do —
         replaces a headline, a separate gradient recommendation card, and a
         grid of 5-7 equally-weighted topic tiles with a single synthesized
         message (Tesler's law: the system already computed what matters
         most, so say that, not five raw signals for the student to weigh
         themselves) and a single follow-up action (Hick's law: fewer
         competing choices on screen). */}
      <div className="flex items-end gap-3">
        <Mascot mood={mascotMoodFor(recommendation)} size={64} className="shrink-0" />
        <div
          className="relative flex-1 rounded-2xl px-4 py-3"
          style={{ background: "var(--surface-muted)" }}
        >
          <span
            className="absolute -left-1.5 bottom-4 h-3 w-3 rotate-45"
            style={{ background: "var(--surface-muted)" }}
            aria-hidden="true"
          />
          <p className="text-xs font-bold" style={{ color: "var(--foreground-muted)" }}>
            <Greeting />, {student.username}
          </p>
          <p className="mt-0.5 text-[15px] font-bold leading-snug">{speechFor(recommendation)}</p>
          {!recommendedOnPath && (
            <Link href={recHref} className="btn-primary mt-3 inline-flex text-sm !px-4 !py-2">
              Start sessie
            </Link>
          )}
        </div>
      </div>

      {openHomework.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-1.5">
            <BookOpen size={16} style={{ color: "var(--primary-500)" }} /> Huiswerk van je rijschool
          </h2>
          <div className="space-y-3">
            {openHomework.map((h) => (
              <Link
                key={h.id}
                href={h.topicId ? `/app/sessie?mode=TOPIC&topics=${h.topicId}` : "/app/sessie?mode=QUICK"}
                className="block"
              >
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{h.topicName ?? "Alle onderwerpen"}</span>
                  <span style={{ color: "var(--foreground-muted)" }}>
                    {h.progress}/{h.targetCount}
                  </span>
                </div>
                <ProgressBar value={h.progress} max={h.targetCount} color="var(--primary-500)" height={7} />
                {h.dueDate && (
                  <p className="text-xs mt-1" style={{ color: h.overdue ? "var(--danger-500)" : "var(--foreground-muted)" }}>
                    {h.overdue ? "Verlopen op" : "Tot"} {new Date(h.dueDate).toLocaleDateString("nl-NL")}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {progressTopics.length > 0 && (
        <div className="overflow-x-auto">
          <TopicPath topics={progressTopics} currentTopicId={recommendedOnPath ? recommendedTopicId : null} />
        </div>
      )}

      {/* Dagdoel + examengereedheid — one glanceable card instead of two,
         so the "how am I doing" answer isn't split across separate blocks
         the student has to mentally combine. */}
      <div className="card divide-y" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 p-4">
          <div className="icon-bubble shrink-0" style={{ width: 30, height: 30, borderRadius: 9, background: "var(--primary-500)" }}>
            <Target size={15} color="white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-bold">Dagdoel</span>
              <span className="text-xs font-bold" style={{ color: "var(--foreground-muted)" }}>
                {dailyGoal.progress}/{dailyGoal.target}
              </span>
            </div>
            <ProgressBar value={dailyGoal.progress} max={dailyGoal.target} color="var(--primary-500)" height={8} />
          </div>
        </div>
        <ReadinessRow readiness={readiness} />
      </div>
    </div>
  );
}

function mascotMoodFor(rec: Awaited<ReturnType<typeof getRecommendation>>): "wave" | "cheer" | "think" {
  switch (rec.kind) {
    case "almost_level":
      return "cheer";
    case "weak_topic":
      return "think";
    default:
      return "wave";
  }
}

function speechFor(rec: Awaited<ReturnType<typeof getRecommendation>>): string {
  switch (rec.kind) {
    case "almost_level":
      return `Je staat vlak voor level ${rec.nextLevel} bij ${rec.topic.topicName} — nog een paar vragen!`;
    case "weak_topic":
      return `${rec.topic.topicName} kan nog wat oefening gebruiken. Zullen we?`;
    case "new_topic":
      return `${rec.topic.topicName} heb je nog niet geprobeerd — spring op de kaart hieronder.`;
    default:
      return "Klaar voor een snelle oefenronde van 8 vragen?";
  }
}

function ReadinessRow({ readiness }: { readiness: Awaited<ReturnType<typeof getExamReadiness>> }) {
  const copy = (() => {
    switch (readiness.kind) {
      case "not_enough_data":
        return {
          title: "Examengereedheid",
          text: `Maak nog ${2 - readiness.examCount} oefenexamen${2 - readiness.examCount === 1 ? "" : "s"} zodat we hier iets zinnigs over kunnen zeggen.`,
          color: "var(--foreground-muted)",
          icon: Hourglass,
        };
      case "ready":
        return { title: "Je bent er klaar voor!", text: "Je scoort consistent goed en beheerst de onderwerpen.", color: "var(--success-600)", icon: PartyPopper };
      case "almost":
        return {
          title: "Je bent er bijna",
          text: readiness.weakTopics.length
            ? `Besteed nog aandacht aan: ${readiness.weakTopics.join(", ")}.`
            : "Nog een paar sterke oefenexamens en je zit goed.",
          color: "var(--gold-600)",
          icon: Hourglass,
        };
      case "not_ready":
        return {
          title: "Nog niet klaar voor het examen",
          text: readiness.weakTopics.length
            ? `Blijf oefenen op: ${readiness.weakTopics.join(", ")}.`
            : "Blijf regelmatig oefenexamens maken.",
          color: "var(--danger-500)",
          icon: CircleAlert,
        };
    }
  })();
  const Icon = copy.icon;

  return (
    <div className="flex items-start gap-3 p-4">
      <div className="icon-bubble shrink-0" style={{ width: 30, height: 30, borderRadius: 9, background: copy.color }}>
        <Icon size={15} color="white" />
      </div>
      <div>
        <p className="font-bold text-sm" style={{ color: copy.color }}>
          {copy.title}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
          {copy.text}
        </p>
      </div>
    </div>
  );
}
