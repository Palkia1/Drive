import Link from "next/link";
import { requireStudent } from "@/lib/session";
import { getRecommendation } from "@/lib/recommendation";
import { getExamReadiness } from "@/lib/readiness";
import { getOrCreateDailyGoal } from "@/lib/gamification";
import { getTopicMasterySummaries } from "@/lib/mastery";
import { RECOGNITION_TOPIC_SLUGS } from "@/lib/practice";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TopicIcon, getTopicColor } from "@/components/topics/TopicIcon";
import { ArrowRight, Target, Flame, Zap, PartyPopper, CircleAlert, Hourglass } from "lucide-react";

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
  const recIcon = recommendation.kind === "default" ? "sign" : recommendation.topic.topicIcon;
  const moduleTopics = topics.filter((t) => !RECOGNITION_TOPIC_SLUGS.includes(t.topicSlug));

  return (
    <div className="space-y-6">
      {/* Compacte bovenbalk: naam + level links, streak + xp rechts — elk stukje data precies één keer. */}
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-500 text-lg font-extrabold text-white">
            {student.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate font-extrabold text-slate-800">{student.username}</p>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
              Niv. {student.level}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1">
            <Flame size={18} strokeWidth={2.5} className="text-orange-500" />
            <span className="text-sm font-extrabold text-slate-700">{student.streakCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={18} strokeWidth={2.5} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-extrabold text-slate-700">{student.xp.toLocaleString("nl-NL")}</span>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">{greeting()}!</h1>

      <Link
        href={recHref}
        className="block rounded-2xl border-2 border-b-4 border-sky-600 bg-sky-500 p-5 text-white transition-all active:translate-y-[2px] active:border-b-2"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
            Aanbevolen voor jou
          </span>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <TopicIcon icon={recIcon} size={24} />
          </div>
        </div>
        <p className="mt-3 text-xl font-extrabold leading-tight">{recommendationTitle(recommendation)}</p>
        <p className="mt-1 max-w-[240px] text-sm text-sky-50">{recommendationSubtitle(recommendation)}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-sky-600">
          Start sessie <ArrowRight size={16} strokeWidth={3} />
        </span>
      </Link>

      <div>
        <h2 className="mb-3 text-xl font-extrabold text-slate-800">Oefenmodules</h2>
        <div className="grid grid-cols-2 gap-4 pb-20">
          {moduleTopics.map((t) => {
            const color = getTopicColor(t.topicIcon);
            return (
              <Link
                key={t.topicId}
                href={`/app/sessie?mode=TOPIC&topics=${t.topicId}`}
                className="rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 transition-all hover:border-sky-300 active:translate-y-[2px] active:border-b-2"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: color }}>
                  <TopicIcon icon={t.topicIcon} size={24} />
                </div>
                <p className="truncate font-bold text-slate-800">{t.topicName}</p>
                <p className="mb-2 mt-0.5 text-xs font-semibold text-slate-500">
                  {t.insufficientData ? "Nog niet geoefend" : `Level ${t.level}/5`}
                </p>
                <ProgressBar value={t.insufficientData ? 0 : t.level} max={5} color={color} height={6} />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500">
          <Target size={16} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Dagdoel</span>
            <span className="text-xs font-bold text-slate-500">
              {dailyGoal.progress}/{dailyGoal.target}
            </span>
          </div>
          <ProgressBar value={dailyGoal.progress} max={dailyGoal.target} color="#1CB0F6" height={8} />
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
          color: "#64748b",
          bg: "bg-slate-400",
          icon: Hourglass,
        };
      case "ready":
        return { title: "Je bent er klaar voor!", text: "Je scoort consistent goed en beheerst de onderwerpen.", color: "#1f9e4d", bg: "bg-emerald-500", icon: PartyPopper };
      case "almost":
        return {
          title: "Je bent er bijna",
          text: readiness.weakTopics.length
            ? `Besteed nog aandacht aan: ${readiness.weakTopics.join(", ")}.`
            : "Nog een paar sterke oefenexamens en je zit goed.",
          color: "#e08d00",
          bg: "bg-amber-500",
          icon: Hourglass,
        };
      case "not_ready":
        return {
          title: "Nog niet klaar voor het examen",
          text: readiness.weakTopics.length
            ? `Blijf oefenen op: ${readiness.weakTopics.join(", ")}.`
            : "Blijf regelmatig oefenexamens maken.",
          color: "#e13636",
          bg: "bg-red-500",
          icon: CircleAlert,
        };
    }
  })();
  const Icon = copy.icon;

  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${copy.bg}`}>
        <Icon size={17} className="text-white" />
      </div>
      <div>
        <p className="text-sm font-bold" style={{ color: copy.color }}>
          {copy.title}
        </p>
        <p className="mt-1 text-xs text-slate-500">{copy.text}</p>
      </div>
    </div>
  );
}
