import { describe, expect, it } from "vitest";
import { computeConfidenceAndLevel, decodeOutcomes, encodeOutcomes, MIN_ATTEMPTS_FOR_ANY_LEVEL, type Outcome } from "./mastery";

function outcomes(pattern: boolean[], difficulty = 1): Outcome[] {
  return pattern.map((correct) => ({ correct, difficulty }));
}

describe("computeConfidenceAndLevel", () => {
  it("reports insufficient data below the minimum attempt count", () => {
    const result = computeConfidenceAndLevel(outcomes(Array(MIN_ATTEMPTS_FOR_ANY_LEVEL - 1).fill(true)));
    expect(result).toEqual({ confidence: 0, level: 0, insufficientData: true });
  });

  it("gives 0 confidence for an all-wrong history at minimum volume", () => {
    const result = computeConfidenceAndLevel(outcomes(Array(20).fill(false)));
    expect(result.confidence).toBe(0);
    expect(result.level).toBe(0);
    expect(result.insufficientData).toBe(false);
  });

  it("only reaches level 5 with both high confidence and full volume", () => {
    const fullVolumeAllCorrect = computeConfidenceAndLevel(outcomes(Array(20).fill(true)));
    expect(fullVolumeAllCorrect.level).toBe(5);

    // Same accuracy, but under the volume target — confidence is scaled down
    // by volumeFactor, so it shouldn't reach level 5 yet.
    const lowVolumeAllCorrect = computeConfidenceAndLevel(outcomes(Array(6).fill(true)));
    expect(lowVolumeAllCorrect.level).toBeLessThan(5);
  });

  it("weights recent outcomes more heavily than older ones", () => {
    // Started weak, now doing well — recent performance should dominate.
    const improving = computeConfidenceAndLevel([...outcomes(Array(10).fill(false)), ...outcomes(Array(12).fill(true))]);
    // Started strong, now doing poorly — should score lower than `improving`
    // despite having the same overall correct/incorrect ratio.
    const regressing = computeConfidenceAndLevel([...outcomes(Array(10).fill(true)), ...outcomes(Array(12).fill(false))]);
    expect(improving.confidence).toBeGreaterThan(regressing.confidence);
  });

  it("weights harder questions more than easy ones in accuracy", () => {
    const hardCorrect = computeConfidenceAndLevel([
      ...outcomes(Array(19).fill(false), 1),
      { correct: true, difficulty: 5 },
    ]);
    const easyCorrect = computeConfidenceAndLevel([...outcomes(Array(19).fill(false), 1), { correct: true, difficulty: 1 }]);
    expect(hardCorrect.confidence).toBeGreaterThan(easyCorrect.confidence);
  });
});

describe("encodeOutcomes / decodeOutcomes", () => {
  it("round-trips a list of outcomes", () => {
    const original = outcomes([true, false, true], 3);
    const decoded = decodeOutcomes(encodeOutcomes(original));
    expect(decoded).toEqual(original);
  });

  it("caps encoded history at 30 entries, keeping the most recent", () => {
    const long = outcomes(Array(40).fill(true)).map((o, i) => ({ ...o, difficulty: i + 1 }));
    const decoded = decodeOutcomes(encodeOutcomes(long));
    expect(decoded).toHaveLength(30);
    expect(decoded[0].difficulty).toBe(11); // the oldest 10 were dropped
    expect(decoded[29].difficulty).toBe(40);
  });

  it("decodes an empty string as an empty list", () => {
    expect(decodeOutcomes("")).toEqual([]);
  });
});
