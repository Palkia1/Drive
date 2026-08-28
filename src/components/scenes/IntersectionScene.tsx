"use client";

import { useId } from "react";
import type { IntersectionActor, IntersectionSlot } from "@/lib/questions/types";
import { SignIcon } from "./SignIcon";

const SLOT_POS: Record<IntersectionSlot, { x: number; y: number }> = {
  north: { x: 150, y: 55 },
  east: { x: 245, y: 150 },
  south: { x: 150, y: 245 },
  west: { x: 55, y: 150 },
};

const SLOT_ROTATION: Record<IntersectionSlot, number> = {
  north: 180,
  south: 0,
  east: 270,
  west: 90,
};

const SIGN_FOR_KIND = {
  "priority-road": "B1",
  "give-way": "B6",
  stop: "B7",
} as const;

export function IntersectionScene({
  actors,
  hasRightOfWaySign,
  selectedSlot,
  correctSlot,
  disabled,
  onSelect,
}: {
  actors: IntersectionActor[];
  hasRightOfWaySign?: "priority-road" | "give-way" | "stop" | null;
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
          <g transform="translate(178,18)">
            <SignIcon id={SIGN_FOR_KIND[hasRightOfWaySign]} size={30} />
          </g>
        )}

        {actors.map((actor) => {
          const pos = SLOT_POS[actor.slot];
          const rotation = SLOT_ROTATION[actor.slot];
          const isSelected = selectedSlot === actor.slot;
          const outcome = disabled && isSelected ? (actor.slot === correctSlot ? "correct" : "incorrect") : null;

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
                <Actor kind={actor.kind} color={actor.color} shadowFilterId={shadowFilterId} />
              </g>
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

function Actor({ kind, color, shadowFilterId }: { kind: IntersectionActor["kind"]; color?: string; shadowFilterId: string }) {
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
  // Cars/trucks: a flat body + a soft top-highlight and bottom-shade overlay
  // (instead of an SVG <linearGradient>, which would need a fresh id per
  // instance) for a light 2.5D "premium automotive" read, plus a grounding
  // drop-shadow — still schematic/iconographic, not photorealistic.
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
