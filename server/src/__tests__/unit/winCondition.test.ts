import { checkWinCondition } from "../../../../shared/engine/winCondition";
import { IUnit, IFlag } from "../../../../shared/types";

function unit(overrides: Partial<IUnit> = {}): IUnit {
  return {
    x: 0, y: 0, strength: 1, range: 1, speed: 3, life: 1,
    hasFlag: false, unitType: 0, ...overrides,
  };
}

const standardFlags: IFlag[] = [
  { x: 0, y: 10, originX: 0, originY: 10, inZone: true },
  { x: 21, y: 10, originX: 21, originY: 10, inZone: true },
];

describe("checkWinCondition (shared)", () => {
  test("no win when both players have living units and no flag capture", () => {
    const result = checkWinCondition(
      [[unit({ x: 5, y: 5, life: 2 })], [unit({ x: 15, y: 15, life: 2 })]],
      standardFlags,
      1
    );
    expect(result.gameOver).toBe("");
    expect(result.winner).toBeNull();
  });

  test("flag capture — unit with hasFlag near own flag wins", () => {
    const result = checkWinCondition(
      [
        [unit({ x: 1, y: 10, life: 2, hasFlag: true })],
        [unit({ x: 15, y: 15, life: 2 })],
      ],
      standardFlags,
      1
    );
    expect(result.winner).toBe(0);
    expect(result.gameOver).not.toBe("");
  });

  test("elimination — all units of one side dead", () => {
    const result = checkWinCondition(
      [
        [unit({ life: -1 })],
        [unit({ x: 15, y: 15, life: 2 })],
      ],
      standardFlags,
      1
    );
    expect(result.winner).toBe(1);
  });

  test("mutual elimination", () => {
    const result = checkWinCondition(
      [[unit({ life: -1 })], [unit({ life: -1 })]],
      standardFlags,
      1
    );
    expect(result.gameOver).toContain("anihilated");
  });

  test("simultaneous flag capture", () => {
    const result = checkWinCondition(
      [
        [unit({ x: 1, y: 10, life: 2, hasFlag: true })],
        [unit({ x: 20, y: 10, life: 2, hasFlag: true })],
      ],
      standardFlags,
      1
    );
    expect(result.gameOver).toContain("both did it");
  });

  test("dead unit with hasFlag does not count as capture", () => {
    const result = checkWinCondition(
      [
        [unit({ x: 1, y: 10, life: -1, hasFlag: true })],
        [unit({ x: 15, y: 15, life: 2 })],
      ],
      standardFlags,
      1
    );
    // P0 unit is dead so hasFlag doesn't count; P0 is eliminated
    expect(result.winner).toBe(1);
  });
});
