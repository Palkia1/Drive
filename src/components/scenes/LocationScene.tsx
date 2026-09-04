"use client";

import { useId } from "react";
import type { LocationActor, LocationId, LocationSlot, TrafficLightState } from "@/lib/questions/types";
import { SignIcon } from "./SignIcon";
import { TrafficActor, SelfLabel } from "./TrafficActor";

// Every location's road geometry was measured directly from its SVG (see
// public/scenes/*.svg — each is a 1024×1024 top-down illustration with
// documented coordinates in its own comments). Rotation follows the same
// convention as IntersectionScene: 0° = facing up (north), clockwise —
// north-slot traffic faces south (180°), etc.
type SlotGeometry = { x: number; y: number; rotation: number };

const ACTOR_POS: Record<LocationId, Partial<Record<LocationSlot, SlotGeometry>>> = {
  "gelijkwaardige-kruising": {
    north: { x: 434, y: 180, rotation: 180 },
    south: { x: 590, y: 844, rotation: 0 },
    west: { x: 180, y: 590, rotation: 90 },
    east: { x: 844, y: 434, rotation: 270 },
  },
  "doorgaande-weg-twee-zijwegen-zonder-naad": {
    north: { x: 462, y: 180, rotation: 180 },
    south: { x: 562, y: 844, rotation: 0 },
    west: { x: 100, y: 572, rotation: 90 },
    east: { x: 924, y: 452, rotation: 270 },
  },
  "straat-van-rechts-stedelijk": {
    north: { x: 436, y: 150, rotation: 180 },
    south: { x: 588, y: 874, rotation: 0 },
    east: { x: 900, y: 436, rotation: 270 },
  },
  // Roundabout actors are positioned via trig (see ringActorPosition below);
  // this table isn't used for "eenbaansrotonde".
  eenbaansrotonde: {},
};

// Beside the relevant approach, on the right-hand side of that direction of
// travel — same placement convention as IntersectionScene's SIGN_POS,
// scaled up for these 1024×1024 backgrounds. Used for both an optional
// priority-sign overlay and the traffic-light overlay.
const MARKER_POS: Record<LocationId, Partial<Record<LocationSlot, { x: number; y: number }>>> = {
  "gelijkwaardige-kruising": {
    north: { x: 300, y: 110 },
    south: { x: 724, y: 914 },
    west: { x: 110, y: 724 },
    east: { x: 914, y: 300 },
  },
  "doorgaande-weg-twee-zijwegen-zonder-naad": {
    north: { x: 360, y: 110 },
    south: { x: 664, y: 914 },
    west: { x: 110, y: 680 },
    east: { x: 914, y: 344 },
  },
  "straat-van-rechts-stedelijk": {
    north: { x: 300, y: 90 },
    south: { x: 664, y: 934 },
    east: { x: 934, y: 300 },
  },
  eenbaansrotonde: {
    north: { x: 340, y: 130 },
    south: { x: 684, y: 894 },
    west: { x: 130, y: 684 },
    east: { x: 894, y: 340 },
  },
};

const ROUNDABOUT_CENTER = { x: 512, y: 512 };
const ROUNDABOUT_APPROACH_RADIUS = 350;
const ROUNDABOUT_RING_RADIUS = 187; // midpoint of the drivable ring (132-242)
const ROUNDABOUT_RING_LEAD_DEG = 26;
const SLOT_BEARING: Record<LocationSlot, number> = { north: 0, east: 90, south: 180, west: 270 };

function outwardVector(bearingDeg: number) {
  const rad = (bearingDeg * Math.PI) / 180;
  return { x: Math.sin(rad), y: -Math.cos(rad) };
}

// Quarter of an approach arm's total width (228, per eenbaansrotonde.svg) —
// puts an approaching actor in its own lane instead of straddling the
// centerline, same right-hand-lane convention as every other location.
const ROUNDABOUT_LANE_OFFSET = 57;

