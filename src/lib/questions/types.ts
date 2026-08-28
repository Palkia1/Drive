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
};

export type IntersectionHotspotScene = {
  kind: "HOTSPOT";
  sceneId: "intersection";
  hasRightOfWaySign?: "priority-road" | "give-way" | "stop" | null;
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

export type QuestionScene =
  | SingleChoiceScene
  | MultipleChoiceScene
  | IntersectionHotspotScene
  | SignStripHotspotScene;

export const SIGN_IDS = [
  "priorityRoad",
  "endPriorityRoad",
  "giveWay",
  "stop",
  "roundabout",
  "noEntry",
  "noOvertakingCars",
  "maxSpeed30",
  "maxSpeed50",
  "maxSpeed80",
  "endMaxSpeed",
  "compulsoryAheadOnly",
  "compulsoryCycleTrack",
  "pedestrianCrossing",
  "noParking",
  "noStoppingOrParking",
  "oneWay",
  "warningChildren",
  "warningSlipperyRoad",
  "warningRoadNarrows",
] as const;

export type SignId = (typeof SIGN_IDS)[number];
