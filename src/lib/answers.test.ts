import { describe, expect, it } from "vitest";
import { checkAnswer } from "./answers";
import type { QuestionScene } from "./questions/types";

describe("checkAnswer", () => {
  it("accepts the correct SINGLE_CHOICE option", () => {
    const scene: QuestionScene = {
      kind: "SINGLE_CHOICE",
      options: [
        { id: "a", label: "Fout" },
        { id: "b", label: "Goed" },
      ],
      correctOptionId: "b",
    };
    expect(checkAnswer(scene, { kind: "SINGLE_CHOICE", optionId: "b" })).toBe(true);
    expect(checkAnswer(scene, { kind: "SINGLE_CHOICE", optionId: "a" })).toBe(false);
  });

  it("matches MULTIPLE_CHOICE regardless of selection order", () => {
    const scene: QuestionScene = {
      kind: "MULTIPLE_CHOICE",
      options: [
        { id: "a", label: "" },
        { id: "b", label: "" },
        { id: "c", label: "" },
      ],
      correctOptionIds: ["a", "c"],
    };
    expect(checkAnswer(scene, { kind: "MULTIPLE_CHOICE", optionIds: ["c", "a"] })).toBe(true);
    expect(checkAnswer(scene, { kind: "MULTIPLE_CHOICE", optionIds: ["a"] })).toBe(false);
    expect(checkAnswer(scene, { kind: "MULTIPLE_CHOICE", optionIds: ["a", "b"] })).toBe(false);
  });

  it("checks the correct slot for an intersection HOTSPOT", () => {
    const scene: QuestionScene = {
      kind: "HOTSPOT",
      sceneId: "intersection",
      hasRightOfWaySign: null,
      actors: [
        { slot: "north", kind: "car", facing: "straight" },
        { slot: "south", kind: "car", facing: "straight" },
      ],
      correctSlot: "south",
      question: "Wie mag als eerste rijden?",
    };
    expect(checkAnswer(scene, { kind: "HOTSPOT_SLOT", slot: "south" })).toBe(true);
    expect(checkAnswer(scene, { kind: "HOTSPOT_SLOT", slot: "north" })).toBe(false);
  });

  it("checks the correct slot for a traffic-light-intersection HOTSPOT", () => {
    const scene: QuestionScene = {
      kind: "HOTSPOT",
      sceneId: "traffic-light-intersection",
      trafficLights: { north: "green", east: "red" },
      actors: [
        { slot: "north", kind: "car", facing: "straight" },
        { slot: "east", kind: "car", facing: "straight" },
      ],
      correctSlot: "north",
      question: "Wie mag rijden?",
    };
    expect(checkAnswer(scene, { kind: "HOTSPOT_SLOT", slot: "north" })).toBe(true);
    expect(checkAnswer(scene, { kind: "HOTSPOT_SLOT", slot: "east" })).toBe(false);
  });

  it("checks the correct slot for a roundabout HOTSPOT", () => {
    const scene: QuestionScene = {
      kind: "HOTSPOT",
      sceneId: "roundabout",
      armCount: 4,
      actors: [
        { id: "you", arm: 0, position: "approaching", kind: "car", self: true },
        { id: "ring-car", arm: 0, position: "on-ring", kind: "car" },
      ],
      correctSlot: "ring-car",
      question: "Wie mag als eerste rijden?",
    };
    expect(checkAnswer(scene, { kind: "HOTSPOT_SLOT", slot: "ring-car" })).toBe(true);
    expect(checkAnswer(scene, { kind: "HOTSPOT_SLOT", slot: "you" })).toBe(false);
  });

  it("checks the correct sign for a sign-strip HOTSPOT", () => {
    const scene: QuestionScene = {
      kind: "HOTSPOT",
      sceneId: "sign-strip",
      signs: ["B6", "B1", "B2", "B7"],
      correctSignId: "B2",
    };
    expect(checkAnswer(scene, { kind: "HOTSPOT_SIGN", signId: "B2" })).toBe(true);
    expect(checkAnswer(scene, { kind: "HOTSPOT_SIGN", signId: "B1" })).toBe(false);
  });

  it("rejects an answer kind that doesn't match the scene kind", () => {
    const scene: QuestionScene = {
      kind: "SINGLE_CHOICE",
      options: [{ id: "a", label: "" }],
      correctOptionId: "a",
    };
    expect(checkAnswer(scene, { kind: "HOTSPOT_SIGN", signId: "a" })).toBe(false);
  });
});
