import { test, expect } from "@playwright/test";

/**
 * Visual regression tests.
 * Uses Playwright's built-in screenshot comparison (pixelmatch).
 * Run `npm run test:update` to regenerate baselines.
 *
 * Baselines are stored in tests/visual-regression.spec.ts-snapshots/
 */

test.describe("Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("test harness page screenshot", async ({ page }) => {
    await page.goto("/test");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("test-harness.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("intro screen screenshot", async ({ page }) => {
    await page.goto("/");
    // Wait for the intro screen to render
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("intro-screen.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("unit placement step board screenshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => !!(window as any).__KOMBASS_TEST_API__, { timeout: 15000 });

    // Load a scenario to populate units, flags, and board size
    await page.evaluate(() =>
      (window as any).__KOMBASS_TEST_API__.loadScenario("basic_melee")
    );

    // Force placement phase
    await page.evaluate(() =>
      (window as any).__KOMBASS_TEST_API__.setStep(-1)
    );

    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("placement-phase-board.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("game movement step board screenshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => !!(window as any).__KOMBASS_TEST_API__, { timeout: 15000 });

    // Load same scenario
    await page.evaluate(() =>
      (window as any).__KOMBASS_TEST_API__.loadScenario("basic_melee")
    );

    // Force movement phase (step 0 = first unit moving)
    await page.evaluate(() =>
      (window as any).__KOMBASS_TEST_API__.setStep(0)
    );

    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("game-movement-phase-board.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("scenario loaded — combat phase board screenshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => !!(window as any).__KOMBASS_TEST_API__, { timeout: 15000 });

    // Load a scenario
    await page.evaluate(() =>
      (window as any).__KOMBASS_TEST_API__.loadScenario("basic_melee")
    );

    // Wait for React to re-render
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("combat-phase-board.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});
