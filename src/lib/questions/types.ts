// Shapes stored (as JSON) in Question.scene. Kept separate from Prisma types
// so both the seed script and the client renderer share one source of truth
// for "what does a question of type X look like".

export type ChoiceOption = {
  id: string;
  label: string;
  /** optional sign icon id, rendered instead of / next to the label */
  signId?: SignId;
};

export type SingleChoiceScene = {
  kind: "SINGLE_CHOICE";
  /** optional sign shown large above the prompt, e.g. for "wat betekent dit bord?" questions */
  promptSignId?: SignId;
  /** optional non-sign illustration shown large above the prompt (e.g. a
   * traffic-light asset from public/scenes/) — separate from promptSignId
   * because it isn't an RVV catalogue sign. */
  promptImageUrl?: string;
  /** optional real location background (see LocationId) with one or more
   * signs planted on it, shown large above the prompt — a modular
   * alternative to promptSignId's isolated icon for questions where the
   * sign matters in its road context (e.g. a zone-30 sign at a street
   * entrance) rather than in the abstract. Non-interactive: no actors, no
   * hotspot. */
  promptLocationScene?: { location: LocationId; signs: { signId: SignId; slot: LocationSlot }[] };
  /** optional tile-composed background (see GridHotspotScene) shown large
   * above the prompt, with optional signs planted on it — mirrors
   * promptLocationScene exactly, for a non-interactive illustration built
   * from the modular tile set instead of a fixed whole-scene background. */
  promptGridScene?: {
    gridSize: { cols: number; rows: number };
    tiles: GridTile[];
    signs?: { signId: SignId; cell: GridCell; bearing: Bearing }[];
  };
  options: ChoiceOption[];
  correctOptionId: string;
};

export type MultipleChoiceScene = {
  kind: "MULTIPLE_CHOICE";
  options: ChoiceOption[];
  correctOptionIds: string[];
};

/** A reusable, hand-drawn intersection scene with actors dropped into fixed slots. */
export type IntersectionSlot = "north" | "east" | "south" | "west";

export type IntersectionActor = {
  slot: IntersectionSlot;
  kind: "car" | "cyclist" | "pedestrian" | "truck";
  color?: string;
  /** direction of travel, used to orient the sprite / arrow */
  facing: "straight" | "left" | "right";
  /** Marks which actor represents the learner ("jij") — rendered with a
   * label so it's never ambiguous whose point of view the question is
   * asked from. At most one actor per scene should set this. */
  self?: boolean;
};

export type IntersectionHotspotScene = {
  kind: "HOTSPOT";
  sceneId: "intersection";
  /** The sign, and which road (slot) it's posted on — rendered beside that
   * specific approach rather than at a fixed screen position, so it's
   * unambiguous which direction of traffic it governs. */
  hasRightOfWaySign?: { kind: "priority-road" | "give-way" | "stop"; slot: IntersectionSlot } | null;
  actors: IntersectionActor[];
  correctSlot: IntersectionSlot;
  question: string;
};

/** A row of traffic signs; the learner taps the one being asked about. */
export type SignStripHotspotScene = {
  kind: "HOTSPOT";
  sceneId: "sign-strip";
  signs: SignId[];
  correctSignId: SignId;
};

export type TrafficLightState = "red" | "orange" | "green";

/** Same 4-arm layout and actors as IntersectionHotspotScene, but governed by
 * traffic lights instead of (or alongside) signs — a light overrides the
 * normal right-of-way rules for whoever it's facing. */
export type TrafficLightHotspotScene = {
  kind: "HOTSPOT";
  sceneId: "traffic-light-intersection";
  trafficLights: Partial<Record<IntersectionSlot, TrafficLightState>>;
  actors: IntersectionActor[];
  correctSlot: IntersectionSlot;
  question: string;
};

/** A roundabout with a configurable number of arms — generic enough to
 * render a standard 4-arm rotonde or, e.g., a 5-arm one, without new code
 * per layout. Arm 0 points north; others are spaced evenly clockwise. */
export type RoundaboutActor = {
  /** Unique within the scene — doubles as the answer "slot" id, since a
   * roundabout doesn't have a small fixed set of named slots like a
   * 4-way intersection does. */
  id: string;
  /** Which arm this actor is approaching from / crossing near. */
  arm: number;
  /** "approaching": still on the arm, not yet on the ring.
   * "on-ring": already circulating. */
  position: "approaching" | "on-ring";
  kind: "car" | "cyclist" | "pedestrian" | "truck";
  color?: string;
  self?: boolean;
};

export type RoundaboutHotspotScene = {
  kind: "HOTSPOT";
  sceneId: "roundabout";
  /** Number of roads meeting the roundabout (3-6 is realistic). */
  armCount: number;
  /** Visual only — how many concentric lanes the ring itself is drawn with. */
  ringLanes?: number;
  /** Arm indices where haaientanden (shark-teeth priority markings) are
   * painted at the cycle-path crossing — changes whether a cyclist on the
   * ring has priority over entering/exiting traffic at that arm. */
  sharkTeethArms?: number[];
  actors: RoundaboutActor[];
  correctSlot: string;
  question: string;
};

/** One of a fixed set of real, illustrated road layouts (public/scenes/) —
 * unlike IntersectionHotspotScene/RoundaboutHotspotScene, which draw a
 * schematic layout in code, these are traced from provided artwork, so the
 * set of locations and each one's valid slots is fixed rather than
 * parametric. */
