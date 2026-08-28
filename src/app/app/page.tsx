import Link from "next/link";
import { requireStudent } from "@/lib/session";
import { getRecommendation } from "@/lib/recommendation";
import { getExamReadiness } from "@/lib/readiness";
import { getOrCreateDailyGoal } from "@/lib/gamification";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TopicIcon, getTopicColor } from "@/components/topics/TopicIcon";
import { ArrowRight, Target, Flame, Dumbbell, GraduationCap, PartyPopper, CircleAlert, Hourglass } from "lucide-react";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

export default async function HomePage() {
  const { student } = await requireStudent();
  const [recommendation, dailyGoal, readiness] = await Promise.all([
    getRecommendation(student.id),
    getOrCreateDailyGoal(student.id),
    getExamReadiness(student.id),
  ]);

  const firstName = student.username;
  const recHref =
    recommendation.kind === "default"
      ? "/app/sessie?mode=QUICK"
      : `/app/sessie?mode=TOPIC&topics=${recommendation.topic.topicId}`;
  const recColor = recommendation.kind === "default" ? "var(--brand-500)" : getTopicColor(recommendation.topic.topicIcon);
  const recIcon = recommendation.kind === "default" ? "sign" : recommendation.topic.topicIcon;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">
          {greeting()}, {firstName}!
        </h1>
        {student.streakCount > 0 ? (
          <div className="mt-2 inline-flex items-center gap-1.5 pill" style={{ background: "color-mix(in srgb, var(--gold-500) 15%, transparent)", color: "var(--gold-600)" }}>
            <Flame size={14} strokeWidth={2.5} />
            {student.streakCount} {student.streakCount === 1 ? "dag" : "dagen"} op rij
          </div>
        ) : (
          <p className="mt-1.5 text-sm" style={{ color: "var(--foreground-muted)" }}>
            Start vandaag je streak met een korte sessie.
          </p>
        )}
      </div>

      <Link
        href={recHref}
        className="block relative overflow-hidden rounded-[26px] p-5"
        style={{ background: `linear-gradient(135deg, ${recColor}, color-mix(in srgb, ${recColor} 60%, black))`, boxShadow: "0 14px 30px -14px color-mix(in srgb, " + recColor + " 70%, transparent)" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/75">Aanbevolen voor jou</p>
            <p className="mt-1 text-xl font-extrabold text-white">{recommendationTitle(recommendation)}</p>
            <p className="mt-1 text-sm text-white/85 max-w-[220px]">{recommendationSubtitle(recommendation)}</p>
          </div>
          <div className="icon-bubble shrink-0" style={{ background: "rgba(255,255,255,0.2)", width: 48, height: 48, borderRadius: 16 }}>
            <TopicIcon icon={recIcon} size={24} />
          </div>
        </div>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-extrabold px-4 py-2 rounded-full" style={{ background: "white", color: recColor }}>
          Start sessie <ArrowRight size={15} strokeWidth={3} />
        </span>
      </Link>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-bold text-sm flex items-center gap-1.5">
            <div className="icon-bubble" style={{ width: 26, height: 26, borderRadius: 8, background: "var(--primary-500)" }}>
              <Target size={14} color="white" />
            </div>
            Dagdoel
          </span>
          <span className="text-sm font-bold" style={{ color: "var(--foreground-muted)" }}>
            {dailyGoal.progress}/{dailyGoal.target}
          </span>
        </div>
        <ProgressBar value={dailyGoal.progress} max={dailyGoal.target} color="var(--primary-500)" height={12} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/app/oefenen" className="card p-4">
          <div className="icon-bubble mb-2" style={{ width: 36, height: 36, borderRadius: 11, background: "var(--brand-500)" }}>
            <Dumbbell size={18} color="white" />
          </div>
          <p className="font-bold text-sm">Vrij oefenen</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
            Kies zelf
          </p>
        </Link>
        <Link href="/app/sessie?mode=EXAM" className="card p-4">
          <div className="icon-bubble mb-2" style={{ width: 36, height: 36, borderRadius: 11, background: "var(--purple-500)" }}>
            <GraduationCap size={18} color="white" />
          </div>
          <p className="font-bold text-sm">Oefenexamen</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
            20 vragen
          </p>
        </Link>
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
