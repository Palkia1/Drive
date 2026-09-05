import { describe, expect, it, beforeEach } from "vitest";
import { resolvePriority, explicitRuleUsages, type PriorityActor, type PriorityRule } from "./priority";

// Position-bearing convention throughout: 0=north, 90=east, 180=south,
// 270=west — same as LocationScene's SLOT_BEARING. An actor "at bearing P"
// is positioned/approaching from P and heading P+180 into the junction.
const N = 0,
  E = 90,
  S = 180,
  W = 270;

describe("resolvePriority — voorrang-van-rechts", () => {
  const rule = { type: "voorrang-van-rechts" } as const;

  // Real seed content, transcribed verbatim from prisma/seed.ts so this
  // test fails if the resolver's geometry ever disagrees with shipped
  // content — this is the regression test for the backwards-priority bug.
  it("matches sq-0001 (intersection: south beats west)", () => {
    const actors: PriorityActor[] = [
      { id: "south", bearing: S },
      { id: "west", bearing: W },
    ];
    expect(resolvePriority(rule, actors)).toBe("south");
  });

  it("matches sq-0013 (gelijkwaardige-kruising: north/'you' beats east)", () => {
    const actors: PriorityActor[] = [
      { id: "you", bearing: N },
      { id: "other-car", bearing: E },
    ];
    expect(resolvePriority(rule, actors)).toBe("you");
  });

  it("matches sq-0011 (T-splitsing: side-street-car (east) beats you (south))", () => {
    const actors: PriorityActor[] = [
      { id: "you", bearing: S },
      { id: "side-street-car", bearing: E },
    ];
    expect(resolvePriority(rule, actors)).toBe("side-street-car");
  });

  it("resolves a full 4-way crossing with no ambiguity", () => {
    const actors: PriorityActor[] = [
      { id: "north", bearing: N },
      { id: "east", bearing: E },
      { id: "south", bearing: S },
      { id: "west", bearing: W },
    ];
    // Each yields to the one 90° clockwise of it, so exactly one has no
    // incoming yield edge... except in a symmetric 4-way with everyone
    // present, every actor yields to exactly one other and is yielded to
    // by exactly one other, forming a 4-cycle — genuinely ambiguous in
    // real life too (this is why 4-way unsigned junctions with all sides
    // occupied are a known edge case), so this must throw rather than
    // guess.
    expect(() => resolvePriority(rule, actors)).toThrow(/ambiguous/);
  });

  it("throws for an empty actor list", () => {
    expect(() => resolvePriority(rule, [])).toThrow(/no actors/);
  });
});

describe("resolvePriority — priority-road", () => {
  it("matches sq-0005 (priority road north/south, north wins over east)", () => {
    const rule: PriorityRule = { type: "priority-road", priorityBearings: [N, S] };
    const actors: PriorityActor[] = [
      { id: "north", bearing: N },
      { id: "east-self", bearing: E },
    ];
    expect(resolvePriority(rule, actors)).toBe("north");
  });

  it("throws when no actor is on the declared priority road", () => {
    const rule: PriorityRule = { type: "priority-road", priorityBearings: [N, S] };
    const actors: PriorityActor[] = [
      { id: "a", bearing: E },
      { id: "b", bearing: W },
    ];
    expect(() => resolvePriority(rule, actors)).toThrow(/priority road/);
  });

  it("throws when more than one actor is on the priority road", () => {
    const rule: PriorityRule = { type: "priority-road", priorityBearings: [N, S] };
    const actors: PriorityActor[] = [
      { id: "a", bearing: N },
      { id: "b", bearing: S },
    ];
    expect(() => resolvePriority(rule, actors)).toThrow(/ambiguous/);
  });
});

describe("resolvePriority — sign (verleen voorrang / stop)", () => {
  it("matches sq-0006 (give-way for south-self, east wins)", () => {
    const rule: PriorityRule = { type: "sign", governedBy: [{ actorId: "south-self", sign: "give-way" }] };
    const actors: PriorityActor[] = [
      { id: "south-self", bearing: S },
      { id: "east", bearing: E },
    ];
    expect(resolvePriority(rule, actors)).toBe("east");
  });

  it("matches sq-0007 (stop for west-self, north wins)", () => {
    const rule: PriorityRule = { type: "sign", governedBy: [{ actorId: "west-self", sign: "stop" }] };
    const actors: PriorityActor[] = [
      { id: "west-self", bearing: W },
      { id: "north", bearing: N },
    ];
    expect(resolvePriority(rule, actors)).toBe("north");
  });

  it("throws when nobody is left ungoverned", () => {
    const rule: PriorityRule = {
      type: "sign",
      governedBy: [
        { actorId: "a", sign: "stop" },
        { actorId: "b", sign: "stop" },
      ],
    };
    const actors: PriorityActor[] = [
      { id: "a", bearing: N },
      { id: "b", bearing: E },
    ];
    expect(() => resolvePriority(rule, actors)).toThrow();
  });
});

