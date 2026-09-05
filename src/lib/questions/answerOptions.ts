import type { QuestionScene } from "./types";

export type AnswerOption = { value: string; label: string };

const ACTOR_LABEL: Record<string, string> = { car: "Auto", cyclist: "Fietser", pedestrian: "Voetganger", truck: "Vrachtwagen" };
const SLOT_LABEL: Record<string, string> = { north: "noord", east: "oost", south: "zuid", west: "west" };
const BEARING_LABEL: Record<number, string> = { 0: "noord", 90: "oost", 180: "zuid", 270: "west" };
const STAGE_LABEL: Record<string, string> = { "on-ring": "op de rotonde", entering: "rijdt in", approaching: "nadert" };

function actorLabel(kind: string) {
  return ACTOR_LABEL[kind] ?? kind;
}
function slotLabel(slot: string) {
  return SLOT_LABEL[slot] ?? slot;
}

/** For HOTSPOT scenes, the set of valid "correct answer" choices a beta
 * tester can pick from in the review portal, and which scene field the
 * choice writes to. Returns null for SINGLE_CHOICE/MULTIPLE_CHOICE, which
 * have their own option-editing UI (label + correct flag per option). */
export function getHotspotAnswerOptions(
  scene: QuestionScene
): { field: "correctSlot" | "correctSignId"; options: AnswerOption[] } | null {
  if (scene.kind !== "HOTSPOT") return null;
  switch (scene.sceneId) {
    case "intersection":
    case "traffic-light-intersection":
      return {
        field: "correctSlot",
        options: scene.actors.map((a) => ({
          value: a.slot,
          label: `${actorLabel(a.kind)} (${slotLabel(a.slot)})${a.self ? " — jij" : ""}`,
        })),
      };
    case "roundabout":
      return {
        field: "correctSlot",
        options: scene.actors.map((a) => ({
          value: a.id,
          label: `${actorLabel(a.kind)} (arm ${a.arm}, ${a.position === "on-ring" ? "op de rotonde" : "nadert"})${a.self ? " — jij" : ""}`,
        })),
      };
    case "location":
      return {
        field: "correctSlot",
        options: scene.actors.map((a) => ({
          value: a.id,
          label: `${actorLabel(a.kind)} (${slotLabel(a.slot)}${a.position ? `, ${a.position === "on-ring" ? "op de rotonde" : "nadert"}` : ""})${a.self ? " — jij" : ""}`,
        })),
      };
    case "grid":
      return {
        field: "correctSlot",
        options: scene.actors.map((a) => ({
          value: a.id,
          label: `${actorLabel(a.kind)} (cel ${a.position.cell.col},${a.position.cell.row}, ${BEARING_LABEL[a.position.bearing] ?? a.position.bearing}, ${STAGE_LABEL[a.position.stage] ?? a.position.stage})${a.self ? " — jij" : ""}`,
        })),
      };
    case "sign-strip":
      return { field: "correctSignId", options: scene.signs.map((s) => ({ value: s, label: s })) };
    default:
      return null;
  }
}
