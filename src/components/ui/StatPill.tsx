import { Flame, Zap, Trophy } from "lucide-react";

function Stat({ icon, value, color }: { icon: React.ReactNode; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={{ background: color, boxShadow: `0 2px 0 color-mix(in srgb, ${color} 70%, black)` }}
      >
        {icon}
      </div>
      <span className="font-extrabold text-[15px]" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export function StreakPill({ streak }: { streak: number }) {
  return <Stat icon={<Flame size={13} color="white" strokeWidth={2.5} />} value={streak} color="var(--gold-600)" />;
}

export function XpPill({ xp }: { xp: number }) {
  return <Stat icon={<Zap size={13} color="white" strokeWidth={2.5} />} value={xp.toLocaleString("nl-NL")} color="var(--brand-500)" />;
}

export function LevelPill({ level }: { level: number }) {
  return <Stat icon={<Trophy size={13} color="white" strokeWidth={2.5} />} value={level} color="var(--primary-500)" />;
}
