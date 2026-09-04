"use client";

import { useId } from "react";
import type { IntersectionActor, IntersectionSlot, TrafficLightState } from "@/lib/questions/types";
import { SignIcon } from "./SignIcon";
import { TrafficActor, SelfLabel, TrafficLightPole } from "./TrafficActor";

// Each road carries two lanes (right-hand/Dutch traffic), so an actor sits
// offset from the road's centerline into its own lane — not straddling the
// middle line. An actor at a given slot is heading *toward* the
// intersection, so it belongs in the lane that's on the right-hand side of
// its own direction of travel (e.g. a car approaching from the south, i.e.
// heading north, keeps to the east half of the vertical road).
const LANE_OFFSET = 20;
const SLOT_POS: Record<IntersectionSlot, { x: number; y: number }> = {
  north: { x: 150 - LANE_OFFSET, y: 55 },
  east: { x: 245, y: 150 - LANE_OFFSET },
  south: { x: 150 + LANE_OFFSET, y: 245 },
  west: { x: 55, y: 150 + LANE_OFFSET },
};

const SLOT_ROTATION: Record<IntersectionSlot, number> = {
  north: 180,
  south: 0,
  east: 270,
  west: 90,
};

// Beside the road each slot's traffic approaches on (not on the pavement
// itself), on the right-hand side of that direction of travel — same
// convention Dutch signs are actually posted under.
const SIGN_POS: Record<IntersectionSlot, { x: number; y: number }> = {
  north: { x: 98, y: 42 },
  south: { x: 202, y: 258 },
  east: { x: 258, y: 202 },
  west: { x: 42, y: 98 },
};

// Where the "JIJ" label sits relative to its actor — pushed further out
// from the intersection center (not just "up") so it never overlaps the
// crossing or the other actor, whichever arm the learner is on.
const LABEL_OFFSET: Record<IntersectionSlot, { dx: number; dy: number }> = {
  north: { dx: 0, dy: -26 },
  south: { dx: 0, dy: 26 },
  east: { dx: 26, dy: 0 },
  west: { dx: -26, dy: 0 },
};

const SIGN_FOR_KIND = {
  "priority-road": "B1",
  "give-way": "B6",
  stop: "B7",
} as const;

export function IntersectionScene({
  actors,
  hasRightOfWaySign,
  trafficLights,
  selectedSlot,
  correctSlot,
  disabled,
  onSelect,
}: {
  actors: IntersectionActor[];
  hasRightOfWaySign?: { kind: "priority-road" | "give-way" | "stop"; slot: IntersectionSlot } | null;
  /** Per-slot traffic-light state — mutually exclusive with hasRightOfWaySign
   * in practice (a scene uses one or the other), but nothing stops both. */
  trafficLights?: Partial<Record<IntersectionSlot, TrafficLightState>>;
  selectedSlot?: IntersectionSlot | null;
  correctSlot: IntersectionSlot;
  disabled?: boolean;
  onSelect: (slot: IntersectionSlot) => void;
}) {
  const gradientId = useId();
  const shadowFilterId = useId();

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

        {/* roads */}
        <rect x="110" y="0" width="80" height="300" fill="var(--road)" />
        <rect x="0" y="110" width="300" height="80" fill="var(--road)" />
        {/* lane markings */}
        <g stroke="var(--road-marking)" strokeWidth="3" strokeDasharray="10 10">
          <line x1="150" y1="0" x2="150" y2="110" />
          <line x1="150" y1="190" x2="150" y2="300" />
          <line x1="0" y1="150" x2="110" y2="150" />
          <line x1="190" y1="150" x2="300" y2="150" />
        </g>

        {hasRightOfWaySign && (
          <g transform={`translate(${SIGN_POS[hasRightOfWaySign.slot].x},${SIGN_POS[hasRightOfWaySign.slot].y})`}>
            <g transform="translate(-15,-15)">
              <SignIcon id={SIGN_FOR_KIND[hasRightOfWaySign.kind]} size={30} />
            </g>
          </g>
        )}

        {trafficLights &&
          (Object.entries(trafficLights) as [IntersectionSlot, TrafficLightState][]).map(([slot, state]) => (
            <g key={slot} transform={`translate(${SIGN_POS[slot].x},${SIGN_POS[slot].y})`}>
              <TrafficLightPole state={state} />
            </g>
          ))}

        {actors.map((actor) => {
          const pos = SLOT_POS[actor.slot];
          const rotation = SLOT_ROTATION[actor.slot];
          const isSelected = selectedSlot === actor.slot;
          const outcome = disabled && isSelected ? (actor.slot === correctSlot ? "correct" : "incorrect") : null;
          const labelOffset = LABEL_OFFSET[actor.slot];

          return (
            <g key={actor.slot} transform={`translate(${pos.x} ${pos.y})`}>
              {outcome && (
                <circle
                  r="34"
                  fill="none"
                  stroke={outcome === "correct" ? "var(--success-500)" : "var(--danger-500)"}
                  strokeWidth="4"
                  className="animate-pop-in"
                />
              )}
              <g transform={`rotate(${rotation})`}>
                <TrafficActor kind={actor.kind} color={actor.color} shadowFilterId={shadowFilterId} />
              </g>
              {actor.self && <SelfLabel dx={labelOffset.dx} dy={labelOffset.dy} />}
              <circle
                r="30"
                fill="transparent"
                className={disabled ? "" : "cursor-pointer"}
                onClick={() => !disabled && onSelect(actor.slot)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

