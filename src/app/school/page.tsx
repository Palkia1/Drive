import Link from "next/link";
import { Users, Activity, CircleAlert } from "lucide-react";
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
        <SummaryCard icon={<Users size={16} color="white" />} label="Totaal leerlingen" value={students.length} color="var(--brand-500)" />
        <SummaryCard icon={<Activity size={16} color="white" />} label="Actief deze week" value={highActivity} color="var(--success-600)" />
        <SummaryCard icon={<CircleAlert size={16} color="white" />} label="Extra aandacht nodig" value={needsAttention} color="var(--danger-500)" />
      </div>

      {students.length === 0 ? (
        <div className="card p-10 text-center" style={{ color: "var(--foreground-muted)" }}>
          Nog geen leerlingen gekoppeld.
        </div>
      ) : (
        <div className="card divide-y" style={{ borderColor: "var(--border)" }}>
          <div
            className="hidden md:grid px-5 py-2.5 text-xs font-bold uppercase tracking-wide"
            style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr 0.6fr 0.5fr", color: "var(--foreground-muted)" }}
          >
            <span>Leerling</span>
            <span>Activiteit</span>
            <span>Sterkste onderwerp</span>
            <span>Aandachtspunt</span>
            <span className="text-center">Examens</span>
            <span className="text-right">Level</span>
          </div>
          {students.map((s) => (
            <Link
              key={s.studentId}
              href={`/school/leerlingen/${s.studentId}`}
              className="flex flex-col gap-2 md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr_0.6fr_0.5fr] md:items-center md:gap-y-0 px-5 py-3.5 transition hover:bg-[var(--surface-muted)]"
            >
              <span className="flex items-center gap-2.5 justify-between md:justify-start">
                <span className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-extrabold text-white"
                    style={{ background: "var(--brand-500)" }}
                  >
                    {s.username.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="font-bold truncate">{s.username}</span>
                </span>
                <span className="text-sm font-bold md:hidden shrink-0" style={{ color: "var(--purple-500)" }}>
                  Level {s.level}
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--foreground-muted)" }}>
                <ActivityDot level={s.activity.level} />
                {s.activity.label}
              </span>
              <Field label="Sterkste onderwerp" value={s.strongestTopic} />
              <Field label="Aandachtspunt" value={s.weakestTopic} />
              <Field label="Examens" value={String(s.examCount)} className="md:text-center" />
              <span className="hidden md:block text-sm font-bold text-right" style={{ color: "var(--purple-500)" }}>
                {s.level}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, className = "" }: { label: string; value: string | null; className?: string }) {
  return (
    <span className={`text-sm truncate ${className}`}>
      <span className="md:hidden text-xs font-bold uppercase tracking-wide mr-1.5" style={{ color: "var(--foreground-muted)" }}>
        {label}:
      </span>
      {value ?? "—"}
    </span>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="card p-4">
      <div className="icon-bubble mb-2.5" style={{ width: 32, height: 32, borderRadius: 10, background: color }}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
        {label}
      </p>
    </div>
  );
}
