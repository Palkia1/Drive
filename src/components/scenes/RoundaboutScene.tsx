"use client";

import { useId } from "react";
import type { RoundaboutActor } from "@/lib/questions/types";
import { outwardVector, pointOnBearing } from "@/lib/scenes/bearingMath";
import { TrafficActor, SelfLabel } from "./TrafficActor";

const CENTER = { x: 150, y: 150 };
const LANE_WIDTH = 28;
const OUTER_RADIUS = 85;
const ARM_HALF_WIDTH = 35;
const APPROACH_RADIUS = 128;
const RING_ACTOR_LEAD_DEG = 26; // how far "upstream" (ccw) an on-ring actor sits from its arm
const LANE_OFFSET = 18;

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
              <SharkTeeth y={-(OUTER_RADIUS + 3)} halfWidth={ARM_HALF_WIDTH} />
            </g>
          );
        })}

        {actors.map((actor) => {
          const bearing = armBearing(actor.arm, armCount);
          const isSelected = selectedSlot === actor.id;
          const outcome = disabled && isSelected ? (actor.id === correctSlot ? "correct" : "incorrect") : null;

          let x: number, y: number, rotation: number;
          if (actor.position === "approaching") {
            // right-hand lane offset, perpendicular to the inward direction of travel
            ({ x, y } = pointOnBearing(CENTER, bearing, APPROACH_RADIUS, LANE_OFFSET));
            rotation = bearing + 180;
          } else {
            const ringBearing = bearing + RING_ACTOR_LEAD_DEG;
            const ringRadius = (innerRadius + OUTER_RADIUS) / 2;
            ({ x, y } = pointOnBearing(CENTER, ringBearing, ringRadius));
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
                <TrafficActor kind={actor.kind} color={actor.color} shadowFilterId={shadowFilterId} />
              </g>
              {actor.self && <SelfLabel dx={labelDx} dy={labelDy} />}
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

// Real haaientanden are painted per weghelft (each direction's own lane),
// not as one row spanning the full road — so this draws two independent
// rows, one on each side of the centerline, with a gap between them.
function SharkTeeth({ y, halfWidth }: { y: number; halfWidth: number }) {
  return (
    <>
      <SharkTeethRow y={y} xStart={-halfWidth + 4} xEnd={-4} />
      <SharkTeethRow y={y} xStart={4} xEnd={halfWidth - 4} />
    </>
  );
}

function SharkTeethRow({ y, xStart, xEnd }: { y: number; xStart: number; xEnd: number }) {
  const width = xEnd - xStart;
  const count = 3;
  const step = width / count;
  const teeth = Array.from({ length: count }, (_, i) => {
    const cx = xStart + step * i + step / 2;
    return `M${cx - step * 0.35},${y + 6} L${cx},${y} L${cx + step * 0.35},${y + 6} Z`;
  }).join(" ");
  return <path d={teeth} fill="white" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />;
}
