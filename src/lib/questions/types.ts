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

export type QuestionScene =
  | SingleChoiceScene
  | MultipleChoiceScene
  | IntersectionHotspotScene
  | SignStripHotspotScene
  | TrafficLightHotspotScene
  | RoundaboutHotspotScene;

/**
 * A sign id is an official RVV code (see signCatalogue.ts), optionally with a
 * number suffix for parametrized signs (e.g. "A1-50"). A plain `string`
 * (rather than a giant literal union) is the right type here precisely
 * because of those numeric suffixes: no finite union could express "any A1
 * code with any speed number" without losing that check.
 */
export type SignId = string;
