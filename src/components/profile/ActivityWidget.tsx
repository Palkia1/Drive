import { Flame } from "lucide-react";
import type { DayActivity } from "@/lib/activity";

/** A compact "Strava-style" weekly activity card: streak, XP earned per day
 * as a small bar chart, and which days had any practice. */
export function ActivityWidget({ days, streakCount }: { days: DayActivity[]; streakCount: number }) {
  const weekXp = days.reduce((sum, d) => sum + d.xp, 0);
  const maxXp = Math.max(1, ...days.map((d) => d.xp));
  const todayKey = days[days.length - 1]?.date;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="icon-bubble" style={{ width: 30, height: 30, borderRadius: 9, background: "var(--gold-600)" }}>
            <Flame size={15} color="white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">{streakCount} {streakCount === 1 ? "dag" : "dagen"} op rij</p>
            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
              Deze week {weekXp} XP
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-1.5" style={{ height: 72 }}>
        {days.map((d) => {
          const isToday = d.date === todayKey;
          const barHeight = d.xp > 0 ? Math.max(10, Math.round((d.xp / maxXp) * 56)) : 4;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
              <div
                className="w-full rounded-full"
                style={{
                  height: barHeight,
                  background: d.xp > 0 ? "var(--primary-500)" : "var(--surface-muted)",
                  boxShadow: isToday && d.xp > 0 ? "inset 0 0 0 2px var(--primary-600)" : undefined,
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
