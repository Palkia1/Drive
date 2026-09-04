import { test, expect } from "@playwright/test";

// End-to-end smoke test for the core loop: log in, start a topic session,
// answer through it, land on results. Uses the "Snelheid" topic specifically
// because it's entirely SINGLE_CHOICE content (button-based options) — the
// HOTSPOT scene types (sign-strip, intersection, roundabout) render as
// clickable SVG rather than <button>s and aren't exercised here; that's
// covered by manual visual verification when those scenes change.
test("register, log in, complete a topic practice session", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto("/registreren", { waitUntil: "networkidle" });
  const demoModalBtn = page.locator('button:has-text("Begrepen")');
  if (await demoModalBtn.count()) await demoModalBtn.first().click({ timeout: 5000 }).catch(() => {});

  await page.fill('input[placeholder="Naam"]', "E2E Test");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "e2e-test-password");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 15000 });

  await page.goto("/app/oefenen");
  await page.click("text=Onderwerp kiezen");
  await page.click('button:has-text("Snelheid")');
  await page.click('button:has-text("Start")');
  await page.waitForURL(/\/app\/sessie/, { timeout: 10000 });

  for (let i = 0; i < 10; i++) {
    const bodyText = await page.locator("main").innerText();
    if (/Sessie voltooid/i.test(bodyText)) break;

    // Answer options are plain text buttons; icon-only utility buttons
    // (close, bookmark) carry an aria-label and no visible text, so
    // excluding those — rather than trying to text-match every one of
    // them — is what actually keeps this from clicking "Sluiten" first.
    // Short timeout + swallow: if the session finished between the check
    // above and this click (e.g. mid "Resultaat berekenen..." transition),
    // there's briefly no valid option button — let the loop come back
    // around and re-check for "Sessie voltooid" instead of hanging for
    // the test's full default timeout.
    const option = page.locator("main button:not([aria-label])").filter({ hasNotText: /Volgende|Terug|Stoppen|Nog een sessie/i }).first();
    await option.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(900);
  }

  await expect(page.locator("main")).toContainText("Sessie voltooid", { timeout: 5000 });
});
