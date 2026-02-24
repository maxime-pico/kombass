import { calculateCombatResults, isInCombatRange, isInFlagZone } from "../combatEngine";
import { scenarios, unit, farFlags } from "../scenarios";

describe("isInCombatRange", () => {
  test("Medium uses Manhattan distance", () => {
    // Medium (strength=2) at (0,0), target at (1,1): Manhattan = 2 ≤ 2
    expect(isInCombatRange(0, 0, 2, 1, 1, 2)).toBe(true);
    // Medium at (0,0), target at (2,1): Manhattan = 3 > 2
    expect(isInCombatRange(0, 0, 2, 2, 1, 2)).toBe(false);
  });

  test("Heavy uses Manhattan distance with strength 3", () => {
    // Heavy (strength=3) at (0,0), target at (2,1): Manhattan = 3 ≤ 3
    expect(isInCombatRange(0, 0, 3, 2, 1, 2)).toBe(true);
    // Heavy at (0,0), target at (2,2): Manhattan = 4 > 3
    expect(isInCombatRange(0, 0, 3, 2, 2, 2)).toBe(false);
  });

  test("Light uses Euclidean squared when both are Light", () => {
    // Two Lights: (0,0) and (1,1): Euclidean² = 2 ≤ 2
    expect(isInCombatRange(0, 0, 1, 1, 1, 1)).toBe(true);
    // Two Lights: (0,0) and (2,0): Euclidean² = 4 > 2
    expect(isInCombatRange(0, 0, 1, 2, 0, 1)).toBe(false);
  });

  test("Light vs non-Light uses Euclidean squared for Light attacker", () => {
    // Light (strength=1) attacks Heavy: (0,0) to (1,0): Euclidean² = 1 ≤ 1
    expect(isInCombatRange(0, 0, 1, 1, 0, 3)).toBe(true);
    // Light attacks Heavy: (0,0) to (1,1): Euclidean² = 2 > 1
    expect(isInCombatRange(0, 0, 1, 1, 1, 3)).toBe(false);
  });

  test("non-Light vs Light uses Manhattan for non-Light attacker", () => {
    // Heavy (strength=3) attacks Light: Manhattan = |2| + |1| = 3 ≤ 3
    expect(isInCombatRange(0, 0, 3, 2, 1, 1)).toBe(true);
  });
});

describe("isInFlagZone", () => {
  const flags = [
    { x: 0, y: 10, inZone: true },
    { x: 21, y: 10, inZone: true },
  ];

  test("position within Manhattan distance 3 of any flag", () => {
    expect(isInFlagZone(2, 10, flags)).toBe(true); // distance 2 from flag[0]
    expect(isInFlagZone(0, 13, flags)).toBe(true); // distance 3 from flag[0]
    expect(isInFlagZone(19, 10, flags)).toBe(true); // distance 2 from flag[1]
  });

  test("position outside all flag zones", () => {
    expect(isInFlagZone(10, 10, flags)).toBe(false);
    expect(isInFlagZone(5, 5, flags)).toBe(false);
  });
});

describe("calculateCombatResults", () => {
  // Run all predefined scenarios
  scenarios.forEach((scenario) => {
    test(`${scenario.name}: ${scenario.description}`, () => {
      const result = calculateCombatResults(scenario.input);
      const isPlayer = scenario.input.isPlayer;
      const opponentNumber = ((isPlayer + 1) % 2) as 0 | 1;

      // Check my units' life
      scenario.expected.myUnitsLife.forEach((expectedLife, i) => {
        expect(result.newFutureUnits[isPlayer][i]?.life).toBe(expectedLife);
      });

      // Check opponent units' life
      scenario.expected.opponentUnitsLife.forEach((expectedLife, i) => {
        expect(result.newFutureUnits[opponentNumber][i]?.life).toBe(expectedLife);
      });

      // Check flags if specified
      if (scenario.expected.flagsInZone) {
        expect(result.flags[0].inZone).toBe(scenario.expected.flagsInZone[0]);
        expect(result.flags[1].inZone).toBe(scenario.expected.flagsInZone[1]);
      }
    });
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
      flags: farFlags,
      isPlayer: 0,
      unitsCount: 1,
    });

    // Dead unit should be preserved from units (not futureUnits)
    expect(result.newFutureUnits[0][0]?.life).toBe(-1);
    // Living opponent should be unchanged (no combat partner alive)
    expect(result.newFutureUnits[1][0]?.life).toBe(2);
  });

  test("null units get default placeholder values", () => {
    const result = calculateCombatResults({
      units: [
        [null as any],
        [unit({ x: 10, y: 10, strength: 2, speed: 2, life: 2 })],
      ],
      futureUnits: [
        [null as any],
        [unit({ x: 10, y: 10, strength: 2, speed: 2, life: 2 })],
      ],
      flags: farFlags,
      isPlayer: 0,
      unitsCount: 1,
    });

    expect(result.newFutureUnits[0][0]).toEqual({
      x: -1,
      y: -1,
      life: -1,
      strength: 0,
      speed: 0,
      hasFlag: false,
      unitType: 0,
    });
  });

  test("combat is symmetric — same results regardless of which player calculates", () => {
    const sharedUnits = [
      [unit({ x: 5, y: 5, strength: 2, speed: 2, life: 2 })],
      [unit({ x: 6, y: 5, strength: 2, speed: 2, life: 2 })],
    ];

    const resultP0 = calculateCombatResults({
      units: sharedUnits,
      futureUnits: sharedUnits.map((arr) => arr.map((u) => ({ ...u }))),
      flags: farFlags,
      isPlayer: 0,
      unitsCount: 1,
    });

    const resultP1 = calculateCombatResults({
      units: sharedUnits,
      futureUnits: sharedUnits.map((arr) => arr.map((u) => ({ ...u }))),
      flags: farFlags,
      isPlayer: 1,
      unitsCount: 1,
    });

    expect(resultP0.newFutureUnits[0][0]?.life).toBe(resultP1.newFutureUnits[0][0]?.life);
    expect(resultP0.newFutureUnits[1][0]?.life).toBe(resultP1.newFutureUnits[1][0]?.life);
  });
});
