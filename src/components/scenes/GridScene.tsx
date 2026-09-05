"use client";

import { useId } from "react";
import type { Bearing, GridActor, GridCell, GridTile, SignId, TileKind, TileRotation } from "@/lib/questions/types";
import { pointOnBearing } from "@/lib/scenes/bearingMath";
import { REAL_TILE_FILES } from "@/lib/questions/realTiles.generated";
import { SignIcon } from "./SignIcon";
import { TrafficActor, SelfLabel } from "./TrafficActor";

/**
 * Renders a GridHotspotScene: a small grid of road tiles, addressed by
 * cell + bearing instead of a per-background hardcoded slot table. Where
 * real artwork exists (public/tiles/, tracked in realTiles.generated.ts —
 * regenerate with `npm run tiles:manifest`), each tile is drawn once at its
 * canonical rotation 0 and rotated in place via `transform="rotate(...)"`.
 * Kinds without real art yet fall back to the flat placeholder shapes.
 *
 * Contract mirrors LocationScene exactly: `actors`/`onSelect`/`correctSlot`
 * are all optional, so the same component works non-interactively for
 * SingleChoiceScene's `promptGridScene`.
 */

const TILE_SIZE = 300;
const ROAD_WIDTH = 90;
const NARROW_ROAD_WIDTH = 56;
const LANE_OFFSET = 20;
const APPROACH_RADIUS = TILE_SIZE * 0.42;
const RING_RADIUS = TILE_SIZE * 0.24;
const RING_LEAD_DEG = 22;

// Which compass edges (0=N,90=E,180=S,270=W) a tile kind opens a road on, at
// its canonical (rotation-0) orientation — used to decide which edges to
// paint a road strip toward. "t-junction"'s single closed edge (the one
// with no road) is south at rotation 0, i.e. the stem points north, per the
// tile art brief.
const CANONICAL_OPEN_EDGES: Record<TileKind, number[]> = {
  grass: [],
  straight: [0, 180],
  "narrow-residential": [0, 180],
  corner: [180, 90],
  "wide-curve": [180, 90],
  "t-junction": [0, 90, 270],
  crossroad: [0, 90, 180, 270],
  "roundabout-center": [0, 90, 180, 270],
};

function openEdges(kind: TileKind, rotation: TileRotation): number[] {
  return CANONICAL_OPEN_EDGES[kind].map((e) => (e + rotation) % 360);
}

function TileArt({ kind, rotation }: { kind: TileKind; rotation: TileRotation }) {
  const ext = REAL_TILE_FILES[kind];
  if (ext) {
    // Real art is drawn once at canonical rotation 0 (e.g. t-junction's stem
    // points north) — the renderer supplies every other orientation via a
    // plain SVG rotation around the tile's center, so there's never a need
    // for 4 separate rotated files per tile.
    return (
      <g transform={`rotate(${rotation} ${TILE_SIZE / 2} ${TILE_SIZE / 2})`}>
        <image href={`/tiles/${kind}.${ext}`} width={TILE_SIZE} height={TILE_SIZE} preserveAspectRatio="none" />
      </g>
    );
  }

  const half = TILE_SIZE / 2;
  const edges = openEdges(kind, rotation);
  const width = kind === "narrow-residential" ? NARROW_ROAD_WIDTH : ROAD_WIDTH;

  if (kind === "roundabout-center") {
    const outer = TILE_SIZE * 0.34;
    const inner = TILE_SIZE * 0.16;
    return (
      <g>
        <rect width={TILE_SIZE} height={TILE_SIZE} fill="var(--grass)" opacity="0.5" />
        {edges.map((e) => (
          <RoadArmToCenter key={e} bearing={e} width={ROAD_WIDTH} />
        ))}
        <circle cx={half} cy={half} r={outer} fill="var(--road)" />
        <circle cx={half} cy={half} r={inner} fill="var(--grass)" />
      </g>
    );
  }

  return (
    <g>
      <rect width={TILE_SIZE} height={TILE_SIZE} fill="var(--grass)" opacity="0.5" />
      {edges.map((e) => (
        <RoadArmToCenter key={e} bearing={e} width={width} />
      ))}
      {edges.length > 0 && <rect x={half - width / 2} y={half - width / 2} width={width} height={width} fill="var(--road)" />}
      {edges.map((e) => (
        <LaneMarking key={`m-${e}`} bearing={e} />
      ))}
    </g>
  );
}

/** A road strip from the tile's edge at `bearing` in to the center square —
 * always straight (curves are visual polish left for Fase 2's real art;
 * placeholder tiles favor "clearly composable" over "pretty"). */
