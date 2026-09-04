"use client";

import type { TrafficLightState } from "@/lib/questions/types";

export type ActorKind = "car" | "cyclist" | "pedestrian" | "truck";

/** The car/cyclist/pedestrian/truck sprite shared by every scene that places
 * road users on a background — extracted so IntersectionScene,
 * RoundaboutScene and LocationScene don't each carry their own copy.
 * `scale` lets it match whatever canvas size a scene draws at (it was
 * originally sized for a 300×300 viewBox; the real-asset LocationScene
 * backgrounds are 1024×1024, roughly 3.4×). */
export function TrafficActor({
  kind,
  color,
  shadowFilterId,
  scale = 1,
}: {
  kind: ActorKind;
  color?: string;
  shadowFilterId: string;
  scale?: number;
}) {
  const fill = color ?? "var(--sign-blue)";
  return (
    <g transform={scale !== 1 ? `scale(${scale})` : undefined}>
      <ActorShape kind={kind} fill={fill} shadowFilterId={shadowFilterId} />
    </g>
  );
}

function ActorShape({ kind, fill, shadowFilterId }: { kind: ActorKind; fill: string; shadowFilterId: string }) {
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

/** The gold "JIJ" pill marking the learner's own actor — shared so every
 * scene labels the learner the same way. `scale` matches TrafficActor's. */
export function SelfLabel({ dx, dy, scale = 1 }: { dx: number; dy: number; scale?: number }) {
  return (
    <g transform={`translate(${dx},${dy}) scale(${scale})`}>
      {/* Darkened from --gold-500 — plain gold under white text doesn't
         clear WCAG AA (4.5:1); this shade does. */}
      <rect x="-16" y="-9" width="32" height="18" rx="9" fill="color-mix(in srgb, var(--gold-500) 62%, black)" />
      <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="white" fontFamily="sans-serif">
        JIJ
      </text>
    </g>
  );
}

/** A small traffic-light pole: a dark housing with 3 stacked lenses, the
 * active color lit and the other two dimmed — same visual grammar as a
 * real signal head, simplified to a single-aspect pole per approach. */
export function TrafficLightPole({ state, scale = 1 }: { state: TrafficLightState; scale?: number }) {
  const lensColor = (c: TrafficLightState) => {
    if (state !== c) return "rgba(255,255,255,0.15)";
    if (c === "red") return "var(--danger-500)";
    if (c === "orange") return "var(--gold-500)";
    return "var(--success-500)";
  };
  return (
    <g transform={`scale(${scale}) translate(-7,-26)`}>
      <rect x="0" y="0" width="14" height="34" rx="4" fill="var(--sign-black)" />
      <circle cx="7" cy="8" r="4" fill={lensColor("red")} />
      <circle cx="7" cy="17" r="4" fill={lensColor("orange")} />
      <circle cx="7" cy="26" r="4" fill={lensColor("green")} />
      <rect x="5" y="34" width="4" height="10" fill="var(--sign-black)" />
    </g>
  );
}
