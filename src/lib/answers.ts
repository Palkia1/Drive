import type { QuestionScene } from "@/lib/questions/types";

export type SubmittedAnswer =
  | { kind: "SINGLE_CHOICE"; optionId: string }
  | { kind: "MULTIPLE_CHOICE"; optionIds: string[] }
  | { kind: "HOTSPOT_SLOT"; slot: string }
  | { kind: "HOTSPOT_SIGN"; signId: string };

export function checkAnswer(scene: QuestionScene, answer: SubmittedAnswer): boolean {
  if (scene.kind === "SINGLE_CHOICE" && answer.kind === "SINGLE_CHOICE") {
    return answer.optionId === scene.correctOptionId;
  }
  if (scene.kind === "MULTIPLE_CHOICE" && answer.kind === "MULTIPLE_CHOICE") {
    const a = [...answer.optionIds].sort();
    const b = [...scene.correctOptionIds].sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  if (scene.kind === "HOTSPOT" && scene.sceneId === "intersection" && answer.kind === "HOTSPOT_SLOT") {
    return answer.slot === scene.correctSlot;
  }
  if (scene.kind === "HOTSPOT" && scene.sceneId === "traffic-light-intersection" && answer.kind === "HOTSPOT_SLOT") {
    return answer.slot === scene.correctSlot;
  }
  if (scene.kind === "HOTSPOT" && scene.sceneId === "roundabout" && answer.kind === "HOTSPOT_SLOT") {
    return answer.slot === scene.correctSlot;
  }
  if (scene.kind === "HOTSPOT" && scene.sceneId === "location" && answer.kind === "HOTSPOT_SLOT") {
    return answer.slot === scene.correctSlot;
  }
  if (scene.kind === "HOTSPOT" && scene.sceneId === "sign-strip" && answer.kind === "HOTSPOT_SIGN") {
    return answer.signId === scene.correctSignId;
  }
  return false;
}
