import { Flame } from "lucide-react";
import type { DayActivity } from "@/lib/activity";

/** A Strava-style weekly activity card: streak header, a couple of summary
 * stats, and a day-by-day grid combining an XP bar with a practiced/not
 * badge — the closest fit for our data to Strava's "This week" panel +
 * weekly activity grid. */
export function ActivityWidget({ days, streakCount }: { days: DayActivity[]; streakCount: number }) {
  const weekXp = days.reduce((sum, d) => sum + d.xp, 0);
  const activeDays = days.filter((d) => d.practiced).length;
  const maxXp = Math.max(1, ...days.map((d) => d.xp));
  const todayKey = days[days.length - 1]?.date;

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="icon-bubble" style={{ width: 30, height: 30, borderRadius: 9, background: "var(--gold-600)" }}>
          <Flame size={15} color="white" />
        </div>
        <p className="text-sm font-bold">
          {streakCount} {streakCount === 1 ? "dag" : "dagen"} op rij
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl p-3" style={{ background: "var(--surface-muted)" }}>
          <p className="text-xl font-extrabold leading-none">{weekXp}</p>
          <p className="text-xs font-semibold mt-1" style={{ color: "var(--foreground-muted)" }}>
            XP deze week
          </p>
        </div>
        <div className="rounded-2xl p-3" style={{ background: "var(--surface-muted)" }}>
          <p className="text-xl font-extrabold leading-none">{activeDays}/7</p>
          <p className="text-xs font-semibold mt-1" style={{ color: "var(--foreground-muted)" }}>
            Actieve dagen
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-1.5" style={{ height: 88 }}>
        {days.map((d) => {
          const isToday = d.date === todayKey;
          const barHeight = d.xp > 0 ? Math.max(8, Math.round((d.xp / maxXp) * 40)) : 3;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: d.practiced ? "var(--gold-500)" : "var(--surface-muted)",
                  boxShadow: isToday ? "0 0 0 2px var(--gold-600)" : undefined,
                }}
              >
                {d.practiced && <Flame size={12} color="white" />}
              </div>
              <div
                className="w-full rounded-full"
                style={{
                  height: barHeight,
                  background: d.xp > 0 ? "var(--primary-500)" : "var(--surface-muted)",
                }}
                title={`${d.date}: ${d.xp} XP`}
              />
              <span
                className="text-[11px] font-bold"
                style={{ color: isToday ? "var(--primary-600)" : "var(--foreground-muted)" }}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
