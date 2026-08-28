import { requireStudent } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getTopicMasterySummaries } from "@/lib/mastery";
import { MasteryBar } from "@/components/ui/MasteryBar";
import { PrivacyToggles } from "@/components/profile/PrivacyToggles";
import { SignOutButton } from "@/components/profile/SignOutButton";
import { BadgeIcon } from "@/components/profile/BadgeIcon";

export default async function ProfielPage() {
  const { student, user } = await requireStudent();
  const [badges, topics] = await Promise.all([
    prisma.userBadge.findMany({ where: { studentId: student.id }, include: { badge: true }, orderBy: { earnedAt: "desc" } }),
    getTopicMasterySummaries(student.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg, var(--brand-500), var(--brand-700))" }}
        >
          {student.username.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold">{student.username}</h1>
          {student.activeTitle && (
            <p className="text-sm" style={{ color: "var(--accent-600)" }}>
              {student.activeTitle}
            </p>
          )}
          {student.drivingSchool && (
            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
              {student.drivingSchool.name}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <StatBlock label="Level" value={student.level} />
        <StatBlock label="XP" value={student.xp} />
        <StatBlock label="Streak" value={`${student.streakCount}🔥`} />
      </div>

      <div>
        <h2 className="font-semibold mb-2">Badges ({badges.length})</h2>
        {badges.length === 0 ? (
          <div className="card p-4 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
            Nog geen badges — voltooi je eerste sessie!
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {badges.map((ub) => (
              <div key={ub.id} className="card p-3 flex flex-col items-center gap-1.5 text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "var(--accent-500)", color: "white" }}
                >
                  <BadgeIcon icon={ub.badge.icon} />
                </div>
                <p className="text-[11px] font-semibold leading-tight">{ub.badge.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-3">Mastery per onderwerp</h2>
        <div className="card p-4 space-y-4">
          {topics.map((t) => (
            <MasteryBar key={t.topicId} name={t.topicName} level={t.level} insufficientData={t.insufficientData} compact />
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Privacy</h2>
        <div className="card p-4">
          <PrivacyToggles
            initial={{
              showOnLeaderboard: student.showOnLeaderboard,
              shareXpWithFriends: student.shareXpWithFriends,
              shareStreakWithFriends: student.shareStreakWithFriends,
              shareBadgesWithFriends: student.shareBadgesWithFriends,
              shareMasteryWithFriends: student.shareMasteryWithFriends,
            }}
          />
        </div>
      </div>

      <div className="card p-4 text-sm" style={{ color: "var(--foreground-muted)" }}>
        {user.email}
      </div>

      <SignOutButton />
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-3">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
        {label}
      </p>
    </div>
  );
}
