import type { TrafficLightState } from "./types";

/**
 * The traffic-priority rule vocabulary a scene author declares, resolved by
 * `resolvePriority` into the winning actor id — never hand-typed as
 * `correctSlot` directly (except through the explicit escape hatch below),
 * so a scene's picture and its graded answer can't silently disagree the
 * way a hand-typed `correctSlot` could (and, twice this session, did).
 */
export type PriorityRule =
  | { type: "voorrang-van-rechts" }
  | { type: "priority-road"; priorityBearings: [number, number] }
  | { type: "sign"; governedBy: { actorId: string; sign: "give-way" | "stop" }[] }
  | { type: "traffic-light"; lights: Record<string, TrafficLightState> }
  | { type: "roundabout"; sharkTeethFor?: string[] }
  | { type: "afslaand-verkeer"; turning: string; oncoming: string }
  | { type: "voorrangsvoertuig"; actorId: string }
  /** Escape hatch for a situation the rule vocabulary can't yet express.
   * `reason` is mandatory and surfaced to the beta-review queue — this is
   * the only path where a hand-typed winner can reach a scene at all. */
  | { type: "explicit"; winner: string; reason: string };

export type PriorityActor = {
  id: string;
  /** POSITION bearing — the compass direction this actor is approaching
   * from / located at (0 = north, clockwise), matching LocationScene's
   * `SLOT_BEARING` (north=0, east=90, south=180, west=270). NOT the
   * direction the actor is heading (that's this value + 180) — position
   * bearing is what every existing scene already stores per actor
   * (`slot`/`arm`), so callers can pass it straight through with no
   * conversion. */
  bearing: number;
  stage?: "approaching" | "entering" | "on-ring";
};

/** Every `explicit` rule resolved so far in this process — the seed loader
 * (or any other caller) can inspect this after a batch of `resolvePriority`
 * calls to print/flag which scenes used the hand-typed escape hatch. */
export const explicitRuleUsages: { winner: string; reason: string }[] = [];

function normalizeBearing(b: number): number {
  return ((b % 360) + 360) % 360;
}

/** Computes the winning actor id from a declared rule + actor geometry.
 * Throws (with a message naming the offending actors) on any ambiguous or
 * invalid configuration — meant to fail loudly at seed/build time rather
 * than silently produce a wrong-but-plausible answer. */
