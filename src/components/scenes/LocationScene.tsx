"use client";

import { useId } from "react";
import type { LocationActor, LocationId, LocationSlot, SignId, TrafficLightState } from "@/lib/questions/types";
import { outwardVector, pointOnBearing } from "@/lib/scenes/bearingMath";
import { LOCATION_ACTOR_SLOTS, LOCATION_RING_GEOMETRY, LOCATION_SIGN_SLOTS, type ActorSlot } from "@/lib/scenes/locationSlots.generated";
import { SignIcon } from "./SignIcon";
import { TrafficActor, SelfLabel } from "./TrafficActor";

// Every location's slot geometry (where a vehicle/sign may sit, at what
// rotation and scale) lives inside its own SVG as an invisible marker layer
// — see any public/scenes/*.svg's "module-slots" group — instead of a table
// here, so artwork and placement data can never drift apart. Read out at
// build time by scripts/generate-scene-manifest.mjs into
// locationSlots.generated.ts, imported above.

/** Roundabout backgrounds (currently just "eenbaansrotonde") don't use a
 * fixed per-slot position: an actor's exact spot depends on whether it's
 * still approaching or already circulating, computed from the background's
 * ring-geometry marker + the slot's own compass bearing. */
function ringActorGeometry(ring: NonNullable<(typeof LOCATION_RING_GEOMETRY)[string]>, slot: ActorSlot, position: "approaching" | "on-ring") {
  const center = { x: ring.x, y: ring.y };
  if (position === "approaching") {
    const { x, y } = pointOnBearing(center, slot.bearing, ring.approachRadius, ring.laneOffset);
    return { x, y, rotation: slot.bearing + 180, scale: slot.scale };
  }
  const ringBearing = slot.bearing + ring.ringLeadDeg;
  const { x, y } = pointOnBearing(center, ringBearing, ring.ringRadius);
  return { x, y, rotation: ringBearing - 90, scale: slot.scale };
}

export function LocationScene({
  location,
  signs,
  trafficLight,
  actors = [],
  selectedSlot,
  correctSlot,
  disabled,
  onSelect,
}: {
  location: LocationId;
  /** Any real catalogue sign(s) planted beside a specific approach —
   * modular per question (e.g. a zone-30 sign at the "north" approach). */
  signs?: { signId: SignId; slot: LocationSlot }[];
  trafficLight?: { slot: LocationSlot; state: TrafficLightState } | null;
  /** Omit for a static illustration (no interactive hotspots) — e.g. a
   * SINGLE_CHOICE prompt image showing a sign in its road context. */
  actors?: LocationActor[];
  selectedSlot?: string | null;
  correctSlot?: string;
  disabled?: boolean;
  onSelect?: (slot: string) => void;
}) {
  const shadowFilterId = useId();
  const markerPos = LOCATION_SIGN_SLOTS[location] ?? {};
  const actorSlots = LOCATION_ACTOR_SLOTS[location] ?? {};
  const ringGeometry = LOCATION_RING_GEOMETRY[location];

  return (
    <div className="w-full max-w-sm mx-auto">
      <svg viewBox="0 0 1024 1024" className="w-full h-auto select-none rounded-3xl overflow-hidden">
        <defs>
          <filter id={shadowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        <image href={`/scenes/${location}.svg`} x="0" y="0" width="1024" height="1024" />

        {signs?.map((s) => {
          const pos = markerPos[s.slot];
          if (!pos) return null;
          return (
            <g key={`${s.slot}-${s.signId}`} transform={`translate(${pos.x},${pos.y})`}>
              <g transform="translate(-36,-36)">
                <SignIcon id={s.signId} size={72} />
              </g>
            </g>
          );
        })}

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
          const slot = actorSlots[actor.slot];
          if (!slot) return null;
          const geometry = ringGeometry ? ringActorGeometry(ringGeometry, slot, actor.position ?? "approaching") : slot;
          const isSelected = selectedSlot === actor.id;
          const outcome = disabled && isSelected ? (actor.id === correctSlot ? "correct" : "incorrect") : null;
          const out = outwardVector(slot.bearing);
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
                <TrafficActor kind={actor.kind} color={actor.color} shadowFilterId={shadowFilterId} scale={geometry.scale} />
              </g>
              {actor.self && <SelfLabel dx={labelDx} dy={labelDy} scale={geometry.scale} />}
              <circle
                r="55"
                fill="transparent"
                className={disabled ? "" : "cursor-pointer"}
                onClick={() => !disabled && onSelect?.(actor.id)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
