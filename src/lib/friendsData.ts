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

export async function getFriends(studentId: string): Promise<FriendView[]> {
  const friendships = await prisma.friendship.findMany({
    where: { status: "ACCEPTED", OR: [{ requesterId: studentId }, { addresseeId: studentId }] },
    include: {
      requester: { include: { badges: true } },
      addressee: { include: { badges: true } },
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
      badgeCount: friend.shareBadgesWithFriends ? friend.badges.length : null,
    };
  });
}

export async function getPendingRequests(studentId: string) {
  return prisma.friendship.findMany({
    where: { addresseeId: studentId, status: "PENDING" },
    include: { requester: true },
    orderBy: { createdAt: "desc" },
  });
}
