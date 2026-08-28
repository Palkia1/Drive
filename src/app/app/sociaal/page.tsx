import { requireStudent } from "@/lib/session";
import { getFriends, getPendingRequests } from "@/lib/friendsData";
import { getDailyLeaderboard } from "@/lib/leaderboard";
import { SociaalClient } from "@/components/social/SociaalClient";

export default async function SociaalPage() {
  const { student } = await requireStudent();
  const [friends, pending, leaderboard] = await Promise.all([
    getFriends(student.id),
    getPendingRequests(student.id),
    getDailyLeaderboard(student.id),
  ]);

  return (
    <SociaalClient
      friendCode={student.friendCode}
      friends={friends}
      pending={pending.map((p) => ({ id: p.id, username: p.requester.username }))}
      leaderboard={leaderboard}
    />
  );
}
