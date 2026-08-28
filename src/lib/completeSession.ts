import { prisma } from "@/lib/db";
import {
  XP_PER_CORRECT,
  XP_DIFFICULTY_BONUS,
  XP_SESSION_COMPLETE,
  XP_EXAM_CORRECT,
  XP_EXAM_COMPLETE,
  XP_DAILY_GOAL,
  addXp,
  registerDailyActivity,
  progressDailyGoal,
  awardEligibleBadges,
} from "@/lib/gamification";
import { getTopicMasterySummaries } from "@/lib/mastery";

const EXAM_PASS_THRESHOLD = 0.88; // mirrors the ~44/50 pass mark of the real CBR exam

export async function completeSession(studentId: string, sessionId: string) {
  const session = await prisma.practiceSession.findUnique({
    where: { id: sessionId },
    include: { attempts: { include: { question: { include: { topic: true } } } } },
  });
  if (!session || session.studentId !== studentId) throw new Error("Session not found");
  if (session.completedAt) throw new Error("Session already completed");

  const attempts = session.attempts;
  const totalCount = attempts.length;
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const isExam = session.mode === "EXAM";

  let xp = 0;
  for (const a of attempts) {
    if (!a.isCorrect) continue;
    xp += (isExam ? XP_EXAM_CORRECT : XP_PER_CORRECT) + a.question.difficulty * XP_DIFFICULTY_BONUS;
  }
  if (totalCount > 0) xp += isExam ? XP_EXAM_COMPLETE : XP_SESSION_COMPLETE;

  const wasFirstSession =
    totalCount > 0 &&
    (await prisma.practiceSession.count({ where: { studentId, completedAt: { not: null } } })) === 0;

  const xpResult = await addXp(studentId, xp, isExam ? "exam" : "session");
  const streakResult = totalCount > 0 ? await registerDailyActivity(studentId) : null;
  const dailyGoalResult = totalCount > 0 ? await progressDailyGoal(studentId, totalCount) : null;
  if (dailyGoalResult?.justCompleted) {
    await addXp(studentId, XP_DAILY_GOAL, "daily_goal");
  }

  let examResult = null;
  if (isExam && totalCount > 0) {
    const breakdown: Record<string, { correct: number; total: number; topicName: string }> = {};
    for (const a of attempts) {
      const key = a.question.topicId;
      breakdown[key] ??= { correct: 0, total: 0, topicName: a.question.topic.name };
      breakdown[key].total += 1;
      if (a.isCorrect) breakdown[key].correct += 1;
    }
    const scorePct = (correctCount / totalCount) * 100;
    const passed = scorePct / 100 >= EXAM_PASS_THRESHOLD;
    examResult = await prisma.examResult.create({
      data: {
        studentId,
        sessionId,
        scorePct,
        passed,
        totalCount,
        correctCount,
        breakdown: JSON.stringify(breakdown),
      },
    });
  }

  const totalCorrectAllTime = await prisma.attempt.count({ where: { studentId, isCorrect: true } });
  const isFirstExam =
    isExam && totalCount > 0 && (await prisma.examResult.count({ where: { studentId } })) === 1;

  const newBadges = await awardEligibleBadges(studentId, {
    isFirstSession: wasFirstSession,
    streak: streakResult?.streak ?? 0,
    perfectSession: !isExam && totalCount >= 5 && correctCount === totalCount,
    examPassed: examResult?.passed ?? false,
    isFirstExam,
    totalCorrectAllTime,
  });

  await prisma.practiceSession.update({
    where: { id: sessionId },
    data: { completedAt: new Date(), xpEarned: xp, correctCount, totalCount },
  });

  const touchedTopicIds = [...new Set(attempts.map((a) => a.question.topicId))];
  const allMastery = await getTopicMasterySummaries(studentId);
  const masteryAfter = allMastery.filter((m) => touchedTopicIds.includes(m.topicId));

  return {
    totalCount,
    correctCount,
    xpEarned: xp,
    xp: xpResult,
    streak: streakResult,
    dailyGoal: dailyGoalResult,
    badges: newBadges,
    examResult: examResult
      ? { ...examResult, breakdown: JSON.parse(examResult.breakdown) }
      : null,
    masteryAfter,
  };
}
