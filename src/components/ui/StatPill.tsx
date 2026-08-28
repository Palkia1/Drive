import { Flame, Zap, Trophy } from "lucide-react";

function softBg(color: string) {
  return `color-mix(in srgb, ${color} 15%, transparent)`;
}

export function StreakPill({ streak }: { streak: number }) {
  return (
    <div className="pill" style={{ background: softBg("var(--accent-500)"), color: "var(--accent-600)" }}>
      <Flame size={14} strokeWidth={2.5} />
      {streak}
    </div>
  );
}

export function XpPill({ xp }: { xp: number }) {
  return (
    <div className="pill" style={{ background: softBg("var(--brand-500)"), color: "var(--brand-600)" }}>
      <Zap size={14} strokeWidth={2.5} />
      {xp.toLocaleString("nl-NL")}
    </div>
  );
}

export function LevelPill({ level }: { level: number }) {
  return (
    <div className="pill" style={{ background: softBg("var(--success-500)"), color: "var(--success-600)" }}>
      <Trophy size={14} strokeWidth={2.5} />
      Level {level}
    </div>
  );
}
