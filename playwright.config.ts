import { defineConfig } from "@playwright/test";

// A committed, reusable smoke test (see e2e/practice-session.spec.ts) —
// replaces the throwaway verification scripts written ad hoc for every
// manual check this project used to rely on. Expects a dev/prod server
// already running and seeded (see e2e/README.md); doesn't manage the
// server or database itself, since seeding needs a real Postgres instance
// this config can't provision.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    headless: true,
  },
});
