// Backfills a `seedId` onto any prisma/seed.ts QUESTIONS entry that doesn't
// have one yet — needed for the beta-tester portal's GitHub sync
// (src/lib/seedSync) to find and patch that entry. Idempotent: re-run this
// any time after adding new hand-authored questions (`npx tsx
// scripts/inject-seed-ids.ts`); entries that already have an id are left
// alone.
import fs from "node:fs";
import path from "node:path";
import { injectMissingSeedIds } from "../src/lib/seedSync/patchSeedSource";

const seedPath = path.resolve(__dirname, "../prisma/seed.ts");
const original = fs.readFileSync(seedPath, "utf8");
const { text, added } = injectMissingSeedIds(original);
fs.writeFileSync(seedPath, text);
console.log(`Injected seedId into ${added} question(s).`);