export function resolvePriority(rule: PriorityRule, actors: PriorityActor[]): string {
  if (actors.length === 0) throw new Error("resolvePriority: no actors given");
  const byId = new Map(actors.map((a) => [a.id, a]));

  switch (rule.type) {
    case "voorrang-van-rechts":
      return resolveVoorrangVanRechts(actors);

    case "priority-road": {
      const [a, b] = rule.priorityBearings.map(normalizeBearing);
      const onPriorityRoad = actors.filter((actor) => {
        const bearing = normalizeBearing(actor.bearing);
        return bearing === a || bearing === b;
      });
      if (onPriorityRoad.length === 0) {
        throw new Error(`resolvePriority: no actor is on the declared priority road (bearings ${a}/${b})`);
      }
      if (onPriorityRoad.length > 1) {
        throw new Error(
          `resolvePriority: priority-road rule is ambiguous — multiple actors on the priority road (${onPriorityRoad.map((a) => a.id).join(", ")})`
        );
      }
      return onPriorityRoad[0].id;
    }

    case "sign": {
      const governedIds = new Set(rule.governedBy.map((g) => g.actorId));
      const notGoverned = actors.filter((a) => !governedIds.has(a.id));
      if (notGoverned.length !== 1) {
        throw new Error(
          `resolvePriority: sign rule needs exactly one ungoverned actor to win, found ${notGoverned.length}`
        );
      }
      return notGoverned[0].id;
    }

    case "traffic-light": {
      // Red/orange always yields; anyone not held by such a light may go —
      // that covers both "everyone has a declared color" (sq-0010: green
      // beats red) and "only the actor who must stop has a light at all"
      // (sq-0016: a red light for one approach, nothing declared for the
      // other — the other isn't held by any light, so it's unblocked).
      const blocked = new Set(
        actors.filter((a) => rule.lights[a.id] === "red" || rule.lights[a.id] === "orange").map((a) => a.id)
      );
      const unblocked = actors.filter((a) => !blocked.has(a.id));
      if (unblocked.length !== 1) {
        throw new Error(
          `resolvePriority: traffic-light rule is ambiguous — expected exactly one actor not held by a red/orange light, found ${unblocked.length}`
        );
      }
      return unblocked[0].id;
    }

    case "roundabout": {
      const sharkTeethFor = new Set(rule.sharkTeethFor ?? []);
      const winners = actors.filter((a) => a.stage === "on-ring" || sharkTeethFor.has(a.id));
      if (winners.length !== 1) {
        throw new Error(
          `resolvePriority: roundabout rule needs exactly one actor on-ring or granted shark-teeth priority, found ${winners.length}`
        );
      }
      return winners[0].id;
    }

    case "afslaand-verkeer": {
      if (!byId.has(rule.turning) || !byId.has(rule.oncoming)) {
        throw new Error("resolvePriority: afslaand-verkeer rule references an actor id not in this scene");
      }
      return rule.oncoming;
    }

    case "voorrangsvoertuig": {
      if (!byId.has(rule.actorId)) {
        throw new Error("resolvePriority: voorrangsvoertuig rule references an actor id not in this scene");
      }
      return rule.actorId;
    }

    case "explicit": {
      if (!byId.has(rule.winner)) {
        throw new Error("resolvePriority: explicit rule's winner is not an actor id in this scene");
      }
      if (!rule.reason.trim()) {
        throw new Error("resolvePriority: explicit rule requires a non-empty reason");
      }
      explicitRuleUsages.push({ winner: rule.winner, reason: rule.reason });
      return rule.winner;
    }
  }
}

/** "Voorrang van rechts": a driver yields to traffic approaching from their
 * right-hand side. A driver positioned at (position-)bearing P is heading
 * P+180 (traveling toward the junction center); turning 90° clockwise from
 * that heading (a right turn) points toward bearing P+180+90 = P+270,
 * i.e. P-90 (mod 360) — so the actor "to A's right" is positioned at
 * bearing P_A-90, and A yields to B iff `B.bearing == A.bearing - 90`.
 * Builds the yield graph over all actors; the winner is whoever yields to
 * nobody (an empty outgoing yield-set) — not "nobody yields to them", the
 * inverse relation. More than one such actor, or none (a cycle, which a
 * real convex junction can't produce), is an authoring error. Verified by
 * hand against this app's own seed content (sq-0001, sq-0011–sq-0013) —
 * see priority.test.ts. */
function resolveVoorrangVanRechts(actors: PriorityActor[]): string {
  const yieldsTo = new Map<string, Set<string>>(); // actorId -> set of actorIds it must yield to
  for (const a of actors) yieldsTo.set(a.id, new Set());

  for (const a of actors) {
    for (const b of actors) {
      if (a.id === b.id) continue;
      if (normalizeBearing(b.bearing) === normalizeBearing(a.bearing - 90)) {
        yieldsTo.get(a.id)!.add(b.id);
      }
    }
  }

  // The winner is whoever yields to nobody (their own outgoing yield-set is
  // empty) — not "nobody yields to them", which is the inverse relation and
  // was this function's original (wrong) check.
  const yieldsToNobody = actors.filter((a) => yieldsTo.get(a.id)!.size === 0);
  if (yieldsToNobody.length !== 1) {
    throw new Error(
      `resolvePriority: voorrang-van-rechts is ambiguous for actors at bearings ${actors.map((a) => a.bearing).join(", ")} — expected exactly one actor with no one to its right, found ${yieldsToNobody.length}`
    );
  }
  return yieldsToNobody[0].id;
}
