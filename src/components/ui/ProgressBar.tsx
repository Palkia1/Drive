export function ProgressBar({
  value,
  max,
  color = "var(--brand-500)",
  trackColor = "var(--surface-muted)",
  height = 10,
}: {
  value: number;
  max: number;
  color?: string;
  trackColor?: string;
  height?: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
      className="w-full rounded-full overflow-hidden"
      style={{ background: trackColor, height }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
