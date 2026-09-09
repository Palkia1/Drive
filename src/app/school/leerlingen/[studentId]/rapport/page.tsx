import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireInstructor } from "@/lib/session";
import { getStudentDetailForSchool } from "@/lib/schoolStats";
import { PrintButton } from "@/components/school/PrintButton";

export default async function StudentReportPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const { school } = await requireInstructor();
  const detail = await getStudentDetailForSchool(school.id, studentId);
  if (!detail) notFound();

  const { student, masteries, accuracyPct, totalAttempts, examResults, activity } = detail;
  const today = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href={`/school/leerlingen/${studentId}`} className="text-sm inline-flex items-center gap-1.5" style={{ color: "var(--foreground-muted)" }}>
          <ArrowLeft size={14} /> Terug
        </Link>
        <PrintButton />
      </div>

      {/* Everything below is what actually prints — print:only makes this a
         plain black-on-white document instead of the app's chrome/colors. */}
      <div className="print:text-black">
        <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: "var(--border)" }}>
          <div>
            <p className="font-extrabold text-lg" style={{ color: "var(--brand-600)" }}>
              Rijklaar
            </p>
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
              {school.name}
            </p>
          </div>
          <p className="text-sm text-right" style={{ color: "var(--foreground-muted)" }}>
            Voortgangsrapport
            <br />
            {today}
          </p>
        </div>

        <h1 className="text-2xl font-bold mb-1">{student.username}</h1>
        <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
          {student.user.email} · {activity.label}
        </p>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <ReportStat label="Level" value={student.level} />
          <ReportStat label="XP" value={student.xp} />
          <ReportStat label="Streak" value={`${student.streakCount} dagen`} />
          <ReportStat label="% goed" value={accuracyPct !== null ? `${accuracyPct}%` : "—"} />
        </div>

        <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
          {totalAttempts} vragen beantwoord in totaal.
        </p>

        <h2 className="font-semibold text-sm mb-2 uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
          Mastery per onderwerp
        </h2>
        <table className="w-full text-sm mb-6" style={{ borderCollapse: "collapse" }}>
          <tbody>
            {masteries.map((m) => (
              <tr key={m.topicId} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="py-2">{m.topicName}</td>
                <td className="py-2 text-right" style={{ color: "var(--foreground-muted)" }}>
                  {m.insufficientData ? "Nog onvoldoende gegevens" : `Level ${m.level}/5`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="font-semibold text-sm mb-2 uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
          Oefenexamens ({examResults.length})
        </h2>
        {examResults.length === 0 ? (
          <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
            Nog geen oefenexamens gemaakt.
          </p>
        ) : (
          <table className="w-full text-sm mb-6" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {examResults.map((e) => (
                <tr key={e.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2" style={{ color: "var(--foreground-muted)" }}>
                    {e.createdAt.toLocaleDateString("nl-NL")}
                  </td>
                  <td className="py-2">
                    {e.correctCount}/{e.totalCount} ({Math.round(e.scorePct)}%)
                  </td>
                  <td className="py-2 text-right font-semibold">{e.passed ? "Gehaald" : "Niet gehaald"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="text-xs mt-10" style={{ color: "var(--foreground-muted)" }}>
          Gegenereerd door Rijklaar — dit rapport is een momentopname en geen officieel CBR-document.
        </p>
      </div>
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-xl text-center" style={{ background: "var(--surface-muted)" }}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
        {label}
      </p>
    </div>
  );
}
