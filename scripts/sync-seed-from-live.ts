// Folds beta-tester edits made in production (/app/beta) back into
// prisma/seed.ts, so they survive the next reseed instead of being wiped by
// it. Run this — then review the diff and commit — as a routine step
// whenever picking this project back up, or right after being told about
// portal activity. No token or credential needed beyond the existing
// SEED_KEY the seed endpoint already uses.
//
// Usage: SEED_KEY=... npx tsx scripts/sync-seed-from-live.ts [base-url]
import fs from "node:fs";
import path from "node:path";
import { patchQuestionBySeedId } from "../src/lib/seedSync/patchSeedSource";

const baseUrl = process.argv[2] ?? "https://drive-gray-delta.vercel.app";
const seedKey = process.env.SEED_KEY;
if (!seedKey) {
  console.error("Set SEED_KEY in the environment (same key /api/admin/seed uses).");
  process.exit(1);
}

type Patch = {
  seedId: string;
  prompt?: string;
  explanation?: string;
  scene?: unknown;
  archived?: boolean;
};

async function main() {
  const res = await fetch(`${baseUrl}/api/admin/beta-content?key=${encodeURIComponent(seedKey!)}`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${await res.text()}`);
  const { patches } = (await res.json()) as { patches: Patch[] };

  if (patches.length === 0) {
    console.log("Nothing to sync — no reviewed questions found.");
    return;
  }

  const seedPath = path.resolve(__dirname, "../prisma/seed.ts");
  let text = fs.readFileSync(seedPath, "utf8");
  let changedCount = 0;
  const notFound: string[] = [];

  for (const { seedId, ...fields } of patches) {
    const result = patchQuestionBySeedId(text, seedId, fields);
    if (!result.found) {
      notFound.push(seedId);
      continue;
    }
    if (result.changed) changedCount++;
    text = result.text;
  }

  fs.writeFileSync(seedPath, text);
  console.log(`Synced ${changedCount} of ${patches.length} reviewed question(s) into prisma/seed.ts.`);
  if (notFound.length) console.warn(`Warning: seedId(s) not found in seed.ts: ${notFound.join(", ")}`);
  console.log("Review with `git diff prisma/seed.ts`, then commit.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