describe("resolvePriority — traffic-light", () => {
  it("matches sq-0010 (green beats red)", () => {
    const rule = { type: "traffic-light", lights: { north: "green", east: "red" } } as const;
    const actors: PriorityActor[] = [
      { id: "north", bearing: N },
      { id: "east", bearing: E },
    ];
    expect(resolvePriority(rule, actors)).toBe("north");
  });

  it("matches sq-0016 (only the red side is declared; the other, undeclared side is unblocked and wins)", () => {
    const rule = { type: "traffic-light", lights: { north: "red" } } as const;
    const actors: PriorityActor[] = [
      { id: "north", bearing: N },
      { id: "other-car", bearing: E },
    ];
    expect(resolvePriority(rule, actors)).toBe("other-car");
  });

  it("throws when both sides are unblocked (e.g. both green, or neither declared)", () => {
    const rule = { type: "traffic-light", lights: {} } as const;
    const actors: PriorityActor[] = [
      { id: "a", bearing: N },
      { id: "b", bearing: E },
    ];
    expect(() => resolvePriority(rule, actors)).toThrow(/ambiguous/);
  });
});

describe("resolvePriority — roundabout", () => {
  it("matches sq-0008/sq-0014 (on-ring beats approaching)", () => {
    const rule = { type: "roundabout" } as const;
    const actors: PriorityActor[] = [
      { id: "you", bearing: W, stage: "approaching" },
      { id: "ring-car", bearing: W, stage: "on-ring" },
    ];
    expect(resolvePriority(rule, actors)).toBe("ring-car");
  });

  it("grants priority to an approaching actor named in sharkTeethFor over a normal on-ring actor", () => {
    // A synthetic case the real seed content doesn't exercise (its shark-
    // teeth example already has the cyclist on-ring) — this covers the
    // branch where haaientanden grant priority to someone NOT already
    // on-ring, e.g. a cyclist crossing the entering arm.
    const rule: PriorityRule = { type: "roundabout", sharkTeethFor: ["cyclist"] };
    const actors: PriorityActor[] = [
      { id: "cyclist", bearing: W, stage: "entering" },
      { id: "car", bearing: W, stage: "approaching" },
    ];
    expect(resolvePriority(rule, actors)).toBe("cyclist");
  });

  it("throws when nobody is on-ring or shark-teeth-granted", () => {
    const rule = { type: "roundabout" } as const;
    const actors: PriorityActor[] = [
      { id: "a", bearing: N, stage: "approaching" },
      { id: "b", bearing: E, stage: "approaching" },
    ];
    expect(() => resolvePriority(rule, actors)).toThrow(/exactly one/);
  });
});

describe("resolvePriority — afslaand-verkeer", () => {
  it("the turning actor always yields to oncoming traffic", () => {
    const rule = { type: "afslaand-verkeer", turning: "left-turner", oncoming: "oncoming-car" } as const;
    const actors: PriorityActor[] = [
      { id: "left-turner", bearing: N },
      { id: "oncoming-car", bearing: S },
    ];
    expect(resolvePriority(rule, actors)).toBe("oncoming-car");
  });

  it("throws if either referenced actor id isn't in the scene", () => {
    const rule = { type: "afslaand-verkeer", turning: "ghost", oncoming: "oncoming-car" } as const;
    const actors: PriorityActor[] = [{ id: "oncoming-car", bearing: S }];
    expect(() => resolvePriority(rule, actors)).toThrow();
  });
});

describe("resolvePriority — voorrangsvoertuig", () => {
  it("the declared emergency vehicle always wins", () => {
    const rule = { type: "voorrangsvoertuig", actorId: "ambulance" } as const;
    const actors: PriorityActor[] = [
      { id: "ambulance", bearing: N },
      { id: "car", bearing: E },
    ];
    expect(resolvePriority(rule, actors)).toBe("ambulance");
  });
});

describe("resolvePriority — explicit escape hatch", () => {
  beforeEach(() => {
    explicitRuleUsages.length = 0;
  });

  it("returns the declared winner and records the usage for review", () => {
    const actors: PriorityActor[] = [
      { id: "a", bearing: N },
      { id: "b", bearing: E },
    ];
    const result = resolvePriority({ type: "explicit", winner: "a", reason: "edge case not yet modeled" }, actors);
    expect(result).toBe("a");
    expect(explicitRuleUsages).toEqual([{ winner: "a", reason: "edge case not yet modeled" }]);
  });

  it("throws when reason is empty", () => {
    const actors: PriorityActor[] = [{ id: "a", bearing: N }];
    expect(() => resolvePriority({ type: "explicit", winner: "a", reason: "  " }, actors)).toThrow(/reason/);
  });

  it("throws when winner isn't an actor in the scene", () => {
    const actors: PriorityActor[] = [{ id: "a", bearing: N }];
    expect(() => resolvePriority({ type: "explicit", winner: "ghost", reason: "x" }, actors)).toThrow();
  });
});
