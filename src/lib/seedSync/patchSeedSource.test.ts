import { describe, expect, it } from "vitest";
import { injectMissingSeedIds, patchQuestionBySeedId } from "./patchSeedSource";

const FIXTURE = `
const QUESTIONS: SeedQuestion[] = [
  {
    topic: "voorrang",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Origineel?",
    explanation: "Uitleg.",
    scene: {
      kind: "SINGLE_CHOICE",
      options: [{ id: "a", label: "Ja" }],
      correctOptionId: "a",
    },
  },
  {
    seedId: "sq-0002",
    topic: "snelheid",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Al genummerd?",
    explanation: "Blijft staan.",
    scene: { kind: "SINGLE_CHOICE", options: [], correctOptionId: "a" },
  },
];
`;

describe("injectMissingSeedIds", () => {
  it("adds a seedId only to entries missing one, continuing after the highest existing number", () => {
    const { text, added } = injectMissingSeedIds(FIXTURE);
    expect(added).toBe(1);
    expect(text).toContain('seedId: "sq-0003"');
    // the entry that already had an id is untouched
    expect(text.match(/seedId: "sq-0002"/g)).toHaveLength(1);
  });

  it("is idempotent — a second run adds nothing", () => {
    const first = injectMissingSeedIds(FIXTURE).text;
    const second = injectMissingSeedIds(first);
    expect(second.added).toBe(0);
    expect(second.text).toBe(first);
  });

  it("leaves every other character of the source untouched", () => {
    const { text } = injectMissingSeedIds(FIXTURE);
    const withoutInsertedLines = text
      .split("\n")
      .filter((line) => !line.trim().startsWith('seedId: "sq-0003"'))
      .join("\n");
    expect(withoutInsertedLines).toBe(FIXTURE);
  });
});

describe("patchQuestionBySeedId", () => {
  const withIds = injectMissingSeedIds(FIXTURE).text;

  it("rewrites prompt and explanation for the matching entry only", () => {
    const { text, found, changed } = patchQuestionBySeedId(withIds, "sq-0002", {
      prompt: "Nieuwe vraag?",
      explanation: "Nieuwe uitleg.",
    });
    expect(found).toBe(true);
    expect(changed).toBe(true);
    expect(text).toContain('prompt: "Nieuwe vraag?"');
    expect(text).toContain('explanation: "Nieuwe uitleg."');
    // the other entry's prompt is untouched
    expect(text).toContain('prompt: "Origineel?"');
  });

  it("rewrites the scene as valid JSON-in-TS", () => {
    const { text } = patchQuestionBySeedId(withIds, "sq-0002", {
      scene: { kind: "SINGLE_CHOICE", options: [{ id: "b", label: "Nee" }], correctOptionId: "b" },
    });
    expect(text).toContain('"correctOptionId": "b"');
  });

  it("adds an archived:true flag when discarding, without a pre-existing archived field", () => {
    const { text, changed } = patchQuestionBySeedId(withIds, "sq-0002", { archived: true });
    expect(changed).toBe(true);
    expect(text).toContain("archived: true");
  });

  it("flips an existing archived flag in place instead of duplicating it", () => {
    const once = patchQuestionBySeedId(withIds, "sq-0002", { archived: true }).text;
    const twice = patchQuestionBySeedId(once, "sq-0002", { archived: false });
    expect(twice.text.match(/archived:/g)).toHaveLength(1);
    expect(twice.text).toContain("archived: false");
  });

  it("returns found:false for an unknown seedId instead of throwing", () => {
    const result = patchQuestionBySeedId(withIds, "sq-9999", { prompt: "x" });
    expect(result.found).toBe(false);
    expect(result.text).toBe(withIds);
  });

  it("reports changed:false when nothing in the patch differs", () => {
    // no fields provided at all — nothing to change
    const result = patchQuestionBySeedId(withIds, "sq-0002", {});
    expect(result.found).toBe(true);
    expect(result.changed).toBe(false);
  });
});
