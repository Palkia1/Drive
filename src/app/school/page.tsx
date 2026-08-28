import Link from "next/link";
import { requireInstructor } from "@/lib/session";
import { getSchoolStudentsOverview } from "@/lib/schoolStats";
import { ActivityDot } from "@/components/school/ActivityDot";

export default async function SchoolDashboardPage() {
  const { school } = await requireInstructor();
  const students = await getSchoolStudentsOverview(school.id);

  const highActivity = students.filter((s) => s.activity.level === "high").length;
  const needsAttention = students.filter((s) => s.activity.level === "low" || s.activity.level === "none").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leerlingen</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          Geef leerlingen de rijschoolcode <strong>{school.code}</strong> om zich te koppelen.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Totaal leerlingen" value={students.length} />
        <SummaryCard label="Actief deze week" value={highActivity} color="var(--success-600)" />
        <SummaryCard label="Extra aandacht nodig" value={needsAttention} color="var(--danger-500)" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: "var(--foreground-muted)" }}>
              <th className="px-4 py-3 font-medium">Leerling</th>
              <th className="px-4 py-3 font-medium">Activiteit</th>
              <th className="px-4 py-3 font-medium">Sterkste onderwerp</th>
              <th className="px-4 py-3 font-medium">Zwakste onderwerp</th>
              <th className="px-4 py-3 font-medium text-center">Examens</th>
              <th className="px-4 py-3 font-medium text-right">Level</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.studentId} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3">
                  <Link href={`/school/leerlingen/${s.studentId}`} className="font-semibold" style={{ color: "var(--brand-600)" }}>
                    {s.username}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5">
                    <ActivityDot level={s.activity.level} />
                    {s.activity.label}
                  </span>
                </td>
                <td className="px-4 py-3">{s.strongestTopic ?? "—"}</td>
                <td className="px-4 py-3">{s.weakestTopic ?? "—"}</td>
                <td className="px-4 py-3 text-center">{s.examCount}</td>
                <td className="px-4 py-3 text-right font-semibold">{s.level}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center" style={{ color: "var(--foreground-muted)" }}>
                  Nog geen leerlingen gekoppeld.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-bold" style={{ color: color ?? "var(--foreground)" }}>
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
        {label}
      </p>
    </div>
  );
}
