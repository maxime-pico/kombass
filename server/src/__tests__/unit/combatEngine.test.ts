import {
  calculateCombatResults,
  isInCombatRange,
  isInFlagZone,
} from "../../../../shared/engine/combatEngine";
import { IUnit, IFlag } from "../../../../shared/types";

function unit(overrides: Partial<IUnit> = {}): IUnit {
  return {
    x: 0, y: 0, strength: 1, range: 1, speed: 3, life: 1,
    hasFlag: false, unitType: 0, ...overrides,
  };
}

const farFlags: IFlag[] = [
  { x: 0, y: 20, originX: 0, originY: 20, inZone: true },
  { x: 21, y: 20, originX: 21, originY: 20, inZone: true },
];

describe("isInCombatRange (shared)", () => {
  test("Medium uses Manhattan distance", () => {
    expect(isInCombatRange(0, 0, 2, 2, 1, 1, 2, 2)).toBe(true);
    expect(isInCombatRange(0, 0, 2, 2, 2, 1, 2, 2)).toBe(false);
  });

  test("Heavy uses Manhattan distance with range 3", () => {
    expect(isInCombatRange(0, 0, 3, 3, 2, 1, 2, 2)).toBe(true);
    expect(isInCombatRange(0, 0, 3, 3, 2, 2, 2, 2)).toBe(false);
  });

  test("Light uses Euclidean squared when both are Light", () => {
    expect(isInCombatRange(0, 0, 1, 1, 1, 1, 1, 1)).toBe(true);
    expect(isInCombatRange(0, 0, 1, 1, 2, 0, 1, 1)).toBe(false);
  });

  test("Light vs non-Light uses Euclidean squared for Light attacker", () => {
    expect(isInCombatRange(0, 0, 1, 1, 1, 0, 3, 3)).toBe(true);
    expect(isInCombatRange(0, 0, 1, 1, 1, 1, 3, 3)).toBe(false);
  });

  test("non-Light vs Light uses Manhattan for non-Light attacker", () => {
    expect(isInCombatRange(0, 0, 3, 3, 2, 1, 1, 1)).toBe(true);
  });
});

describe("isInFlagZone (shared)", () => {
  const flags: IFlag[] = [
    { x: 0, y: 10, originX: 0, originY: 10, inZone: true },
    { x: 21, y: 10, originX: 21, originY: 10, inZone: true },
  ];

  test("position within Manhattan distance 3 of any flag", () => {
    expect(isInFlagZone(2, 10, flags)).toBe(true);
    expect(isInFlagZone(0, 13, flags)).toBe(true);
    expect(isInFlagZone(19, 10, flags)).toBe(true);
  });

  test("position outside all flag zones", () => {
    expect(isInFlagZone(10, 10, flags)).toBe(false);
    expect(isInFlagZone(5, 5, flags)).toBe(false);
  });
});

describe("calculateCombatResults (shared)", () => {
  test("basic melee — 2 Mediums adjacent, both die", () => {
    const result = calculateCombatResults({
      units: [
        [unit({ x: 5, y: 5, strength: 2, speed: 2, life: 2, unitType: 1 })],
        [unit({ x: 6, y: 5, strength: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      futureUnits: [
        [unit({ x: 5, y: 5, strength: 2, speed: 2, life: 2, unitType: 1 })],
        [unit({ x: 6, y: 5, strength: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      flags: farFlags,
      isPlayer: 0,
      unitsCount: 1,
    });
    expect(result.newFutureUnits[0][0]?.life).toBe(0);
    expect(result.newFutureUnits[1][0]?.life).toBe(0);
  });

  test("combat is symmetric", () => {
    const sharedUnits = [
      [unit({ x: 5, y: 5, strength: 2, speed: 2, life: 2 })],
      [unit({ x: 6, y: 5, strength: 2, speed: 2, life: 2 })],
    ];

    const resultP0 = calculateCombatResults({
      units: sharedUnits,
      futureUnits: sharedUnits.map((arr) => arr.map((u) => ({ ...u }))),
      flags: farFlags, isPlayer: 0, unitsCount: 1,
    });

    const resultP1 = calculateCombatResults({
      units: sharedUnits,
      futureUnits: sharedUnits.map((arr) => arr.map((u) => ({ ...u }))),
      flags: farFlags, isPlayer: 1, unitsCount: 1,
    });

    expect(resultP0.newFutureUnits[0][0]?.life).toBe(resultP1.newFutureUnits[0][0]?.life);
    expect(resultP0.newFutureUnits[1][0]?.life).toBe(resultP1.newFutureUnits[1][0]?.life);
  });

  test("flag zone protection", () => {
    const result = calculateCombatResults({
      units: [
        [unit({ x: 1, y: 20, strength: 2, speed: 2, life: 2, unitType: 1 })],
        [unit({ x: 2, y: 20, strength: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      futureUnits: [
        [unit({ x: 1, y: 20, strength: 2, speed: 2, life: 2, unitType: 1 })],
        [unit({ x: 2, y: 20, strength: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      flags: [
        { x: 0, y: 20, originX: 0, originY: 20, inZone: true },
        { x: 21, y: 20, originX: 21, originY: 20, inZone: true },
      ],
      isPlayer: 0,
      unitsCount: 1,
    });
    expect(result.newFutureUnits[0][0]?.life).toBe(2);
    expect(result.newFutureUnits[1][0]?.life).toBe(2);
  });

  test("dead units from previous round are preserved", () => {
    const result = calculateCombatResults({
      units: [
        [unit({ x: 5, y: 5, strength: 2, speed: 2, life: -1 })],
        [unit({ x: 10, y: 10, strength: 2, speed: 2, life: 2 })],
      ],
      futureUnits: [
        [unit({ x: 5, y: 5, strength: 2, speed: 2, life: -1 })],
        [unit({ x: 10, y: 10, strength: 2, speed: 2, life: 2 })],
      ],
      flags: farFlags, isPlayer: 0, unitsCount: 1,
    });
    expect(result.newFutureUnits[0][0]?.life).toBe(-1);
    expect(result.newFutureUnits[1][0]?.life).toBe(2);
  });
});
