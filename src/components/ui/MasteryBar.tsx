import { ProgressBar } from "./ProgressBar";

const LEVEL_COLORS = [
  "var(--foreground-muted)",
  "var(--danger-500)",
  "var(--accent-500)",
  "var(--accent-500)",
  "var(--success-500)",
  "var(--success-600)",
];

export function MasteryBar({
  name,
  level,
  insufficientData,
  compact,
}: {
  name: string;
  level: number;
  insufficientData: boolean;
  compact?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={compact ? "text-sm font-medium" : "font-semibold"}>{name}</span>
        <span className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
          {insufficientData ? "Nog onvoldoende gegevens" : `Level ${level}/5`}
        </span>
      </div>
      <ProgressBar
        value={insufficientData ? 0 : level}
        max={5}
        color={insufficientData ? "var(--border)" : LEVEL_COLORS[level]}
        height={compact ? 8 : 10}
      />
    </div>
  );
}
