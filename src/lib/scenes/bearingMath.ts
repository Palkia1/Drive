/**
 * Shared geometry for every scene that places actors by compass bearing
 * around a center point (RoundaboutScene, LocationScene, GridScene) — a
 * single source of truth instead of near-identical copies drifting apart
 * (RoundaboutScene's and LocationScene's `outwardVector` + lane-offset math
 * were duplicated near-verbatim before this extraction).
 *
 * Convention: bearing 0 = north/up, increasing clockwise — same as compass
 * bearings and as every scene component in this codebase already assumes.
 */

/** Unit vector pointing outward (away from center) along a bearing. */
export function outwardVector(bearingDeg: number): { x: number; y: number } {
  const rad = (bearingDeg * Math.PI) / 180;
  return { x: Math.sin(rad), y: -Math.cos(rad) };
}

/** The lateral (perpendicular) unit vector for a right-hand-traffic lane
 * offset: rotating the outward vector 90° clockwise. An actor traveling
 * *inward* along `bearing` (i.e. approaching from that direction) belongs in
 * the lane on the right-hand side of its own direction of travel — offset it
 * by `-lateral * laneWidth` from the centerline point. */
export function lateralVector(out: { x: number; y: number }): { x: number; y: number } {
  return { x: -out.y, y: out.x };
}

/** A point `radius` units out from `center` along `bearing`, shifted
 * `laneOffset` units into the right-hand lane (0 = on the centerline). */
export function pointOnBearing(
  center: { x: number; y: number },
  bearing: number,
  radius: number,
  laneOffset = 0
): { x: number; y: number } {
  const out = outwardVector(bearing);
  const lateral = lateralVector(out);
  return {
    x: center.x + out.x * radius - lateral.x * laneOffset,
    y: center.y + out.y * radius - lateral.y * laneOffset,
  };
}
