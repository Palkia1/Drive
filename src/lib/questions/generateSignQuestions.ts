/**
 * Procedurally builds sign-recognition practice questions from SIGN_CATALOGUE
 * — one "which meaning matches this sign" and one "which sign matches this
 * meaning" per catalogue entry, each a 4-option single-choice question with
 * 3 random distractors drawn from the rest of the catalogue.
 *
 * Kept separate from the catalogue itself (rather than hand-written seed
 * content) so every sign added to public/signs/ + signCatalogue.ts
 * automatically gets both practice directions for free — no seed-content
 * upkeep per sign.
 */
import { SIGN_CATALOGUE, type SignCatalogueEntry } from "./signCatalogue";
import type { SingleChoiceScene } from "./types";

// The three numeric-family codes have no real art under their bare code —
// only concrete numbered files exist (A1-50.svg etc). Point at one of those
// so the icon renders a real sign instead of a "--" placeholder.
const REPRESENTATIVE_ID: Record<string, string> = {
  A1: "A1-50",
  A2: "A2-50",
  A5: "A5-50",
};

function idFor(entry: SignCatalogueEntry): string {
  return REPRESENTATIVE_ID[entry.code] ?? entry.code;
}

// Small seeded PRNG (mulberry32) keyed by sign code, so distractor picks and
// option order are stable across repeated `npm run db:seed` runs instead of
// churning on every reseed.
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const OPTION_IDS = ["a", "b", "c", "d"];

export type GeneratedSignQuestion = {
  topic: "bord-naar-betekenis" | "betekenis-naar-bord";
  type: "SINGLE_CHOICE";
  difficulty: number;
  prompt: string;
  explanation: string;
  scene: SingleChoiceScene;
};

export function generateSignQuestions(): GeneratedSignQuestion[] {
  const out: GeneratedSignQuestion[] = [];

  for (const entry of SIGN_CATALOGUE) {
    const rng = mulberry32(hashString(entry.code));
    const distractors = shuffle(
      SIGN_CATALOGUE.filter((e) => e.code !== entry.code),
      rng
    ).slice(0, 3);
    const choices = shuffle([entry, ...distractors], rng);
    const correctIndex = choices.indexOf(entry);

    // Sign shown → pick the matching meaning.
    out.push({
      topic: "bord-naar-betekenis",
      type: "SINGLE_CHOICE",
      difficulty: 2,
      prompt: "Wat betekent dit verkeersbord?",
      explanation: `${entry.code} — ${entry.name}: ${entry.definition}`,
      scene: {
        kind: "SINGLE_CHOICE",
        promptSignId: idFor(entry),
        options: choices.map((c, i) => ({ id: OPTION_IDS[i], label: c.definition })),
        correctOptionId: OPTION_IDS[correctIndex],
      },
    });

    // Meaning shown → pick the matching sign.
    const signChoices = shuffle([entry, ...distractors], rng);
    const signCorrectIndex = signChoices.indexOf(entry);
    out.push({
      topic: "betekenis-naar-bord",
      type: "SINGLE_CHOICE",
      difficulty: 2,
      prompt: entry.definition,
      explanation: `Dit is bord ${entry.code} (${entry.name}).`,
      scene: {
        kind: "SINGLE_CHOICE",
        options: signChoices.map((c, i) => ({ id: OPTION_IDS[i], label: "", signId: idFor(c) })),
        correctOptionId: OPTION_IDS[signCorrectIndex],
      },
    });
  }

  return out;
}
