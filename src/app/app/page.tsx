import Link from "next/link";
import { requireStudent } from "@/lib/session";
import { getRecommendation } from "@/lib/recommendation";
import { getExamReadiness } from "@/lib/readiness";
import { getOrCreateDailyGoal } from "@/lib/gamification";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ArrowRight, Target, Flame } from "lucide-react";

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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">
          {greeting()}, {firstName}!
        </h1>
        {student.streakCount > 0 ? (
          <p className="mt-1 text-sm flex items-center gap-1.5" style={{ color: "var(--foreground-muted)" }}>
            <Flame size={16} style={{ color: "var(--accent-500)" }} />
            Je bent {student.streakCount} {student.streakCount === 1 ? "dag" : "dagen"} op rij bezig.
          </p>
        ) : (
          <p className="mt-1 text-sm" style={{ color: "var(--foreground-muted)" }}>
            Start vandaag je streak met een korte sessie.
          </p>
        )}
      </div>

      <Link href={recHref} className="card p-5 block relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--brand-500), var(--brand-700))" }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Aanbevolen voor jou</p>
        <p className="mt-1 text-xl font-bold text-white">{recommendationTitle(recommendation)}</p>
        <p className="mt-1 text-sm text-white/80">{recommendationSubtitle(recommendation)}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white">
          Start sessie <ArrowRight size={16} />
        </span>
      </Link>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-sm flex items-center gap-1.5">
            <Target size={16} style={{ color: "var(--brand-600)" }} />
            Dagdoel
          </span>
          <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>
            {dailyGoal.progress}/{dailyGoal.target} vragen
          </span>
        </div>
        <ProgressBar value={dailyGoal.progress} max={dailyGoal.target} color="var(--success-500)" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/app/oefenen" className="card p-4 text-center">
          <p className="font-semibold text-sm">Vrij oefenen</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
            Kies zelf een onderwerp
          </p>
        </Link>
        <Link href="/app/sessie?mode=EXAM" className="card p-4 text-center">
          <p className="font-semibold text-sm">Oefenexamen</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
            20 vragen, echte tijdsdruk
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
        };
      case "ready":
        return { title: "Je bent er klaar voor 🎉", text: "Je scoort consistent goed en beheerst de onderwerpen.", color: "var(--success-600)" };
      case "almost":
        return {
          title: "Je bent er bijna",
          text: readiness.weakTopics.length
            ? `Besteed nog aandacht aan: ${readiness.weakTopics.join(", ")}.`
            : "Nog een paar sterke oefenexamens en je zit goed.",
          color: "var(--accent-600)",
        };
      case "not_ready":
        return {
          title: "Nog niet klaar voor het examen",
          text: readiness.weakTopics.length
            ? `Blijf oefenen op: ${readiness.weakTopics.join(", ")}.`
            : "Blijf regelmatig oefenexamens maken.",
          color: "var(--danger-500)",
        };
    }
  })();

  return (
    <div className="card p-4">
      <p className="font-semibold text-sm" style={{ color: copy.color }}>
        {copy.title}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
        {copy.text}
      </p>
    </div>
  );
}
