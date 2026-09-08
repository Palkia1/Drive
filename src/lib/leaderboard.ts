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
  isExample: boolean;
};

// Three permanent, clearly-labeled example rows (see the "voorbeeld" badge
// in SociaalClient) so the scoreboard never reads as completely dead. They
// are NOT real students — never hide the isExample flag or the badge in the
// UI, that would make this a fake-activity dark pattern instead of an
// honest illustration of how the board fills up.
const EXAMPLE_USERS = [
  { studentId: "example-patricjoost", username: "Patricjoost" },
  { studentId: "example-freekv", username: "FreekV" },
  { studentId: "example-jtimberlake", username: "JTimberlake" },
  { studentId: "example-sandra69", username: "Sandra69" },
];

// Deterministic per day (not random) so the example XP is stable across
// requests/renders on the same day, but still varies day to day instead of
// looking like a static fixture.
function deterministicXp(seed: string, min: number, max: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return min + (hash % (max - min + 1));
}

function exampleRows(): LeaderboardRow[] {
  const dateKey = startOfToday().toISOString().slice(0, 10);
  return EXAMPLE_USERS.map((u) => ({
    studentId: u.studentId,
    username: u.username,
    activeTitle: null,
    xpToday: deterministicXp(`${u.studentId}:${dateKey}`, 30, 180),
    rank: 0,
    isSelf: false,
    isExample: true,
  }));
}

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

  const realRows: LeaderboardRow[] = visibleStudents.map((s) => ({
    studentId: s.id,
    username: s.username,
    activeTitle: s.activeTitle,
    xpToday: totals.get(s.id) ?? 0,
    rank: 0,
    isSelf: s.id === currentStudentId,
    isExample: false,
  }));

  const ranked: LeaderboardRow[] = [...realRows, ...exampleRows()]
    .sort((a, b) => b.xpToday - a.xpToday)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  const top = ranked.slice(0, limit);
  const selfRow = ranked.find((r) => r.isSelf);
  const selfInTop = top.some((r) => r.isSelf);

  return { top, selfRow, selfInTop, totalRanked: realRows.length };
}
