import { checkWinCondition } from "../winCondition";
import { unit } from "../scenarios";
import { IFlag } from "../../App";

const defaultFlags: IFlag[] = [
  { x: 0, y: 10, inZone: true },
  { x: 21, y: 10, inZone: true },
];

describe("checkWinCondition", () => {
  test("no win when all units alive and no flag captured", () => {
    const units = [
      [unit({ x: 5, y: 5, life: 2 })],
      [unit({ x: 15, y: 5, life: 2 })],
    ];
    const result = checkWinCondition(units, defaultFlags, 1);
    expect(result.gameOver).toBe("");
    expect(result.winner).toBeNull();
  });

  test("flag capture win — unit with hasFlag near own flag", () => {
    const units = [
      [unit({ x: 1, y: 10, life: 2, hasFlag: true })],
      [unit({ x: 15, y: 5, life: 2 })],
    ];
    // Player 0's flag at (0,10), unit at (1,10) — distance 1 ≤ 3
    const result = checkWinCondition(units, defaultFlags, 1, ["Alpha", "Beta"]);
    expect(result.gameOver).toContain("Alpha won");
    expect(result.winner).toBe(0);
    expect(result.loser).toBe(1);
  });

  test("elimination win — all opponent units dead", () => {
    const units = [
      [unit({ x: 5, y: 5, life: 2 })],
      [unit({ x: 15, y: 5, life: 0 })],
    ];
    const result = checkWinCondition(units, defaultFlags, 1, ["Alpha", "Beta"]);
    expect(result.gameOver).toContain("Alpha destroyed Beta");
    expect(result.winner).toBe(0);
  });

  test("double elimination — all units dead on both sides", () => {
    const units = [
      [unit({ x: 5, y: 5, life: 0 })],
      [unit({ x: 15, y: 5, life: 0 })],
    ];
    const result = checkWinCondition(units, defaultFlags, 1);
    expect(result.gameOver).toContain("anihilated each other");
  });

  test("simultaneous flag capture — both players capture at same time", () => {
    const units = [
      [unit({ x: 1, y: 10, life: 2, hasFlag: true })],
      [unit({ x: 20, y: 10, life: 2, hasFlag: true })],
    ];
    const result = checkWinCondition(units, defaultFlags, 1);
    expect(result.gameOver).toContain("both did it at the same time");
  });

  test("dead flag carrier does not count as capture", () => {
    const units = [
      [unit({ x: 1, y: 10, life: 0, hasFlag: true })],
      [unit({ x: 15, y: 5, life: 2 })],
    ];
    // Dead unit with flag — should count as elimination loss for P0, not flag capture
    const result = checkWinCondition(units, defaultFlags, 1, ["Alpha", "Beta"]);
    expect(result.gameOver).toContain("Beta destroyed Alpha");
    expect(result.winner).toBe(1);
  });

  test("flag carrier alive but too far from own flag", () => {
    const units = [
      [unit({ x: 10, y: 10, life: 2, hasFlag: true })],
      [unit({ x: 15, y: 5, life: 2 })],
    ];
    // P0 flag at (0,10), unit at (10,10) — distance 10 > 3
    const result = checkWinCondition(units, defaultFlags, 1);
    expect(result.gameOver).toBe("");
  });

  test("multiple units — only some dead, no win", () => {
    const units = [
      [unit({ x: 5, y: 5, life: 2 }), unit({ x: 6, y: 5, life: 0 })],
      [unit({ x: 15, y: 5, life: 2 }), unit({ x: 16, y: 5, life: 2 })],
    ];
    const result = checkWinCondition(units, defaultFlags, 2);
    expect(result.gameOver).toBe("");
  });

  test("multiple units — all dead on one side triggers elimination", () => {
    const units = [
      [unit({ x: 5, y: 5, life: 0 }), unit({ x: 6, y: 5, life: -1 })],
      [unit({ x: 15, y: 5, life: 2 }), unit({ x: 16, y: 5, life: 1 })],
    ];
    const result = checkWinCondition(units, defaultFlags, 2, ["Alpha", "Beta"]);
    expect(result.gameOver).toContain("Beta destroyed Alpha");
  });
});
