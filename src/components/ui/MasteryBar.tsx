import { ProgressBar } from "./ProgressBar";
import { TopicIcon, getTopicColor } from "@/components/topics/TopicIcon";

const LEVEL_COLORS = [
  "var(--border)",
  "var(--danger-500)",
  "var(--gold-500)",
  "var(--gold-500)",
  "var(--success-400)",
  "var(--success-600)",
];

export function MasteryBar({
  name,
  level,
  insufficientData,
  compact,
  icon,
}: {
  name: string;
  level: number;
  insufficientData: boolean;
  compact?: boolean;
  icon?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon && (
        <div className="icon-bubble shrink-0" style={{ width: 34, height: 34, borderRadius: 10, background: getTopicColor(icon) }}>
          <TopicIcon icon={icon} size={17} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <span className={compact ? "text-sm font-semibold truncate" : "font-semibold truncate"}>{name}</span>
          <span className="text-xs font-bold shrink-0" style={{ color: "var(--foreground-muted)" }}>
            {insufficientData ? "Onvoldoende data" : `Level ${level}/5`}
          </span>
        </div>
        <ProgressBar
          value={insufficientData ? 0 : level}
          max={5}
          color={insufficientData ? "var(--border)" : LEVEL_COLORS[level]}
          height={compact ? 8 : 10}
        />
      </div>
    </div>
  );
}
