"use client";

import { useId } from "react";
import type { RoundaboutActor } from "@/lib/questions/types";

const CENTER = { x: 150, y: 150 };
const LANE_WIDTH = 16;
const OUTER_RADIUS = 85;
const ARM_HALF_WIDTH = 35;
const APPROACH_RADIUS = 128;
const RING_ACTOR_LEAD_DEG = 26; // how far "upstream" (ccw) an on-ring actor sits from its arm
const LANE_OFFSET = 18;

// Bearing θ: 0 = north (up), 90 = east, clockwise — same convention as
// IntersectionScene's slot rotations, generalized to an arbitrary angle.
function outwardVector(bearingDeg: number) {
  const rad = (bearingDeg * Math.PI) / 180;
  return { x: Math.sin(rad), y: -Math.cos(rad) };
}

function armBearing(arm: number, armCount: number) {
  return (arm * 360) / armCount;
}

export function RoundaboutScene({
  armCount,
  ringLanes = 1,
  sharkTeethArms = [],
  actors,
  selectedSlot,
  correctSlot,
  disabled,
  onSelect,
}: {
  armCount: number;
  ringLanes?: number;
  sharkTeethArms?: number[];
  actors: RoundaboutActor[];
  selectedSlot?: string | null;
  correctSlot: string;
  disabled?: boolean;
  onSelect: (slot: string) => void;
}) {
  const gradientId = useId();
  const shadowFilterId = useId();
  const innerRadius = OUTER_RADIUS - LANE_WIDTH * ringLanes;

  const arms = Array.from({ length: armCount }, (_, i) => armBearing(i, armCount));

  return (
    <div className="w-full max-w-sm mx-auto">
      <svg viewBox="0 0 300 300" className="w-full h-auto select-none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--grass)" />
            <stop offset="1" stopColor="var(--grass)" />
          </linearGradient>
          <filter id={shadowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>
        <rect width="300" height="300" rx="20" fill={`url(#${gradientId})`} opacity="0.5" />

        {/* arms — straight two-way road strips running from the canvas edge
           in to the ring */}
        {arms.map((bearing) => (
          <g key={`arm-${bearing}`} transform={`translate(${CENTER.x} ${CENTER.y}) rotate(${bearing})`}>
            <rect x={-ARM_HALF_WIDTH} y={-190} width={ARM_HALF_WIDTH * 2} height={190 - innerRadius} fill="var(--road)" />
            <line
              x1={0}
              y1={-190}
              x2={0}
              y2={-(OUTER_RADIUS + 6)}
              stroke="var(--road-marking)"
              strokeWidth="3"
              strokeDasharray="10 10"
            />
          </g>
        ))}

        {/* ring */}
        <circle cx={CENTER.x} cy={CENTER.y} r={OUTER_RADIUS} fill="var(--road)" />
        {Array.from({ length: ringLanes - 1 }, (_, i) => (
          <circle
            key={`lane-${i}`}
            cx={CENTER.x}
            cy={CENTER.y}
            r={OUTER_RADIUS - LANE_WIDTH * (i + 1)}
            fill="none"
            stroke="var(--road-marking)"
            strokeWidth="2"
            strokeDasharray="7 8"
          />
        ))}
        <circle cx={CENTER.x} cy={CENTER.y} r={innerRadius} fill={`url(#${gradientId})`} />
        <circle cx={CENTER.x} cy={CENTER.y} r={innerRadius * 0.55} fill="var(--grass)" opacity="0.6" />

        {/* haaientanden — priority markings at the ring/arm crossing */}
        {sharkTeethArms.map((arm) => {
          const bearing = armBearing(arm, armCount);
          return (
            <g key={`teeth-${arm}`} transform={`translate(${CENTER.x} ${CENTER.y}) rotate(${bearing})`}>
              <SharkTeeth y={-(OUTER_RADIUS + 3)} width={ARM_HALF_WIDTH * 2 - 6} />
            </g>
          );
        })}

        {actors.map((actor) => {
          const bearing = armBearing(actor.arm, armCount);
          const isSelected = selectedSlot === actor.id;
          const outcome = disabled && isSelected ? (actor.id === correctSlot ? "correct" : "incorrect") : null;

          let x: number, y: number, rotation: number;
          if (actor.position === "approaching") {
            const out = outwardVector(bearing);
            const px = CENTER.x + out.x * APPROACH_RADIUS;
            const py = CENTER.y + out.y * APPROACH_RADIUS;
            // right-hand lane offset, perpendicular to the inward direction of travel
            const lateral = { x: -out.y, y: out.x };
            x = px - lateral.x * LANE_OFFSET;
            y = py - lateral.y * LANE_OFFSET;
            rotation = bearing + 180;
          } else {
            const ringBearing = bearing + RING_ACTOR_LEAD_DEG;
            const ringRadius = (innerRadius + OUTER_RADIUS) / 2;
            const out = outwardVector(ringBearing);
            x = CENTER.x + out.x * ringRadius;
            y = CENTER.y + out.y * ringRadius;
            rotation = ringBearing - 90;
          }

          const out = outwardVector(bearing);
          const labelDx = out.x * 26;
          const labelDy = out.y * 26;

          return (
            <g key={actor.id} transform={`translate(${x} ${y})`}>
              {outcome && (
                <circle
                  r="30"
                  fill="none"
                  stroke={outcome === "correct" ? "var(--success-500)" : "var(--danger-500)"}
                  strokeWidth="4"
                  className="animate-pop-in"
                />
              )}
              <g transform={`rotate(${rotation})`}>
                <Actor kind={actor.kind} color={actor.color} shadowFilterId={shadowFilterId} />
              </g>
              {actor.self && (
                <g transform={`translate(${labelDx},${labelDy})`}>
                  <rect x="-16" y="-9" width="32" height="18" rx="9" fill="var(--gold-500)" />
                  <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="white" fontFamily="sans-serif">
                    JIJ
                  </text>
                </g>
              )}
              <circle
                r="26"
                fill="transparent"
                className={disabled ? "" : "cursor-pointer"}
                onClick={() => !disabled && onSelect(actor.id)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SharkTeeth({ y, width }: { y: number; width: number }) {
  const count = 5;
  const step = width / count;
  const teeth = Array.from({ length: count }, (_, i) => {
    const cx = -width / 2 + step * i + step / 2;
    return `M${cx - step * 0.35},${y + 6} L${cx},${y} L${cx + step * 0.35},${y + 6} Z`;
  }).join(" ");
  return <path d={teeth} fill="white" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />;
}

// Same schematic actor rendering as IntersectionScene (kept local to avoid a
// cross-component dependency for what's a tiny, purely visual primitive).
function Actor({ kind, color, shadowFilterId }: { kind: RoundaboutActor["kind"]; color?: string; shadowFilterId: string }) {
  const fill = color ?? "var(--sign-blue)";
  if (kind === "pedestrian") {
    return (
      <g>
        <ellipse cy="11" rx="6" ry="2.2" fill="rgba(0,0,0,0.18)" filter={`url(#${shadowFilterId})`} />
        <circle cy="-14" r="5" fill="var(--sign-black)" />
        <path d="M0 -9 v14 M0 -2 l-8 8 M0 -2 l8 8 M-6 -3 h12" stroke="var(--sign-black)" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      </g>
    );
  }
  if (kind === "cyclist") {
    return (
      <g>
        <ellipse cy="14" rx="10" ry="2.4" fill="rgba(0,0,0,0.18)" filter={`url(#${shadowFilterId})`} />
        <circle cy="6" r="7" fill="none" stroke={fill} strokeWidth="3" />
        <circle cy="-8" r="4" fill="var(--sign-black)" />
        <path d="M0 6 L-3 -6 L6 -6 M0 6 L6 -2" stroke={fill} strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  const w = kind === "truck" ? 34 : 26;
  const h = kind === "truck" ? 58 : 46;
  return (
    <g>
      <ellipse cy={h / 2 + 3} rx={w / 2 + 1} ry="4" fill="rgba(0,0,0,0.22)" filter={`url(#${shadowFilterId})`} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="9" fill={fill} stroke="rgba(0,0,0,0.22)" strokeWidth="1.25" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h * 0.4} rx="9" fill="rgba(255,255,255,0.22)" />
      <rect x={-w / 2} y={h / 2 - h * 0.22} width={w} height={h * 0.22} fill="rgba(0,0,0,0.14)" />
      <rect x={-w / 2 + 4} y={-h / 2 + 8} width={w - 8} height={h * 0.26} rx="4" fill="rgba(255,255,255,0.6)" />
    </g>
  );
}
