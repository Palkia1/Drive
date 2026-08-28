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

/**
 * A sign id is an official RVV code (see signCatalogue.ts), optionally with a
 * number suffix for parametrized signs (e.g. "A1-50"). A plain `string`
 * (rather than a giant literal union) is the right type here precisely
 * because of those numeric suffixes: no finite union could express "any A1
 * code with any speed number" without losing that check.
 */
export type SignId = string;
