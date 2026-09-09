import { requireStudent } from "@/lib/session";
import { getFriends, getPendingRequests } from "@/lib/friendsData";
import { getDailyLeaderboard } from "@/lib/leaderboard";
import { getChallengesForStudent } from "@/lib/challenges";
import { getAllTopics } from "@/lib/mastery";
import { SociaalClient } from "@/components/social/SociaalClient";

export default async function SociaalPage() {
  const { student } = await requireStudent();
  const [friends, pending, leaderboard, challenges, topics] = await Promise.all([
    getFriends(student.id),
    getPendingRequests(student.id),
    getDailyLeaderboard(student.id),
    getChallengesForStudent(student.id),
    getAllTopics(),
  ]);

  return (
    <SociaalClient
      friendCode={student.friendCode}
      friends={friends}
      pending={pending.map((p) => ({ id: p.id, username: p.requester.username }))}
      leaderboard={leaderboard}
      challenges={challenges}
      topics={topics.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
