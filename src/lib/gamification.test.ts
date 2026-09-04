import { describe, expect, it } from "vitest";
import { levelForTotalXp } from "./gamification";

// Exercises the leveling curve (200 + (level-1)*60 XP per level) indirectly
// through levelForTotalXp, since xpForLevel itself isn't exported.
describe("levelForTotalXp", () => {
  it("starts at level 1 with 0 XP", () => {
    expect(levelForTotalXp(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNextLevel: 200 });
  });

  it("stays at level 1 just under the threshold", () => {
    expect(levelForTotalXp(199)).toEqual({ level: 1, xpIntoLevel: 199, xpForNextLevel: 200 });
  });

  it("levels up exactly at the threshold", () => {
    expect(levelForTotalXp(200)).toEqual({ level: 2, xpIntoLevel: 0, xpForNextLevel: 260 });
  });

  it("carries leftover XP into the new level", () => {
    expect(levelForTotalXp(459)).toEqual({ level: 2, xpIntoLevel: 259, xpForNextLevel: 260 });
  });

  it("can cross two level boundaries at once", () => {
    expect(levelForTotalXp(460)).toEqual({ level: 3, xpIntoLevel: 0, xpForNextLevel: 320 });
  });

  it("never returns a level below 1", () => {
    expect(levelForTotalXp(0).level).toBeGreaterThanOrEqual(1);
  });
});
