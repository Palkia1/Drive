import { prisma } from "@/lib/db";
import { getFriends } from "@/lib/friendsData";

export type ChallengeMetric = "xp" | "topic_accuracy";

export type ChallengeStanding = {
  studentId: string;
  username: string;
  value: number; // XP earned in the challenge window, or accuracy % (0-100)
  attempts: number; // only meaningful for topic_accuracy
  isSelf: boolean;
};

export type ChallengeView = {
  id: string;
  label: string;
  metric: ChallengeMetric;
  topicId: string | null;
  topicName: string | null;
  creatorId: string;
  creatorUsername: string;
  startsAt: Date;
  endsAt: Date;
  isEnded: boolean;
  isJoined: boolean;
  canJoin: boolean;
  standings: ChallengeStanding[];
};

type RawChallenge = {
  id: string;
  label: string;
  metric: string;
  topicId: string | null;
  creatorId: string;
  startsAt: Date;
  endsAt: Date;
  creator: { id: string; username: string };
  topic: { id: string; name: string } | null;
  participants: { studentId: string; joinedAt: Date; student: { username: string } }[];
};

const CHALLENGE_INCLUDE = {
  creator: { select: { id: true, username: true } },
  topic: { select: { id: true, name: true } },
  participants: { select: { studentId: true, joinedAt: true, student: { select: { username: true } } } },
} as const;

// Standings are always computed live from XpEvent/Attempt history rather
// than a stored delta — that's what lets a challenge's standings stay
// correct even after it ends (nothing keeps accumulating past `endsAt`,
// and re-computing costs nothing since these tables are already indexed
// by (studentId, createdAt) / used elsewhere by date range).
async function attachStandings(challenges: RawChallenge[], viewerId: string): Promise<ChallengeView[]> {
  const now = new Date();

  const xpChallenges = challenges.filter((c) => c.metric === "xp" && c.participants.length > 0);
  const accuracyChallenges = challenges.filter((c) => c.metric === "topic_accuracy" && c.topicId && c.participants.length > 0);

  const allParticipantIds = [...new Set(challenges.flatMap((c) => c.participants.map((p) => p.studentId)))];
  const earliestJoin = challenges
    .flatMap((c) => c.participants.map((p) => p.joinedAt.getTime()))
    .reduce((min, t) => Math.min(min, t), Date.now());

  const [xpEvents, attempts] = await Promise.all([
    xpChallenges.length && allParticipantIds.length
      ? prisma.xpEvent.findMany({
          where: { studentId: { in: allParticipantIds }, createdAt: { gte: new Date(earliestJoin) } },
          select: { studentId: true, amount: true, createdAt: true },
        })
      : Promise.resolve([]),
    accuracyChallenges.length && allParticipantIds.length
      ? prisma.attempt.findMany({
          where: {
            studentId: { in: allParticipantIds },
            answeredAt: { gte: new Date(earliestJoin) },
            question: { topicId: { in: accuracyChallenges.map((c) => c.topicId!) } },
          },
          select: { studentId: true, isCorrect: true, answeredAt: true, question: { select: { topicId: true } } },
        })
      : Promise.resolve([]),
  ]);

  return challenges.map((c): ChallengeView => {
    const windowEnd = now < c.endsAt ? now : c.endsAt;
    const standings: ChallengeStanding[] = c.participants.map((p) => {
      let value = 0;
      let attemptCount = 0;
      if (c.metric === "xp") {
        value = xpEvents
          .filter((e) => e.studentId === p.studentId && e.createdAt >= p.joinedAt && e.createdAt <= windowEnd)
          .reduce((sum, e) => sum + e.amount, 0);
      } else if (c.metric === "topic_accuracy" && c.topicId) {
        const relevant = attempts.filter(
          (a) =>
            a.studentId === p.studentId &&
            a.question.topicId === c.topicId &&
            a.answeredAt >= p.joinedAt &&
            a.answeredAt <= windowEnd
        );
        attemptCount = relevant.length;
        const correct = relevant.filter((a) => a.isCorrect).length;
        value = attemptCount > 0 ? Math.round((correct / attemptCount) * 100) : 0;
      }
      return {
        studentId: p.studentId,
        username: p.student.username,
        value,
        attempts: attemptCount,
        isSelf: p.studentId === viewerId,
      };
    });
    standings.sort((a, b) => b.value - a.value);

    return {
      id: c.id,
      label: c.label,
      metric: c.metric as ChallengeMetric,
      topicId: c.topicId,
      topicName: c.topic?.name ?? null,
      creatorId: c.creatorId,
      creatorUsername: c.creator.username,
      startsAt: c.startsAt,
      endsAt: c.endsAt,
      isEnded: now >= c.endsAt,
      isJoined: c.participants.some((p) => p.studentId === viewerId),
      canJoin: now < c.endsAt && !c.participants.some((p) => p.studentId === viewerId),
      standings,
    };
  });
}

/** Challenges visible to a student: their own (created or joined), plus
 * still-open ones a friend created — friends only, so this never leaks a
 * challenge (or who's in it) to someone outside that friendship. */
export async function getChallengesForStudent(studentId: string): Promise<ChallengeView[]> {
  const friends = await getFriends(studentId);
  const friendIds = friends.map((f) => f.studentId);

  const raw = await prisma.challenge.findMany({
    where: {
      OR: [
        { creatorId: studentId },
        { participants: { some: { studentId } } },
        { creatorId: { in: friendIds }, endsAt: { gt: new Date() } },
      ],
    },
    orderBy: { endsAt: "desc" },
    take: 30,
    include: CHALLENGE_INCLUDE,
  });

  return attachStandings(raw, studentId);
}

export async function createChallenge(
  studentId: string,
  input: { metric: ChallengeMetric; topicId: string | null; label: string; durationHours: number }
): Promise<string> {
  const student = await prisma.studentProfile.findUniqueOrThrow({ where: { id: studentId }, select: { xp: true } });
  const endsAt = new Date(Date.now() + input.durationHours * 60 * 60 * 1000);

  const challenge = await prisma.challenge.create({
    data: {
      creatorId: studentId,
      metric: input.metric,
      topicId: input.topicId,
      label: input.label,
      endsAt,
      participants: { create: { studentId, startXp: student.xp } },
    },
    select: { id: true },
  });
  return challenge.id;
}

export async function joinChallenge(studentId: string, challengeId: string): Promise<{ ok: true } | { error: string }> {
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge) return { error: "Uitdaging niet gevonden" };
  if (challenge.endsAt <= new Date()) return { error: "Deze uitdaging is al afgelopen" };
  if (challenge.creatorId === studentId) return { ok: true }; // already a participant from creation

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: studentId, addresseeId: challenge.creatorId },
        { requesterId: challenge.creatorId, addresseeId: studentId },
      ],
    },
    select: { id: true },
  });
  if (!friendship) return { error: "Je kunt alleen uitdagingen van vrienden joinen" };

  const student = await prisma.studentProfile.findUniqueOrThrow({ where: { id: studentId }, select: { xp: true } });
  await prisma.challengeParticipant.upsert({
    where: { challengeId_studentId: { challengeId, studentId } },
    update: {},
    create: { challengeId, studentId, startXp: student.xp },
  });
  return { ok: true };
}
