import { prisma } from "@/lib/db";

/** Same UTC-day-key convention as registerDailyActivity in gamification.ts —
 * keeping one simple definition of "day" across streaks and this chart
 * rather than doing real per-student-timezone bucketing. */
function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export type DayActivity = {
  date: string; // YYYY-MM-DD
  label: string; // single-letter weekday, e.g. "M"
  xp: number;
  practiced: boolean;
};

const WEEKDAY_LETTERS = ["Z", "M", "D", "W", "D", "V", "Z"]; // getDay(): 0=zo..6=za

/** Last `days` calendar days (oldest first, today last) with XP earned per day. */
export async function getRecentActivity(studentId: string, days = 7): Promise<DayActivity[]> {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const events = await prisma.xpEvent.findMany({
    where: { studentId, createdAt: { gte: start } },
    select: { amount: true, createdAt: true },
  });

  const xpByDay = new Map<string, number>();
  for (const e of events) {
    const key = dateKey(e.createdAt);
    xpByDay.set(key, (xpByDay.get(key) ?? 0) + e.amount);
  }

  const result: DayActivity[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    result.push({
      date: key,
      label: WEEKDAY_LETTERS[d.getDay()],
      xp: xpByDay.get(key) ?? 0,
      practiced: (xpByDay.get(key) ?? 0) > 0,
    });
  }
  return result;
}
