import Link from "next/link";
import { requireStudent } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getTopicMasterySummaries } from "@/lib/mastery";
import { getRecentActivity } from "@/lib/activity";
import { MasteryBar } from "@/components/ui/MasteryBar";
import { ActivityWidget } from "@/components/profile/ActivityWidget";
import { PrivacyToggles } from "@/components/profile/PrivacyToggles";
import { SignOutButton } from "@/components/profile/SignOutButton";
import { BadgeIcon } from "@/components/profile/BadgeIcon";
import { ThemeToggleButton } from "@/components/ui/skiper-ui/skiper26";
import { Trophy, Star, Flame, Moon, SlidersHorizontal } from "lucide-react";

export default async function ProfielPage() {
  const { student, user } = await requireStudent();
  const [badges, topics, activity] = await Promise.all([
    prisma.userBadge.findMany({ where: { studentId: student.id }, include: { badge: true }, orderBy: { earnedAt: "desc" } }),
    getTopicMasterySummaries(student.id),
    getRecentActivity(student.id, 7),
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
        <StatBlock icon={<Trophy size={16} color="white" />} color="var(--purple-500)" label="Level" value={student.level} />
        <StatBlock icon={<Star size={16} color="white" fill="white" />} color="var(--brand-500)" label="XP" value={student.xp} />
        <StatBlock icon={<Flame size={16} color="white" />} color="var(--gold-600)" label="Streak" value={student.streakCount} />
      </div>

      <ActivityWidget days={activity} streakCount={student.streakCount} />

      <div>
        <h2 className="font-extrabold mb-2">Badges ({badges.length})</h2>
        {badges.length === 0 ? (
          <div className="card p-4 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
            Nog geen badges — voltooi je eerste sessie!
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {badges.map((ub) => (
              <div key={ub.id} className="card p-4 flex flex-col items-center gap-2 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: "linear-gradient(135deg, var(--gold-400), var(--gold-600))",
                    boxShadow: "0 4px 0 color-mix(in srgb, var(--gold-600) 70%, black), inset 0 0 0 3px rgba(255,255,255,0.35)",
                  }}
                >
                  <BadgeIcon icon={ub.badge.icon} size={26} />
                </div>
                <p className="text-xs font-bold leading-tight">{ub.badge.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-extrabold mb-3">Mastery per onderwerp</h2>
        <div className="card p-4 space-y-4">
          {topics.map((t) => (
            <MasteryBar
              key={t.topicId}
              name={t.topicName}
              level={t.level}
              insufficientData={t.insufficientData}
              icon={t.topicIcon}
              compact
              quietEmptyState
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal size={16} style={{ color: "var(--foreground-muted)" }} />
          <h2 className="font-extrabold">Instellingen</h2>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-1.5 px-1" style={{ color: "var(--foreground-muted)" }}>
              Weergave
            </p>
            <div className="card p-4 flex items-center justify-between">
              <span className="flex items-center gap-2.5 text-sm font-semibold">
                <div className="icon-bubble" style={{ width: 30, height: 30, borderRadius: 9, background: "var(--brand-600)" }}>
                  <Moon size={15} color="white" />
                </div>
                Donkere modus
              </span>
              <ThemeToggleButton variant="circle" start="center" />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-1.5 px-1" style={{ color: "var(--foreground-muted)" }}>
              Privacy
            </p>
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
        </div>
      </div>

      <div className="card p-4 text-sm" style={{ color: "var(--foreground-muted)" }}>
        {user.email}
      </div>

      <Link href="/app/borden" className="block text-center text-sm font-semibold py-2" style={{ color: "var(--brand-600)" }}>
        Bordenoverzicht (intern)
      </Link>

      <SignOutButton />
    </div>
  );
}

function StatBlock({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string | number }) {
  return (
    <div className="card p-3">
      <div className="icon-bubble mx-auto mb-1.5" style={{ width: 28, height: 28, borderRadius: 9, background: color }}>
        {icon}
      </div>
      <p className="text-lg font-extrabold">{value}</p>
      <p className="text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>
        {label}
      </p>
    </div>
  );
}
