import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// XP & account level
// ---------------------------------------------------------------------------

export const XP_PER_CORRECT = 10;
export const XP_DIFFICULTY_BONUS = 2; // per difficulty point (1..5)
export const XP_SESSION_COMPLETE = 20;
export const XP_DAILY_GOAL = 30;
export const XP_EXAM_CORRECT = 15;
export const XP_EXAM_COMPLETE = 50;

/** XP required to go from `level` to `level + 1`. Arithmetic progression — each level takes a bit more than the last. */
function xpForLevel(level: number) {
  return 100 + (level - 1) * 25;
}

export function levelForTotalXp(totalXp: number) {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: xpForLevel(level) };
}

export async function addXp(studentId: string, amount: number, reason: string) {
  if (amount <= 0) {
    const student = await prisma.studentProfile.findUniqueOrThrow({ where: { id: studentId } });
    return { oldLevel: student.level, newLevel: student.level, leveledUp: false, xp: student.xp };
  }

  const student = await prisma.studentProfile.findUniqueOrThrow({ where: { id: studentId } });
  const newXp = student.xp + amount;
  const { level: newLevel } = levelForTotalXp(newXp);

  await prisma.$transaction([
    prisma.xpEvent.create({ data: { studentId, amount, reason } }),
    prisma.studentProfile.update({ where: { id: studentId }, data: { xp: newXp, level: newLevel } }),
  ]);

  return { oldLevel: student.level, newLevel, leveledUp: newLevel > student.level, xp: newXp };
}

// ---------------------------------------------------------------------------
// Streak — daily activity only, never punished for mistakes (brief §28, §43)
// ---------------------------------------------------------------------------

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function registerDailyActivity(studentId: string) {
  const student = await prisma.studentProfile.findUniqueOrThrow({ where: { id: studentId } });
  const today = new Date();
  const todayKey = dateKey(today);
  const lastKey = student.lastActivityAt ? dateKey(student.lastActivityAt) : null;

  if (lastKey === todayKey) {
    return { streak: student.streakCount, streakContinued: false, alreadyCountedToday: true };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isConsecutive = lastKey === dateKey(yesterday);

  const nextStreak = isConsecutive ? student.streakCount + 1 : 1;

  await prisma.studentProfile.update({
    where: { id: studentId },
    data: {
      streakCount: nextStreak,
      longestStreak: Math.max(student.longestStreak, nextStreak),
      lastActivityAt: today,
    },
  });

  return { streak: nextStreak, streakContinued: isConsecutive, alreadyCountedToday: false };
}

// ---------------------------------------------------------------------------
// Daily goal
// ---------------------------------------------------------------------------

const DAILY_GOAL_TARGET = 15;

export async function getOrCreateDailyGoal(studentId: string) {
  const today = dateKey(new Date());
  return prisma.dailyGoal.upsert({
    where: { studentId_date: { studentId, date: today } },
    update: {},
    create: { studentId, date: today, goalType: "answer_questions", target: DAILY_GOAL_TARGET },
  });
}

export async function progressDailyGoal(studentId: string, answeredCount: number) {
  const goal = await getOrCreateDailyGoal(studentId);
  if (goal.completedAt) return { goal, justCompleted: false };

  const progress = Math.min(goal.target, goal.progress + answeredCount);
  const justCompleted = progress >= goal.target;

  const updated = await prisma.dailyGoal.update({
    where: { id: goal.id },
    data: { progress, completedAt: justCompleted ? new Date() : null },
  });

  return { goal: updated, justCompleted };
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export type BadgeContext = {
  isFirstSession: boolean;
  streak: number;
  perfectSession: boolean; // all answers correct, session had >= 5 questions
  examPassed: boolean;
  isFirstExam: boolean;
  totalCorrectAllTime: number;
};

export async function awardEligibleBadges(studentId: string, ctx: BadgeContext) {
  const codes: string[] = [];
  if (ctx.isFirstSession) codes.push("first_session");
  if (ctx.streak >= 7) codes.push("streak_7");
  if (ctx.streak >= 30) codes.push("streak_30");
  if (ctx.streak >= 100) codes.push("streak_100");
  if (ctx.perfectSession) codes.push("perfect_session");
  if (ctx.isFirstExam) codes.push("first_exam");
  if (ctx.examPassed) codes.push("exam_passed");
  if (ctx.totalCorrectAllTime >= 100) codes.push("hundred_correct");

  if (codes.length === 0) return [];

  const badges = await prisma.badge.findMany({ where: { code: { in: codes } } });
  const existing = await prisma.userBadge.findMany({
    where: { studentId, badgeId: { in: badges.map((b) => b.id) } },
  });
  const existingIds = new Set(existing.map((e) => e.badgeId));
  const newBadges = badges.filter((b) => !existingIds.has(b.id));

  if (newBadges.length > 0) {
    await prisma.userBadge.createMany({
      data: newBadges.map((b) => ({ studentId, badgeId: b.id })),
    });
  }
  return newBadges;
}
