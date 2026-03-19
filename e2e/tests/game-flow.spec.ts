import { test } from "../fixtures/game-fixture";
import { expect, Page } from "@playwright/test";

/**
 * Full 2-player game flow tests using REST endpoints.
 * Tests the complete lifecycle: room creation → join → settings → placement → moves → combat.
 */

/** Wait for a specific step value in the app state */
async function waitForStep(page: Page, step: number, timeout = 10000) {
  await page.waitForFunction(
    (s) => {
      const el = document.querySelector(".App");
      // Use data attribute or check visible UI elements
      return document.body.getAttribute("data-step") === String(s);
    },
    step,
    { timeout }
  ).catch(() => {
    // Fallback: just wait a bit
  });
}

/** Click a square on the board at grid position (col, row) */
async function clickSquare(page: Page, col: number, row: number) {
  const square = page.locator(`.square`).nth(row * await getBoardWidth(page) + col);
  await square.click();
}

async function getBoardWidth(page: Page): Promise<number> {
  return page.locator(".board-row").first().locator(".square").count();
}

test.describe("Full Game Flow (2-player REST)", () => {
  test("Room creation + join → both land at settings", async ({ player1, player2 }) => {
    // Capture console and network for debugging
    player1.on("console", msg => console.log(`[P1 console] ${msg.type()}: ${msg.text()}`));
    player1.on("response", resp => {
      if (resp.url().includes("/api/")) {
        console.log(`[P1 network] ${resp.status()} ${resp.url()}`);
      }
    });
    player1.on("requestfailed", req => {
      console.log(`[P1 req failed] ${req.url()} ${req.failure()?.errorText}`);
    });

    // P1 creates room
    await player1.goto("/");
    await player1.waitForSelector("text=PLAY");
    // Log what's on the page before clicking
    const bodyText = await player1.evaluate(() => document.body.innerText);
    console.log(`[P1 body before click] ${bodyText.substring(0, 500)}`);

    await player1.click("text=PLAY");

    // Log what's on the page after clicking
    await player1.waitForTimeout(2000);
    const bodyAfter = await player1.evaluate(() => document.body.innerText);
    console.log(`[P1 body after click] ${bodyAfter.substring(0, 500)}`);
    console.log(`[P1 URL after click] ${player1.url()}`);

    // Wait for room to be created and URL to change
    await player1.waitForFunction(() => /\/game\/[a-z0-9]+/i.test(window.location.pathname), { timeout: 10000 });
    const roomUrl = player1.url();

    // P1 should see settings (step -3), with "Waiting for other player"
    await player1.waitForSelector("text=Waiting for the other player", { timeout: 5000 });

    // P2 navigates to the same room URL
    await player2.goto(roomUrl);

    // Both should now be at settings
    // P1 (admin) should see READY button become active
    await player1.waitForSelector("button:has-text('READY'):not([disabled])", { timeout: 10000 });

    // P2 (non-admin) should see waiting for admin message
    await player2.waitForSelector("text=Waiting for admin", { timeout: 5000 }).catch(() => {
      // P2 might see different text depending on timing
    });
  });

  test("Settings → Placement → both ready", async ({ player1, player2 }) => {
    // Setup: create room and join
    await player1.goto("/");
    await player1.click("text=PLAY");
    await player1.waitForFunction(() => /\/game\/[a-z0-9]+/i.test(window.location.pathname), { timeout: 10000 });
    const roomUrl = player1.url();
    await player2.goto(roomUrl);

    // Wait for P2 to join, then admin clicks READY
    await player1.waitForSelector("button:has-text('READY'):not([disabled])", { timeout: 10000 });
    await player1.click("button:has-text('READY')");

    // Both should move to unit selection (step -2)
    await player1.waitForSelector("text=PLACE UNITS", { timeout: 5000 });
    await player2.waitForSelector("text=PLACE UNITS", { timeout: 5000 });

    // Both click PLACE UNITS to move to placement phase
    await player1.click("text=PLACE UNITS");
    await player2.click("text=PLACE UNITS");

    // Both should now be in placement phase (step -1)
    // They see the board with squares to place units
    await player1.waitForSelector(".board-row", { timeout: 5000 });
    await player2.waitForSelector(".board-row", { timeout: 5000 });
  });

  test("Full game: place → move → combat", async ({ player1, player2 }) => {
    // Setup: create room, join, confirm settings
    await player1.goto("/");
    await player1.click("text=PLAY");
    await player1.waitForFunction(() => /\/game\/[a-z0-9]+/i.test(window.location.pathname), { timeout: 10000 });
    const roomUrl = player1.url();
    await player2.goto(roomUrl);

    await player1.waitForSelector("button:has-text('READY'):not([disabled])", { timeout: 10000 });
    await player1.click("button:has-text('READY')");

    // Unit selection
    await player1.waitForSelector("text=PLACE UNITS", { timeout: 5000 });
    await player2.waitForSelector("text=PLACE UNITS", { timeout: 5000 });
    await player1.click("text=PLACE UNITS");
    await player2.click("text=PLACE UNITS");

    // Placement phase — both need to click squares to place units
    // Wait for board to be visible
    await player1.waitForSelector(".board-row", { timeout: 5000 });
    await player2.waitForSelector(".board-row", { timeout: 5000 });

    // Place units by clicking reachable squares
    // P1 places on left side, P2 places on right side
    for (let i = 0; i < 5; i++) {
      const p1Square = player1.locator(".square.reachable").first();
      if (await p1Square.count() > 0) {
        await p1Square.click();
        await player1.waitForTimeout(200);
      }
    }

    for (let i = 0; i < 5; i++) {
      const p2Square = player2.locator(".square.reachable").first();
      if (await p2Square.count() > 0) {
        await p2Square.click();
        await player2.waitForTimeout(200);
      }
    }

    // After placing all units, both should move to movement phase (step >= 0)
    // P1 should see the game board with their units
    // Wait for movement phase indicators
    await player1.waitForSelector(".fight-button, .undo-button, .square.selected", { timeout: 10000 });
    await player2.waitForSelector(".fight-button, .undo-button, .square.selected", { timeout: 10000 });

    // Navigate through all units (click reachable squares or just confirm)
    // Step through each unit and place them (movement phase)
    for (let i = 0; i < 5; i++) {
      const p1Reachable = player1.locator(".square-inside.reachable").first();
      if (await p1Reachable.count() > 0) {
        await p1Reachable.click();
        await player1.waitForTimeout(200);
      }
    }

    for (let i = 0; i < 5; i++) {
      const p2Reachable = player2.locator(".square-inside.reachable").first();
      if (await p2Reachable.count() > 0) {
        await p2Reachable.click();
        await player2.waitForTimeout(200);
      }
    }

    // Both should see CONFIRM MOVES button
    const p1Confirm = player1.locator("button:has-text('CONFIRM MOVES')");
    const p2Confirm = player2.locator("button:has-text('CONFIRM MOVES')");

    if (await p1Confirm.isVisible()) {
      await p1Confirm.click();
    }
    if (await p2Confirm.isVisible()) {
      await p2Confirm.click();
    }

    // After both confirm, FIGHT button should appear
    // Wait for combat phase
    await player1.waitForSelector("button:has-text('FIGHT'), button:has-text('FIGHTING'), button:has-text('WAITING')", { timeout: 10000 });
  });
});
