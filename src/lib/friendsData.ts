import { prisma } from "@/lib/db";

export type FriendView = {
  friendshipId: string;
  studentId: string;
  username: string;
  activeTitle: string | null;
  xp: number | null; // null when the friend has hidden this
  level: number;
  streak: number | null;
  badgeCount: number | null;
};

const FRIEND_SELECT = {
  id: true,
  username: true,
  activeTitle: true,
  xp: true,
  level: true,
  streakCount: true,
  shareXpWithFriends: true,
  shareStreakWithFriends: true,
  shareBadgesWithFriends: true,
  _count: { select: { badges: true } },
} as const;

export async function getFriends(studentId: string): Promise<FriendView[]> {
  const friendships = await prisma.friendship.findMany({
    where: { status: "ACCEPTED", OR: [{ requesterId: studentId }, { addresseeId: studentId }] },
    select: {
      id: true,
      requesterId: true,
      requester: { select: FRIEND_SELECT },
      addressee: { select: FRIEND_SELECT },
    },
  });

  return friendships.map((f) => {
    const friend = f.requesterId === studentId ? f.addressee : f.requester;
    return {
      friendshipId: f.id,
      studentId: friend.id,
      username: friend.username,
      activeTitle: friend.activeTitle,
      xp: friend.shareXpWithFriends ? friend.xp : null,
      level: friend.level,
      streak: friend.shareStreakWithFriends ? friend.streakCount : null,
      badgeCount: friend.shareBadgesWithFriends ? friend._count.badges : null,
    };
  });
}

export async function getPendingRequests(studentId: string) {
  return prisma.friendship.findMany({
    where: { addresseeId: studentId, status: "PENDING" },
    select: { id: true, createdAt: true, requester: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });
}
