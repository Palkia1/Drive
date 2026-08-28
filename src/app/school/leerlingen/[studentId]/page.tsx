import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireInstructor } from "@/lib/session";
import { getStudentDetailForSchool } from "@/lib/schoolStats";
import { MasteryBar } from "@/components/ui/MasteryBar";
import { ActivityDot } from "@/components/school/ActivityDot";

export default async function StudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const { school } = await requireInstructor();
  const detail = await getStudentDetailForSchool(school.id, studentId);
  if (!detail) notFound();

  const { student, masteries, accuracyPct, totalAttempts, examResults, recentSessions, openMistakes, activity } = detail;

  const sortedByConfidence = [...masteries].filter((m) => !m.insufficientData).sort((a, b) => b.confidence - a.confidence);
  const strong = sortedByConfidence.slice(0, 2);
  const weak = sortedByConfidence.slice(-2).reverse();

  return (
    <div className="space-y-6">
      <Link href="/school" className="text-sm inline-flex items-center gap-1.5" style={{ color: "var(--foreground-muted)" }}>
        <ArrowLeft size={14} /> Terug naar overzicht
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{student.username}</h1>
          <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: "var(--foreground-muted)" }}>
            <ActivityDot level={activity.level} /> {activity.label} · {student.user.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Stat label="Level" value={student.level} />
          <Stat label="XP" value={student.xp} />
          <Stat label="Streak" value={`${student.streakCount}🔥`} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Stat card label="Vragen beantwoord" value={totalAttempts} />
        <Stat card label="% goed (totaal)" value={accuracyPct !== null ? `${accuracyPct}%` : "—"} />
        <Stat card label="Openstaande fouten" value={openMistakes} />
      </div>

      {sortedByConfidence.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-4">
            <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--success-600)" }}>
              Sterke onderwerpen
            </h2>
            <div className="space-y-3">
              {strong.map((t) => (
                <MasteryBar key={t.topicId} name={t.topicName} level={t.level} insufficientData={false} compact />
              ))}
            </div>
          </div>
          <div className="card p-4">
            <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--danger-500)" }}>
              Aandachtspunten
            </h2>
            <div className="space-y-3">
              {weak.map((t) => (
                <MasteryBar key={t.topicId} name={t.topicName} level={t.level} insufficientData={false} compact />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card p-4">
        <h2 className="font-semibold text-sm mb-3">Mastery per onderwerp</h2>
        <div className="space-y-3">
          {masteries.map((m) => (
            <MasteryBar key={m.topicId} name={m.topicName} level={m.level} insufficientData={m.insufficientData} compact />
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold text-sm mb-3">Oefenexamens ({examResults.length})</h2>
        {examResults.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
            Nog geen oefenexamens gemaakt.
          </p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {examResults.map((e) => (
                <tr key={e.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2" style={{ color: "var(--foreground-muted)" }}>
                    {e.createdAt.toLocaleDateString("nl-NL")}
                  </td>
                  <td className="py-2">
                    {e.correctCount}/{e.totalCount} ({Math.round(e.scorePct)}%)
                  </td>
                  <td className="py-2 text-right font-semibold" style={{ color: e.passed ? "var(--success-600)" : "var(--danger-500)" }}>
                    {e.passed ? "Gehaald" : "Niet gehaald"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card p-4">
        <h2 className="font-semibold text-sm mb-3">Recente activiteit</h2>
        {recentSessions.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
            Nog geen sessies voltooid.
          </p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {recentSessions.map((s) => (
                <tr key={s.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2" style={{ color: "var(--foreground-muted)" }}>
                    {s.completedAt?.toLocaleDateString("nl-NL")}
                  </td>
                  <td className="py-2">{modeLabel(s.mode)}</td>
                  <td className="py-2 text-right">
                    {s.correctCount}/{s.totalCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function modeLabel(mode: string) {
  const labels: Record<string, string> = {
    QUICK: "Snel oefenen",
    TOPIC: "Onderwerp",
    MISTAKES: "Fouten",
    WEAK_SPOTS: "Zwakke punten",
    LESSON: "Les",
    EXAM: "Oefenexamen",
  };
  return labels[mode] ?? mode;
}

function Stat({ label, value, card }: { label: string; value: string | number; card?: boolean }) {
  return (
    <div className={card ? "card p-4" : "text-center px-3"}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
        {label}
      </p>
    </div>
  );
}
