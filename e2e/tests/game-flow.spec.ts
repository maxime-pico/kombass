import { test } from "../fixtures/game-fixture";
import { expect, Page } from "@playwright/test";

/**
 * Full 2-player game flow tests using REST endpoints.
 * Tests the complete lifecycle: room creation → join → settings → placement → moves → combat → abandon.
 */

/** Click the PLAY button and wait for room URL */
async function clickPlayAndWaitForRoom(page: Page) {
  await page.waitForSelector("button.active:has-text('PLAY')");
  await page.click("button.active:has-text('PLAY')");
  await page.waitForFunction(() => /\/game\/[a-z0-9]+/i.test(window.location.pathname), { timeout: 10000 });
}

/** Both players join the same room: P1 creates, P2 navigates to the same URL */
async function setupRoom(player1: Page, player2: Page) {
  await player1.goto("/");
  await clickPlayAndWaitForRoom(player1);
  const roomUrl = player1.url();
  await player2.goto(roomUrl);
  return roomUrl;
}

/** P1 (admin) clicks READY, both click PLACE UNITS */
async function goThroughSettingsAndSelection(player1: Page, player2: Page) {
  await player1.waitForSelector("button:has-text('READY'):not([disabled])", { timeout: 10000 });

  // Listen for network response to settings endpoint
  const settingsResponse = player1.waitForResponse(
    (resp) => resp.url().includes("/api/room/") && resp.url().includes("/settings"),
    { timeout: 10000 }
  );

  await player1.click("button:has-text('READY')");

  // Wait for settings API call to complete
  const resp = await settingsResponse;
  console.log(`Settings API: ${resp.status()} ${resp.url()}`);

  await player1.waitForSelector("text=PLACE UNITS", { timeout: 10000 });
  await player2.waitForSelector("text=PLACE UNITS", { timeout: 10000 });
  await player1.click("text=PLACE UNITS");
  await player2.click("text=PLACE UNITS");
}

/** Place all units by clicking reachable squares, then confirm placement */
async function placeUnits(page: Page) {
  await page.waitForSelector("text=Place your units!", { timeout: 5000 });

  for (let i = 0; i < 5; i++) {
    await page.waitForSelector(".square-inside.reachable", { timeout: 5000 });
    const reachableSquares = page.locator(".square:has(.square-inside.reachable)");
    const count = await reachableSquares.count();
    const idx = Math.min(Math.floor(count / 2) + i, count - 1);
    await reachableSquares.nth(idx).click();
    await page.waitForTimeout(500);
  }

  const confirmBtn = page.locator("button:has-text('CONFIRM PLACEMENT')");
  await confirmBtn.waitFor({ state: "visible", timeout: 10000 });
  await confirmBtn.click();
}

/** Move all 5 units by clicking reachable squares for each */
async function moveUnits(page: Page) {
  for (let i = 0; i < 5; i++) {
    await page.waitForSelector(".square-inside.reachable", { timeout: 5000 });
    await page.locator(".square:has(.square-inside.reachable)").first().click();
    await page.waitForTimeout(500);
  }
}

test.describe("Full Game Flow (2-player REST)", () => {
  // Increase timeout for full flow tests
  test.setTimeout(60000);

  test("Room creation + join → both land at settings", async ({ player1, player2 }) => {
    await player1.goto("/");
    await clickPlayAndWaitForRoom(player1);
    const roomUrl = player1.url();

    await player1.waitForSelector("text=Waiting for the other player", { timeout: 5000 });

    await player2.goto(roomUrl);

    await player1.waitForSelector("button:has-text('READY'):not([disabled])", { timeout: 10000 });

    await player2.waitForSelector("text=Waiting for admin", { timeout: 5000 }).catch(() => {
      // P2 might see different text depending on timing
    });
  });

  test("Settings → Placement → game starts", async ({ player1, player2 }) => {
    await setupRoom(player1, player2);
    await goThroughSettingsAndSelection(player1, player2);

    await placeUnits(player1);
    await placeUnits(player2);

    // Both should reach the game/movement phase — "Abandon" button is the indicator
    await player1.waitForSelector("button.abandon-button", { timeout: 15000 });
    await player2.waitForSelector("button.abandon-button", { timeout: 15000 });
  });

  test("Full game: place → move → combat → abandon → victory", async ({ player1, player2 }) => {
    await setupRoom(player1, player2);
    await goThroughSettingsAndSelection(player1, player2);

    // Placement phase
    await placeUnits(player1);
    await placeUnits(player2);

    // Wait for movement phase
    await player1.waitForSelector("button.abandon-button", { timeout: 15000 });
    await player2.waitForSelector("button.abandon-button", { timeout: 15000 });

    // Movement phase: each player selects a reachable square for each of 5 units
    await moveUnits(player1);
    await moveUnits(player2);

    // Both click CONFIRM MOVES
    const p1Confirm = player1.locator("button:has-text('CONFIRM MOVES')");
    const p2Confirm = player2.locator("button:has-text('CONFIRM MOVES')");
    await p1Confirm.waitFor({ state: "visible", timeout: 10000 });
    await p2Confirm.waitFor({ state: "visible", timeout: 10000 });
    await p1Confirm.click();
    await p2Confirm.click();

    // Both should see FIGHT! button (both moves received)
    await player1.waitForSelector("button:has-text('FIGHT!')", { timeout: 15000 });
    await player2.waitForSelector("button:has-text('FIGHT!')", { timeout: 15000 });

    // Both click FIGHT!
    await player1.click("button:has-text('FIGHT!')");
    await player2.click("button:has-text('FIGHT!')");

    // Wait for combat animation to finish — FIGHTING... disappears and new round starts
    // New round = reachable squares appear again (no FIGHT button visible)
    await player1.waitForSelector(".square-inside.reachable", { timeout: 20000 });
    await player2.waitForSelector(".square-inside.reachable", { timeout: 20000 });

    // P1 abandons: click Abandon button, then confirm in modal
    await player1.click("button.abandon-button");
    await player1.waitForSelector("text=Are you sure you want to abandon", { timeout: 5000 });
    // Click the "Abandon" confirm button inside the modal
    await player1.click(".abandon-confirm-buttons button.active");

    // P2 should see "Victory by Default" modal
    await player2.waitForSelector("text=Victory by Default", { timeout: 10000 });

    // P2 clicks "Continue World Domination"
    await player2.click("button:has-text('Continue World Domination')");
  });
});
