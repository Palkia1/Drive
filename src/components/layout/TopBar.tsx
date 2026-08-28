import Link from "next/link";
import { StreakPill, XpPill, LevelPill } from "@/components/ui/StatPill";

export function TopBar({
  xp,
  level,
  streak,
  schoolName,
}: {
  xp: number;
  level: number;
  streak: number;
  schoolName?: string | null;
}) {
  return (
    <header className="sticky top-0 z-20 backdrop-blur-md border-b" style={{ background: "color-mix(in srgb, var(--background) 85%, transparent)", borderColor: "var(--border)" }}>
      <div className="mx-auto max-w-lg px-4 py-3 flex items-center justify-between">
        <Link href="/app" className="font-extrabold text-lg tracking-tight" style={{ color: "var(--brand-600)" }}>
          Rijklaar
          {schoolName && (
            <span className="ml-2 hidden sm:inline text-xs font-medium align-middle" style={{ color: "var(--foreground-muted)" }}>
              · {schoolName}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <StreakPill streak={streak} />
          <XpPill xp={xp} />
          <LevelPill level={level} />
        </div>
      </div>
    </header>
  );
}
