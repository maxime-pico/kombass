import { test as base, Page, BrowserContext } from "@playwright/test";

interface KombassTestAPI {
  loadScenario(nameOrIndex: string | number): void;
  getState(): any;
  triggerCombat(): any;
  setStep(step: number): void;
  getScenarios(): Array<{ index: number; name: string; description: string }>;
}

/** Helper to get the test API from window */
async function getTestAPI(page: Page): Promise<KombassTestAPI> {
  const api = await page.evaluate(() => (window as any).__KOMBASS_TEST_API__);
  if (!api) throw new Error("__KOMBASS_TEST_API__ not found. Is REACT_APP_TEST_MODE=true?");
  return api;
}

/** Fixture providing a single page with the test API ready */
export const test = base.extend<{
  testPage: Page;
  player1: Page;
  player2: Page;
}>({
  testPage: async ({ page }, use) => {
    await page.goto("/");
    // Wait for React to mount
    await page.waitForFunction(() => !!(window as any).__KOMBASS_TEST_API__);
    await use(page);
  },

  player1: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/");
    await use(page);
    await context.close();
  },

  player2: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { getTestAPI };
export type { KombassTestAPI };
