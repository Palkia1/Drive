import Link from "next/link";
import { requireStudent } from "@/lib/session";
import { getRecommendation } from "@/lib/recommendation";
import { getExamReadiness } from "@/lib/readiness";
import { getOrCreateDailyGoal } from "@/lib/gamification";
import { getTopicMasterySummaries } from "@/lib/mastery";
import { RECOGNITION_TOPIC_SLUGS } from "@/lib/practice";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TopicIcon, getTopicColor } from "@/components/topics/TopicIcon";
import { ArrowRight, Target, Flame, PartyPopper, CircleAlert, Hourglass, School } from "lucide-react";

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
  const progressTopics = topics.filter((t) => !RECOGNITION_TOPIC_SLUGS.includes(t.topicSlug)).slice(0, 4);

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <span
            className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 font-extrabold text-white text-2xl"
            style={{ background: "var(--brand-500)" }}
          >
            {student.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="font-extrabold text-lg truncate">{student.username}</p>
            <p className="text-sm flex items-center gap-1 truncate" style={{ color: "var(--foreground-muted)" }}>
              <School size={13} />
              {student.drivingSchool?.name ?? "Zelfstandig leren"}
            </p>
          </div>
        </div>
        {student.streakCount > 0 && (
          <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl" style={{ background: "color-mix(in srgb, var(--gold-500) 15%, transparent)" }}>
            <Flame size={18} strokeWidth={2.5} style={{ color: "var(--gold-600)" }} />
            <span className="text-xs font-extrabold" style={{ color: "var(--gold-600)" }}>
              {student.streakCount}
            </span>
          </div>
        )}
      </div>

      <h1 className="text-[2.1rem] leading-[1.05] font-extrabold tracking-tight">{greeting()}!</h1>

      <Link
        href={recHref}
        className="block relative overflow-hidden rounded-[32px] p-6"
        style={{ background: `linear-gradient(135deg, ${recColor}, color-mix(in srgb, ${recColor} 65%, black))`, boxShadow: "0 20px 40px -18px color-mix(in srgb, " + recColor + " 75%, transparent)" }}
      >
        {/* decorative blobs — purely cosmetic, matches the reference hero card */}
        <span className="absolute -right-8 -top-14 w-40 h-40 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.09)" }} />
        <span className="absolute -right-14 -bottom-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.07)" }} />
        <span className="absolute right-10 top-1/3 w-16 h-16 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.06)" }} />

        <div className="relative flex items-start justify-between gap-3">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-white px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.22)" }}>
            Aanbevolen voor jou
          </span>
          <div className="icon-bubble shrink-0" style={{ background: "rgba(255,255,255,0.2)", width: 52, height: 52, borderRadius: 17 }}>
            <TopicIcon icon={recIcon} size={26} />
          </div>
        </div>
        <p className="relative mt-3 text-2xl font-extrabold text-white leading-tight">{recommendationTitle(recommendation)}</p>
        <p className="relative mt-1.5 text-sm text-white/85 max-w-[240px]">{recommendationSubtitle(recommendation)}</p>
        <span className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-extrabold px-5 py-3 rounded-full" style={{ background: "white", color: recColor }}>
          Start sessie <ArrowRight size={16} strokeWidth={3} />
        </span>
      </Link>

      {progressTopics.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-extrabold">Jouw voortgang</h2>
            <Link href="/app/profiel" className="text-sm font-bold" style={{ color: "var(--brand-600)" }}>
              Bekijk alles
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {progressTopics.map((t) => {
              const color = getTopicColor(t.topicIcon);
              const pct = t.insufficientData ? 0 : Math.round((t.level / 5) * 100);
              return (
                <Link
                  key={t.topicId}
                  href={`/app/sessie?mode=TOPIC&topics=${t.topicId}`}
                  className="rounded-[22px] p-5"
                  style={{ background: `color-mix(in srgb, ${color} 16%, var(--surface))` }}
                >
                  <div className="icon-bubble mb-4" style={{ width: 52, height: 52, borderRadius: 16, background: color }}>
                    <TopicIcon icon={t.topicIcon} size={26} />
                  </div>
                  <p className="font-extrabold truncate">{t.topicName}</p>
                  <p className="text-xs mt-1 mb-2.5 font-semibold" style={{ color: "var(--foreground-muted)" }}>
                    {t.insufficientData ? "Nog niet geoefend" : `Voortgang ${pct}%`}
                  </p>
                  <ProgressBar value={t.insufficientData ? 0 : t.level} max={5} color={color} height={7} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 px-1">
        <div className="icon-bubble shrink-0" style={{ width: 30, height: 30, borderRadius: 9, background: "var(--primary-500)" }}>
          <Target size={15} color="white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-sm">Dagdoel</span>
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
