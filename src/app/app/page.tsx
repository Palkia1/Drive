import Link from "next/link";
import { requireStudent } from "@/lib/session";
import { getRecommendation } from "@/lib/recommendation";
import { getExamReadiness } from "@/lib/readiness";
import { getOrCreateDailyGoal } from "@/lib/gamification";
import { getTopicMasterySummaries } from "@/lib/mastery";
import { RECOGNITION_TOPIC_SLUGS } from "@/lib/practice";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TopicIcon, getTopicColor } from "@/components/topics/TopicIcon";
import { ArrowRight, Target, Flame, Star, PartyPopper, CircleAlert, Hourglass } from "lucide-react";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

export default async function HomePage() {
  const { student } = await requireStudent();
  const [recommendation, dailyGoal, readiness, topics] = await Promise.all([
    getRecommendation(student.id),
    getOrCreateDailyGoal(student.id),
    getExamReadiness(student.id),
    getTopicMasterySummaries(student.id),
  ]);

  const recHref =
    recommendation.kind === "default"
      ? "/app/sessie?mode=QUICK"
      : `/app/sessie?mode=TOPIC&topics=${recommendation.topic.topicId}`;
  const recColor = recommendation.kind === "default" ? "var(--brand-500)" : getTopicColor(recommendation.topic.topicIcon);
  const recIcon = recommendation.kind === "default" ? "sign" : recommendation.topic.topicIcon;
  const progressTopics = topics.filter((t) => !RECOGNITION_TOPIC_SLUGS.includes(t.topicSlug));

  return (
    <div className="space-y-6">
      {/* Compacte identiteitsregel: naam + level links, streak + xp rechts — elk stukje data precies één keer (de rest staat al in de topbar). */}
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
            <Flame size={18} strokeWidth={2.5} style={{ color: "var(--gold-600)" }} />
            <span className="text-sm font-extrabold">{student.streakCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={18} strokeWidth={2.5} fill="var(--brand-500)" style={{ color: "var(--brand-500)" }} />
            <span className="text-sm font-extrabold">{student.xp.toLocaleString("nl-NL")}</span>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight">{greeting()}!</h1>

      <Link
        href={recHref}
        className="block relative overflow-hidden rounded-[26px] p-5"
        style={{ background: `linear-gradient(135deg, ${recColor}, color-mix(in srgb, ${recColor} 65%, black))`, boxShadow: "0 14px 30px -14px color-mix(in srgb, " + recColor + " 70%, transparent)" }}
      >
        <span className="absolute -right-6 -top-10 w-28 h-28 rounded-full pointer-events-none animate-bokeh-a" style={{ background: "rgba(255,255,255,0.08)" }} />
        <span className="absolute -right-10 bottom-0 w-36 h-36 rounded-full pointer-events-none animate-bokeh-b" style={{ background: "rgba(255,255,255,0.06)" }} />
        <span className="absolute left-8 -bottom-8 w-16 h-16 rounded-full pointer-events-none animate-bokeh-b" style={{ background: "rgba(255,255,255,0.07)" }} />

        <div className="relative flex items-start justify-between gap-3">
          <span className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white" style={{ background: "rgba(255,255,255,0.22)" }}>
            Aanbevolen voor jou
          </span>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: "rgba(255,255,255,0.2)" }}>
            <TopicIcon icon={recIcon} size={24} />
          </div>
        </div>
        <p className="relative mt-3 text-xl font-extrabold leading-tight text-white">{recommendationTitle(recommendation)}</p>
        <p className="relative mt-1 max-w-[240px] text-sm text-white/85">{recommendationSubtitle(recommendation)}</p>
        <span className="relative mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-extrabold" style={{ color: recColor }}>
          Start sessie <ArrowRight size={16} strokeWidth={3} />
        </span>
      </Link>

      {progressTopics.length > 0 && (
        <div>
          <h2 className="mb-3 text-xl font-extrabold">Jouw voortgang</h2>
          <div className="grid grid-cols-2 gap-3.5">
            {progressTopics.map((t) => {
              const color = getTopicColor(t.topicIcon);
              return (
                <Link
                  key={t.topicId}
                  href={`/app/sessie?mode=TOPIC&topics=${t.topicId}`}
                  className="rounded-[22px] p-4"
                  style={{ background: color }}
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "rgba(255,255,255,0.22)" }}>
                    <TopicIcon icon={t.topicIcon} size={22} />
                  </div>
                  <p className="truncate font-extrabold text-white">{t.topicName}</p>
                  <p className="mb-2 mt-0.5 text-xs font-bold text-white/80">
                    {t.insufficientData ? " " : `Level ${t.level}/5`}
                  </p>
                  <ProgressBar value={t.insufficientData ? 0 : t.level} max={5} color="white" trackColor="rgba(255,255,255,0.25)" height={6} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 card p-4">
        <div className="icon-bubble" style={{ width: 30, height: 30, borderRadius: 9, background: "var(--primary-500)" }}>
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

      <ReadinessCard readiness={readiness} />
    </div>
  );
}

function recommendationTitle(rec: Awaited<ReturnType<typeof getRecommendation>>) {
  if (rec.kind === "default") return "Snel oefenen";
  return rec.topic.topicName;
}

function recommendationSubtitle(rec: Awaited<ReturnType<typeof getRecommendation>>) {
  switch (rec.kind) {
    case "almost_level":
      return `Je bent bijna level ${rec.nextLevel}. Nog een paar vragen te gaan.`;
    case "weak_topic":
      return "Hier heb je de laatste tijd moeite mee gehad.";
    case "new_topic":
      return "Nog niet geoefend — begin hier.";
    default:
      return "Een korte, gemixte oefening van 8 vragen.";
  }
}

function ReadinessCard({ readiness }: { readiness: Awaited<ReturnType<typeof getExamReadiness>> }) {
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
    <div className="card p-4 flex items-start gap-3">
      <div className="icon-bubble shrink-0" style={{ width: 34, height: 34, borderRadius: 11, background: copy.color }}>
        <Icon size={17} color="white" />
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
