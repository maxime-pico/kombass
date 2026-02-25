import { test, expect } from "@playwright/test";

/**
 * Combat scenario tests — solo mode, no server needed.
 * Uses window.__KOMBASS_TEST_API__ to inject scenarios and verify results.
 */

test.describe("Combat Scenarios (solo mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for test API to be available
    await page.waitForFunction(() => !!(window as any).__KOMBASS_TEST_API__, { timeout: 15000 });
  });

  test("test API is available in test mode", async ({ page }) => {
    const hasAPI = await page.evaluate(() => !!(window as any).__KOMBASS_TEST_API__);
    expect(hasAPI).toBe(true);

    const scenarios = await page.evaluate(
      () => (window as any).__KOMBASS_TEST_API__.getScenarios()
    );
    expect(scenarios.length).toBeGreaterThan(0);
    expect(scenarios[0]).toHaveProperty("name");
    expect(scenarios[0]).toHaveProperty("description");
  });

  test("getScenarios returns all predefined scenarios", async ({ page }) => {
    const scenarios = await page.evaluate(
      () => (window as any).__KOMBASS_TEST_API__.getScenarios()
    );
    const names = scenarios.map((s: any) => s.name);
    expect(names).toContain("basic_melee");
    expect(names).toContain("heavy_vs_medium");
    expect(names).toContain("flag_zone_invincibility");
    expect(names).toContain("out_of_range");
  });

  test("loadScenario injects state into the app", async ({ page }) => {
    await page.evaluate(() =>
      (window as any).__KOMBASS_TEST_API__.loadScenario("basic_melee")
    );

    const state = await page.evaluate(
      () => (window as any).__KOMBASS_TEST_API__.getState()
    );
    expect(state.gameStarted).toBe(true);
    expect(state.step).toBeGreaterThan(0);
    expect(state.units[0][0]).toHaveProperty("strength", 2);
  });

  test("triggerCombat returns correct results for basic_melee", async ({ page }) => {
    await page.evaluate(() =>
      (window as any).__KOMBASS_TEST_API__.loadScenario("basic_melee")
    );

    const result = await page.evaluate(
      () => (window as any).__KOMBASS_TEST_API__.triggerCombat()
    );

    // Both Mediums should die (life = 0)
    expect(result.newFutureUnits[0][0].life).toBe(0);
    expect(result.newFutureUnits[1][0].life).toBe(0);
  });

  test("triggerCombat returns correct results for heavy_vs_medium", async ({ page }) => {
    await page.evaluate(() =>
      (window as any).__KOMBASS_TEST_API__.loadScenario("heavy_vs_medium")
    );

    const result = await page.evaluate(
      () => (window as any).__KOMBASS_TEST_API__.triggerCombat()
    );

    // Heavy survives at 1 life, Medium dies
    expect(result.newFutureUnits[0][0].life).toBe(1);
    expect(result.newFutureUnits[1][0].life).toBe(-1);
  });

  test("triggerCombat returns correct results for out_of_range", async ({ page }) => {
    await page.evaluate(() =>
      (window as any).__KOMBASS_TEST_API__.loadScenario("out_of_range")
    );

    const result = await page.evaluate(
      () => (window as any).__KOMBASS_TEST_API__.triggerCombat()
    );

    // No damage — both units survive
    expect(result.newFutureUnits[0][0].life).toBe(2);
    expect(result.newFutureUnits[1][0].life).toBe(2);
  });

  test("triggerCombat returns correct results for flag_zone_invincibility", async ({ page }) => {
    await page.evaluate(() =>
      (window as any).__KOMBASS_TEST_API__.loadScenario("flag_zone_invincibility")
    );

    const result = await page.evaluate(
      () => (window as any).__KOMBASS_TEST_API__.triggerCombat()
    );

    // Both survive — flag zone protection
    expect(result.newFutureUnits[0][0].life).toBe(2);
    expect(result.newFutureUnits[1][0].life).toBe(2);
  });

  test("setStep changes game phase", async ({ page }) => {
    await page.evaluate(() =>
      (window as any).__KOMBASS_TEST_API__.setStep(3)
    );

    const state = await page.evaluate(
      () => (window as any).__KOMBASS_TEST_API__.getState()
    );
    expect(state.step).toBe(3);
  });
});

test.describe("Test Harness UI (/test route)", () => {
  test("test harness page loads and shows scenarios", async ({ page }) => {
    await page.goto("/test");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Kombass Test Harness")).toBeVisible();
    await expect(page.getByRole("cell", { name: "basic_melee" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "heavy_vs_medium" })).toBeVisible();
  });

  test("Run All Scenarios button triggers tests and shows results", async ({ page }) => {
    await page.goto("/test");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /Run All Scenarios/ }).click();

    // Wait for results to appear
    await expect(page.getByText(/\d+\/\d+ passed/)).toBeVisible({ timeout: 10000 });

    // All scenarios should pass
    const resultText = await page.getByText(/\d+\/\d+ passed/).textContent();
    const match = resultText?.match(/(\d+)\/(\d+) passed/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe(match![2]); // all passed
  });
});
