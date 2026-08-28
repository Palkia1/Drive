const COLORS = {
  high: "var(--success-500)",
  medium: "var(--accent-500)",
  low: "var(--danger-500)",
  none: "var(--foreground-muted)",
};

export function ActivityDot({ level }: { level: "high" | "medium" | "low" | "none" }) {
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: COLORS[level] }} />;
}
