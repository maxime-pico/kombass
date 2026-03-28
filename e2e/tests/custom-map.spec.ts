import { test } from "../fixtures/game-fixture";
import { expect, Page } from "@playwright/test";
import path from "path";

const TEST_MAP_PATH = path.resolve(__dirname, "../fixtures/test-map.json");

// Test map: 12×10 board, flags at (0,0) and (11,9), terrain wall down the middle.
// Default flags for a 12×10 board would be (0,5) and (11,5).
// By placing flags in corners we can distinguish custom flags from defaults.

/** Helper to get the .square child class from a square-container data-testid */
async function getSquareClass(page: Page, col: number, row: number) {
  // data-testid is on .square-container; .square is its first child
  const squareDiv = page.locator(`[data-testid="square-${col}-${row}"] > .square`);
  return squareDiv.getAttribute("class");
}

/** Both players join the same room */
async function setupRoom(player1: Page, player2: Page) {
  await player1.goto("/");
  await player1.waitForSelector("button.active:has-text('PLAY')");
  await player1.click("button.active:has-text('PLAY')");
  await player1.waitForFunction(() => /\/game\/[a-z0-9]+/i.test(window.location.pathname), { timeout: 10000 });
  const roomUrl = player1.url();
  await player2.goto(roomUrl);
  return roomUrl;
}

test.describe("Custom Map Import", () => {
  test.setTimeout(60000);

  test("Imported map sets correct board size, terrain, and flags for both players", async ({ player1, player2 }) => {
    await setupRoom(player1, player2);

    // Wait for P1 (admin) to see settings
    await player1.waitForSelector("button:has-text('READY'):not([disabled])", { timeout: 10000 });

    // P1 imports the test map
    const fileInput = player1.locator("input[type='file'][accept='.json']");
    await fileInput.setInputFiles(TEST_MAP_PATH);

    // Verify "using imported map" text appears
    await expect(player1.locator("text=using imported map")).toBeVisible({ timeout: 5000 });

    // Terrain slider should be disabled
    const terrainSlider = player1.locator("#settings input[type='number'][min='0'][max='30']");
    await expect(terrainSlider).toBeDisabled();

    // P1 clicks READY to confirm settings
    await player1.click("button:has-text('READY')");

    // Both players advance to unit selection
    await player1.waitForSelector("text=PLACE UNITS", { timeout: 10000 });
    await player2.waitForSelector("text=PLACE UNITS", { timeout: 10000 });
    await player1.click("text=PLACE UNITS");
    await player2.click("text=PLACE UNITS");

    // Both players should now see the placement phase with the custom board
    await player1.waitForSelector("text=Place your units", { timeout: 5000 });
    await player2.waitForSelector("text=Place your units", { timeout: 5000 });

    // Verify board dimensions: 12 columns × 10 rows = 120 squares
    for (const page of [player1, player2]) {
      const squareCount = await page.locator("[data-testid^='square-']").count();
      expect(squareCount).toBe(120);

      // --- Terrain verification ---
      const terrainPositions = [
        [5, 2], [5, 3], [5, 4], [6, 4], [6, 5], [6, 6], [5, 6], [5, 7],
      ];
      for (const [x, y] of terrainPositions) {
        const cls = await getSquareClass(page, x, y);
        expect(cls, `square (${x},${y}) should be terrain`).toContain("terrain");
      }

      // A non-terrain square should NOT have terrain class
      const clearCls = await getSquareClass(page, 3, 3);
      expect(clearCls).not.toContain("terrain");

      // --- Flag zone verification (the key regression test) ---
      // Flags are at (0,0) and (11,9). Default would be (0,5) and (11,5).
      // We assert on squares that are ONLY in zone for custom flags, not defaults.

      // (2,0) is Manhattan 2 from flag1 at (0,0) → should be in zone
      // (2,0) is Manhattan 7 from default flag1 at (0,5) → would NOT be in zone if defaults were used
      const customZone1 = await getSquareClass(page, 2, 0);
      expect(customZone1, "square (2,0) should be in flag zone for flag at (0,0)").toContain("flag-zone");

      // (11,7) is Manhattan 2 from flag2 at (11,9) → should be in zone
      // (11,7) is Manhattan 2 from default flag2 at (11,5) → would also be in zone — pick a better one
      // (9,9) is Manhattan 2 from flag2 at (11,9) → should be in zone
      // (9,9) is Manhattan 6 from default flag2 at (11,5) → would NOT be in zone if defaults were used
      const customZone2 = await getSquareClass(page, 9, 9);
      expect(customZone2, "square (9,9) should be in flag zone for flag at (11,9)").toContain("flag-zone");

      // Verify default flag positions are NOT flag zones (proves defaults were overridden)
      // (0,5) is the default flag1 position. Manhattan distance from (0,0) = 5 → NOT in zone.
      // So (0,5) itself might still be flag-zone if another flag is nearby — let's check (2,5):
      // (2,5) is Manhattan 7 from (0,0) and Manhattan 6 from (11,9) → not in either custom zone
      // (2,5) is Manhattan 2 from default (0,5) → WOULD be in zone if defaults were used
      const defaultZoneSquare = await getSquareClass(page, 2, 5);
      expect(defaultZoneSquare, "square (2,5) should NOT be in flag zone (proves defaults overridden)").not.toContain("flag-zone");
    }
  });
});
