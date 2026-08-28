import { prisma } from "@/lib/db";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export type LeaderboardRow = {
  studentId: string;
  username: string;
  activeTitle: string | null;
  xpToday: number;
  rank: number;
  isSelf: boolean;
};

/** National daily leaderboard (brief §6) — resets every day because it's
 * simply "XP earned since midnight", not a stored/reset table. */
export async function getDailyLeaderboard(currentStudentId: string, limit = 50) {
  const grouped = await prisma.xpEvent.groupBy({
    by: ["studentId"],
    where: { createdAt: { gte: startOfToday() } },
    _sum: { amount: true },
  });

  const totals = new Map(grouped.map((g) => [g.studentId, g._sum.amount ?? 0]));
  const studentIds = new Set([...totals.keys(), currentStudentId]);
  const visibleStudents = await prisma.studentProfile.findMany({
    where: { id: { in: [...studentIds] }, showOnLeaderboard: true },
    select: { id: true, username: true, activeTitle: true },
  });

  const ranked: LeaderboardRow[] = visibleStudents
    .map((s) => ({
      studentId: s.id,
      username: s.username,
      activeTitle: s.activeTitle,
      xpToday: totals.get(s.id) ?? 0,
      rank: 0,
      isSelf: s.id === currentStudentId,
    }))
    .sort((a, b) => b.xpToday - a.xpToday)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  const top = ranked.slice(0, limit);
  const selfRow = ranked.find((r) => r.isSelf);
  const selfInTop = top.some((r) => r.isSelf);

  return { top, selfRow, selfInTop, totalRanked: ranked.length };
}