function ringActorGeometry(slot: LocationSlot, position: "approaching" | "on-ring"): SlotGeometry {
  const bearing = SLOT_BEARING[slot];
  if (position === "approaching") {
    const out = outwardVector(bearing);
    const px = ROUNDABOUT_CENTER.x + out.x * ROUNDABOUT_APPROACH_RADIUS;
    const py = ROUNDABOUT_CENTER.y + out.y * ROUNDABOUT_APPROACH_RADIUS;
    // Right-hand lane offset, perpendicular to the inward direction of travel.
    const lateral = { x: -out.y, y: out.x };
    return {
      x: px - lateral.x * ROUNDABOUT_LANE_OFFSET,
      y: py - lateral.y * ROUNDABOUT_LANE_OFFSET,
      rotation: bearing + 180,
    };
  }
  const ringBearing = bearing + ROUNDABOUT_RING_LEAD_DEG;
  const out = outwardVector(ringBearing);
  return {
    x: ROUNDABOUT_CENTER.x + out.x * ROUNDABOUT_RING_RADIUS,
    y: ROUNDABOUT_CENTER.y + out.y * ROUNDABOUT_RING_RADIUS,
    rotation: ringBearing - 90,
  };
}

const SIGN_FOR_KIND = {
  "priority-road": "B1",
  "give-way": "B6",
  stop: "B7",
} as const;

// TrafficActor is sized for a 300-unit canvas; these backgrounds are 1024,
// a straight 3.4× scale — but the narrowest lanes here (roundabout arms/ring,
// ~110-114 wide) are much tighter relative to road width than the old hand-
// drawn scenes, so a car at 3.4× (width ~88) or truck (~116) would overflow
// them. 2.0× keeps every vehicle comfortably inside its own lane everywhere.
const ACTOR_SCALE = 2.0;

export function LocationScene({
  location,
  hasRightOfWaySign,
  trafficLight,
  actors,
  selectedSlot,
  correctSlot,
  disabled,
  onSelect,
}: {
  location: LocationId;
  hasRightOfWaySign?: { kind: "priority-road" | "give-way" | "stop"; slot: LocationSlot } | null;
  trafficLight?: { slot: LocationSlot; state: TrafficLightState } | null;
  actors: LocationActor[];
  selectedSlot?: string | null;
  correctSlot: string;
  disabled?: boolean;
  onSelect: (slot: string) => void;
}) {
  const shadowFilterId = useId();
  const markerPos = MARKER_POS[location];

  return (
    <div className="w-full max-w-sm mx-auto">
      <svg viewBox="0 0 1024 1024" className="w-full h-auto select-none rounded-3xl overflow-hidden">
        <defs>
          <filter id={shadowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        <image href={`/scenes/${location}.svg`} x="0" y="0" width="1024" height="1024" />

        {hasRightOfWaySign &&
          markerPos[hasRightOfWaySign.slot] &&
          (() => {
            const pos = markerPos[hasRightOfWaySign.slot]!;
            return (
              <g transform={`translate(${pos.x},${pos.y})`}>
                <g transform="translate(-36,-36)">
                  <SignIcon id={SIGN_FOR_KIND[hasRightOfWaySign.kind]} size={72} />
                </g>
              </g>
            );
          })()}

        {trafficLight &&
          markerPos[trafficLight.slot] &&
          (() => {
            const pos = markerPos[trafficLight.slot]!;
            const size = 90;
            return (
              <image
                href="/scenes/stoplicht-rood-losse-ringen.svg"
                x={pos.x - size / 2}
                y={pos.y - size / 2}
                width={size}
                height={size}
              />
            );
          })()}

        {actors.map((actor) => {
          const geometry =
            location === "eenbaansrotonde"
              ? ringActorGeometry(actor.slot, actor.position ?? "approaching")
              : ACTOR_POS[location][actor.slot];
          if (!geometry) return null;
          const isSelected = selectedSlot === actor.id;
          const outcome = disabled && isSelected ? (actor.id === correctSlot ? "correct" : "incorrect") : null;
          const out = outwardVector(SLOT_BEARING[actor.slot]);
          const labelDx = out.x * 58;
          const labelDy = out.y * 58;

          return (
            <g key={actor.id} transform={`translate(${geometry.x} ${geometry.y})`}>
              {outcome && (
                <circle
                  r="62"
                  fill="none"
                  stroke={outcome === "correct" ? "var(--success-500)" : "var(--danger-500)"}
                  strokeWidth="8"
                  className="animate-pop-in"
                />
              )}
              <g transform={`rotate(${geometry.rotation})`}>
                <TrafficActor kind={actor.kind} color={actor.color} shadowFilterId={shadowFilterId} scale={ACTOR_SCALE} />
              </g>
              {actor.self && <SelfLabel dx={labelDx} dy={labelDy} scale={ACTOR_SCALE} />}
              <circle
                r="55"
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