function RoadArmToCenter({ bearing, width }: { bearing: number; width: number }) {
  const half = TILE_SIZE / 2;
  if (bearing === 0 || bearing === 180) {
    const y = bearing === 0 ? 0 : half;
    return <rect x={half - width / 2} y={y} width={width} height={half} fill="var(--road)" />;
  }
  const x = bearing === 270 ? 0 : half;
  return <rect x={x} y={half - width / 2} width={half} height={width} fill="var(--road)" />;
}

function LaneMarking({ bearing }: { bearing: number }) {
  const half = TILE_SIZE / 2;
  const common = { stroke: "var(--road-marking)", strokeWidth: 3, strokeDasharray: "10 10" };
  if (bearing === 0) return <line x1={half} y1={0} x2={half} y2={half - 12} {...common} />;
  if (bearing === 180) return <line x1={half} y1={half + 12} x2={half} y2={TILE_SIZE} {...common} />;
  if (bearing === 90) return <line x1={half + 12} y1={half} x2={TILE_SIZE} y2={half} {...common} />;
  return <line x1={0} y1={half} x2={half - 12} y2={half} {...common} />;
}

function actorGeometry(actor: GridActor): { x: number; y: number; rotation: number } {
  const center = {
    x: actor.position.cell.col * TILE_SIZE + TILE_SIZE / 2,
    y: actor.position.cell.row * TILE_SIZE + TILE_SIZE / 2,
  };
  if (actor.position.stage === "on-ring") {
    const ringBearing = actor.position.bearing + RING_LEAD_DEG;
    const { x, y } = pointOnBearing(center, ringBearing, RING_RADIUS);
    return { x, y, rotation: ringBearing - 90 };
  }
  const { x, y } = pointOnBearing(center, actor.position.bearing, APPROACH_RADIUS, LANE_OFFSET);
  return { x, y, rotation: actor.position.bearing + 180 };
}

export function GridScene({
  gridSize,
  tiles,
  signs = [],
  actors = [],
  selectedSlot,
  correctSlot,
  disabled,
  onSelect,
}: {
  gridSize: { cols: number; rows: number };
  tiles: GridTile[];
  /** Signs planted at a cell edge — same overlay idea as LocationScene's
   * `signs` prop, addressed by cell + bearing instead of a named slot. */
  signs?: { signId: SignId; cell: GridCell; bearing: Bearing }[];
  actors?: GridActor[];
  selectedSlot?: string | null;
  correctSlot?: string;
  disabled?: boolean;
  onSelect?: (slot: string) => void;
}) {
  const shadowFilterId = useId();
  const width = gridSize.cols * TILE_SIZE;
  const height = gridSize.rows * TILE_SIZE;

  return (
    <div className="w-full max-w-sm mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none rounded-3xl overflow-hidden">
        <defs>
          <filter id={shadowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>

        {tiles.map((t) => (
          <g key={`${t.cell.col}-${t.cell.row}`} transform={`translate(${t.cell.col * TILE_SIZE} ${t.cell.row * TILE_SIZE})`}>
            <TileArt kind={t.kind} rotation={t.rotation} />
          </g>
        ))}

        {signs.map((s, i) => {
          const center = { x: s.cell.col * TILE_SIZE + TILE_SIZE / 2, y: s.cell.row * TILE_SIZE + TILE_SIZE / 2 };
          // Beside the road, on the right-hand side of that approach's
          // direction of travel — same convention as every other scene's
          // sign placement (IntersectionScene's SIGN_POS, LocationScene's
          // MARKER_POS).
          // Same radius as an approaching actor but much further sideways
          // (not further out — that would push it past the tile edge), so
          // the sign icon and the car sprite have clear separation instead
          // of crowding each other.
          const { x, y } = pointOnBearing(center, s.bearing, APPROACH_RADIUS, LANE_OFFSET + 55);
          return (
            <g key={`${s.signId}-${i}`} transform={`translate(${x},${y})`}>
              <g transform="translate(-20,-20)">
                <SignIcon id={s.signId} size={40} />
              </g>
            </g>
          );
        })}

        {actors.map((actor) => {
          const geometry = actorGeometry(actor);
          const isSelected = selectedSlot === actor.id;
          const outcome = disabled && isSelected ? (actor.id === correctSlot ? "correct" : "incorrect") : null;
          const out = { x: geometry.x, y: geometry.y };
          return (
            <g key={actor.id} transform={`translate(${out.x} ${out.y})`}>
              {outcome && (
                <circle
                  r="34"
                  fill="none"
                  stroke={outcome === "correct" ? "var(--success-500)" : "var(--danger-500)"}
                  strokeWidth="4"
                  className="animate-pop-in"
                />
              )}
              <g transform={`rotate(${geometry.rotation})`}>
                <TrafficActor kind={actor.kind} color={actor.color} shadowFilterId={shadowFilterId} />
              </g>
              {actor.self && <SelfLabel dx={0} dy={-30} />}
              <circle
                r="30"
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
