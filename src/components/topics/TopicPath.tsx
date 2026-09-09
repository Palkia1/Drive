import Link from "next/link";
import { TopicIcon, getTopicColor } from "@/components/topics/TopicIcon";
import { Check, Flag } from "lucide-react";
import type { TopicMasterySummary } from "@/lib/mastery";

const NODE_SIZE = 62;
const CURRENT_NODE_SIZE = 78;
const ROW_HEIGHT = 96;
const CENTER_X = 140;
const AMPLITUDE = 76;
const CONTAINER_WIDTH = 280;
const TOP_PADDING = 46;

function positionFor(index: number) {
  const x = CENTER_X + AMPLITUDE * Math.sin(index * 1.05);
  const y = TOP_PADDING + index * ROW_HEIGHT;
  return { x, y };
}

/**
 * A winding path of topic nodes, à la a skill-tree map — replaces a grid of
 * equally-weighted stat cards with ONE dominant "do this next" node plus a
 * de-emphasized (never locked/greyed — every topic is always practicable
 * here) trail of the rest. Fewer simultaneous decisions to weigh (Hick's
 * law); "what should I practice" is answered by the system instead of left
 * for the student to read off five separate cards (Tesler's law).
 */
export function TopicPath({
  topics,
  currentTopicId,
}: {
  topics: TopicMasterySummary[];
  currentTopicId: string | null;
}) {
  const points = topics.map((_, i) => positionFor(i));
  const height = points.length > 0 ? points[points.length - 1].y + CURRENT_NODE_SIZE : 0;

  const linePath = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const c1y = prev.y + ROW_HEIGHT / 2;
      const c2y = p.y - ROW_HEIGHT / 2;
      return `C ${prev.x} ${c1y}, ${p.x} ${c2y}, ${p.x} ${p.y}`;
    })
    .join(" ");

  return (
    <div className="relative mx-auto" style={{ width: CONTAINER_WIDTH, height }}>
      <svg
        className="absolute inset-0 pointer-events-none"
        width={CONTAINER_WIDTH}
        height={height}
        viewBox={`0 0 ${CONTAINER_WIDTH} ${height}`}
      >
        <path d={linePath} fill="none" stroke="var(--border)" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 14" />
      </svg>

      {topics.map((t, i) => {
        const { x, y } = points[i];
        const isCurrent = t.topicId === currentTopicId;
        const mastered = !t.insufficientData && t.level >= 4;
        const size = isCurrent ? CURRENT_NODE_SIZE : NODE_SIZE;
        const color = getTopicColor(t.topicIcon);
        const pct = t.insufficientData ? 0 : Math.min(100, (t.level / 5) * 100);
        const ringR = size / 2 - 4;
        const circumference = 2 * Math.PI * ringR;

        return (
          <Link
            key={t.topicId}
            href={`/app/sessie?mode=TOPIC&topics=${t.topicId}`}
            aria-label={`${t.topicName} — ${mastered ? "beheerst" : `level ${t.level}/5`}`}
            className="absolute flex flex-col items-center"
            style={{ left: x - size / 2, top: y - size / 2, width: size }}
          >
            {isCurrent && (
              <span
                className="mb-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white animate-pop-in"
                style={{ background: color }}
              >
                <Flag size={11} strokeWidth={3} /> Begin hier
              </span>
            )}
            <div
              className={`relative flex items-center justify-center rounded-full ${isCurrent ? "animate-node-pulse" : ""}`}
              style={{ width: size, height: size, background: color, color, boxShadow: "var(--shadow-card)" }}
            >
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={ringR} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={ringR}
                  fill="none"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - pct / 100)}
                />
              </svg>
              <TopicIcon icon={t.topicIcon} size={isCurrent ? 30 : 24} />
              {mastered && !isCurrent && (
                <span
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: "var(--success-500)", boxShadow: "0 0 0 2px var(--surface)" }}
                >
                  <Check size={12} color="white" strokeWidth={3.5} />
                </span>
              )}
            </div>
            <p
              className={`mt-1.5 max-w-[86px] truncate text-center text-[11px] ${isCurrent ? "font-extrabold" : "font-semibold"}`}
              style={{ color: isCurrent ? color : "var(--foreground-muted)" }}
            >
              {t.topicName}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