export type LocationId =
  | "gelijkwaardige-kruising"
  | "doorgaande-weg-twee-zijwegen-zonder-naad"
  | "straat-van-rechts-stedelijk"
  | "eenbaansrotonde";

export type LocationSlot = "north" | "east" | "south" | "west";

export type LocationActor = {
  id: string;
  slot: LocationSlot;
  /** Roundabout only ("eenbaansrotonde") — ignored elsewhere. */
  position?: "approaching" | "on-ring";
  kind: "car" | "cyclist" | "pedestrian" | "truck";
  color?: string;
  self?: boolean;
};

export type LocationHotspotScene = {
  kind: "HOTSPOT";
  sceneId: "location";
  location: LocationId;
  /** Overlay one or more real catalogue signs beside specific approaches —
   * modular per question: any sign code, any slot, any count. Covers both
   * priority signs (for locations whose background doesn't already bake
   * priority into the road markings, e.g. "gelijkwaardige-kruising", which
   * is intentionally sign-free art) and any other contextual sign
   * (speed-zone signs, warning signs, ...). */
  signs?: { signId: SignId; slot: LocationSlot }[];
  /** Overlay the traffic-light asset beside a specific approach. */
  trafficLight?: { slot: LocationSlot; state: TrafficLightState } | null;
  actors: LocationActor[];
  correctSlot: string;
  question: string;
};

/** A cell address on a GridHotspotScene's tile grid, 0-indexed from the
 * top-left (col grows right, row grows down). */
export type GridCell = { col: number; row: number };

/** Compass bearing, 0 = north, clockwise — same convention as bearingMath.ts
 * and every other scene's position bearing (LocationScene's SLOT_BEARING,
 * RoundaboutScene's arm bearings). */
export type Bearing = 0 | 90 | 180 | 270;

/** A small, fixed, reusable set of road-tile illustrations (see
 * public/tiles/ once real art exists, src/lib/questions/priority.ts's
 * companion Fase-2 manifest) — the modular building blocks a GridHotspotScene
 * composes into a full road layout. Each is drawn once at canonical
 * rotation 0 and rotated by the renderer, never hand-drawn 4 times. */
export type TileKind =
  | "grass"
  | "straight"
  | "corner"
  | "t-junction"
  | "crossroad"
  | "roundabout-center"
  | "narrow-residential"
  | "wide-curve";

export type TileRotation = 0 | 90 | 180 | 270;

export type GridTile = { cell: GridCell; kind: TileKind; rotation: TileRotation };

export type GridActor = {
  id: string;
  kind: "car" | "cyclist" | "pedestrian" | "truck";
  color?: string;
  position: { cell: GridCell; bearing: Bearing; stage: "approaching" | "entering" | "on-ring" };
  /** Needed for the afslaand-verkeer priority rule (a turning actor yields
   * to oncoming traffic regardless of position bearing) — RoundaboutActor
   * and LocationActor never got this field; GridActor needs it since grid
   * scenes are expected to cover turning-traffic scenarios. */
  facing?: "straight" | "left" | "right";
  self?: boolean;
};

/** A tile-composed scene: a small grid of reusable road tiles with actors
 * placed by cell + bearing (see bearingMath.ts) instead of a per-background
 * hardcoded slot table — unlike LocationHotspotScene's fixed illustrations,
 * a new road layout here is a new combination of existing tiles, not a new
 * drawing. `correctSlot` is produced by `resolvePriority` (see
 * src/lib/questions/priority.ts) from the declared `priorityRule` at
 * authoring time — never hand-typed directly, except through that module's
 * `explicit` escape hatch. */
export type GridHotspotScene = {
  kind: "HOTSPOT";
  sceneId: "grid";
  gridSize: { cols: number; rows: number };
  tiles: GridTile[];
  /** Signs planted at a cell edge — mirrors LocationHotspotScene's `signs`,
   * addressed by cell + bearing instead of a named slot. */
  signs?: { signId: SignId; cell: GridCell; bearing: Bearing }[];
  actors: GridActor[];
  /** The declared traffic-priority rule (see priority.ts's PriorityRule) —
   * kept on the scene, not just used transiently at seed time, so the
   * beta-review portal can show *why* `correctSlot` is what it is, and so
   * it can be re-derived and cross-checked at any point, not only once at
   * authoring time. Typed as `unknown` here (rather than importing
   * PriorityRule) to keep this schema module free of a dependency on the
   * rule-resolution module; callers that need to resolve it import
   * PriorityRule from priority.ts and cast/validate there. */
  priorityRule: unknown;
  correctSlot: string;
  question: string;
};

export type QuestionScene =
  | SingleChoiceScene
  | MultipleChoiceScene
  | IntersectionHotspotScene
  | SignStripHotspotScene
  | TrafficLightHotspotScene
  | RoundaboutHotspotScene
  | LocationHotspotScene
  | GridHotspotScene;

/**
 * A sign id is an official RVV code (see signCatalogue.ts), optionally with a
 * number suffix for parametrized signs (e.g. "A1-50"). A plain `string`
 * (rather than a giant literal union) is the right type here precisely
 * because of those numeric suffixes: no finite union could express "any A1
 * code with any speed number" without losing that check.
 */
export type SignId = string;
