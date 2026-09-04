import type { QuestionScene } from "@/lib/questions/types";

/** Strips the correct-answer field(s) before a scene is sent to the client. */
export function toClientScene(scene: QuestionScene): QuestionScene {
  switch (scene.kind) {
    case "SINGLE_CHOICE":
      return { ...scene, correctOptionId: "" };
    case "MULTIPLE_CHOICE":
      return { ...scene, correctOptionIds: [] };
    case "HOTSPOT":
      if (scene.sceneId === "intersection" || scene.sceneId === "traffic-light-intersection" || scene.sceneId === "roundabout") {
        return { ...scene, correctSlot: undefined as never };
      }
      return { ...scene, correctSignId: undefined as never };
    default:
      return scene;
  }
}
