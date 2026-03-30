import { IUnit, IFlag } from "../types";
import { CombatInput } from "./combatEngine";

/**
 * Helper to create a unit with defaults.
 */
function unit(overrides: Partial<IUnit> = {}): IUnit {
  return {
    x: 0,
    y: 0,
    strength: 1,
    range: 1,
    speed: 3,
    life: 1,
    hasFlag: false,
    unitType: 0,
    ...overrides,
  };
}

/**
 * Helper to create a dead/null unit placeholder.
 */
function deadUnit(): IUnit {
  return unit({ x: -1, y: -1, life: -1, strength: 0, speed: 0 });
}

/**
 * Standard flags far from any combat (won't trigger flag zone).
 */
const farFlags: IFlag[] = [
  { x: 0, y: 20, originX: 0, originY: 20, inZone: true },
  { x: 21, y: 20, originX: 21, originY: 20, inZone: true },
];

/**
 * Interface for a test scenario with expected results.
 */
export interface TestScenario {
  name: string;
  description: string;
  input: CombatInput;
  terrain?: Array<{ x: number; y: number }>;
  expected: {
    /** Expected life values for player's units after combat */
    myUnitsLife: number[];
    /** Expected life values for opponent's units after combat */
    opponentUnitsLife: number[];
    /** Expected flag inZone values [flag0, flag1] */
    flagsInZone?: [boolean, boolean];
    /** Expected number of boom events (animation triggers) */
    expectedBoomCount: number;
  };
}

/**
 * Predefined combat test scenarios.
 */
export const scenarios: TestScenario[] = [
  {
    name: "basic_melee",
    description: "2 Mediums adjacent — both deal 2 damage, both die",
    input: {
      units: [
        [unit({ x: 5, y: 5, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
        [unit({ x: 6, y: 5, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      futureUnits: [
        [unit({ x: 5, y: 5, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
        [unit({ x: 6, y: 5, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      flags: farFlags,
      playerIndex: 0,
      unitsCount: 1,
    },
    expected: {
      myUnitsLife: [0],
      opponentUnitsLife: [0],
      expectedBoomCount: 2,
    },
  },
  {
    name: "heavy_vs_medium",
    description: "Heavy (3/3) vs Medium (2/2) adjacent — Heavy survives at 1 life, Medium dies",
    input: {
      units: [
        [unit({ x: 5, y: 5, strength: 3, range: 3, speed: 1, life: 3, unitType: 2 })],
        [unit({ x: 6, y: 5, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      futureUnits: [
        [unit({ x: 5, y: 5, strength: 3, range: 3, speed: 1, life: 3, unitType: 2 })],
        [unit({ x: 6, y: 5, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      flags: farFlags,
      playerIndex: 0,
      unitsCount: 1,
    },
    expected: {
      myUnitsLife: [1],
      opponentUnitsLife: [-1],
      expectedBoomCount: 2,
    },
  },
  {
    name: "light_euclidean_range",
    description: "Two Lights diagonal (1,1 apart) — Euclidean² = 2 ≤ 2, both in range and die",
    input: {
      units: [
        [unit({ x: 5, y: 5, strength: 1, speed: 3, life: 1 })],
        [unit({ x: 6, y: 6, strength: 1, speed: 3, life: 1 })],
      ],
      futureUnits: [
        [unit({ x: 5, y: 5, strength: 1, speed: 3, life: 1 })],
        [unit({ x: 6, y: 6, strength: 1, speed: 3, life: 1 })],
      ],
      flags: farFlags,
      playerIndex: 0,
      unitsCount: 1,
    },
    expected: {
      myUnitsLife: [0],
      opponentUnitsLife: [0],
      expectedBoomCount: 2,
    },
  },
  {
    name: "flag_zone_invincibility",
    description: "Both units adjacent but one is in flag zone — no damage dealt to either",
    input: {
      units: [
        [unit({ x: 1, y: 20, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
        [unit({ x: 2, y: 20, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      futureUnits: [
        [unit({ x: 1, y: 20, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
        [unit({ x: 2, y: 20, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      // Flag at (0,20) — unit at (1,20) is Manhattan distance 1 from flag
      flags: [
        { x: 0, y: 20, originX: 0, originY: 20, inZone: true },
        { x: 21, y: 20, originX: 21, originY: 20, inZone: true },
      ],
      playerIndex: 0,
      unitsCount: 1,
    },
    expected: {
      myUnitsLife: [2],
      opponentUnitsLife: [2],
      expectedBoomCount: 0,
    },
  },
  {
    name: "simultaneous_kill",
    description: "Two Lights adjacent — both deal 1 damage, both die simultaneously",
    input: {
      units: [
        [unit({ x: 5, y: 5, strength: 1, speed: 3, life: 1 })],
        [unit({ x: 6, y: 5, strength: 1, speed: 3, life: 1 })],
      ],
      futureUnits: [
        [unit({ x: 5, y: 5, strength: 1, speed: 3, life: 1 })],
        [unit({ x: 6, y: 5, strength: 1, speed: 3, life: 1 })],
      ],
      flags: farFlags,
      playerIndex: 0,
      unitsCount: 1,
    },
    expected: {
      myUnitsLife: [0],
      opponentUnitsLife: [0],
      expectedBoomCount: 2,
    },
  },
  {
    name: "multi_attacker",
    description: "3 Mediums surround 1 Heavy — Heavy takes 6 cumulative damage (dies), each Medium takes 3 (dies)",
    input: {
      units: [
        [unit({ x: 10, y: 10, strength: 3, range: 3, speed: 1, life: 3, unitType: 2 })],
        [
          unit({ x: 11, y: 10, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 }),
          unit({ x: 10, y: 11, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 }),
          unit({ x: 9, y: 10, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 }),
        ],
      ],
      futureUnits: [
        [unit({ x: 10, y: 10, strength: 3, range: 3, speed: 1, life: 3, unitType: 2 })],
        [
          unit({ x: 11, y: 10, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 }),
          unit({ x: 10, y: 11, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 }),
          unit({ x: 9, y: 10, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 }),
        ],
      ],
      flags: farFlags,
      playerIndex: 0,
      unitsCount: 1,
    },
    expected: {
      myUnitsLife: [-3],
      opponentUnitsLife: [-1, -1, -1],
      expectedBoomCount: 4,
    },
  },
  {
    name: "light_duo_vs_heavy",
    description: "2 Lights near Heavy — adjacent Light hits, diagonal Light hits (Euclidean² ≤ 2). Heavy takes 2 damage (life 1), both Lights die from Heavy range 3",
    input: {
      units: [
        [unit({ x: 10, y: 10, strength: 3, range: 3, speed: 1, life: 3, unitType: 2 })],
        [
          unit({ x: 11, y: 10, strength: 1, range: 1, speed: 3, life: 1, unitType: 0 }),
          unit({ x: 11, y: 11, strength: 1, range: 1, speed: 3, life: 1, unitType: 0 }),
        ],
      ],
      futureUnits: [
        [unit({ x: 10, y: 10, strength: 3, range: 3, speed: 1, life: 3, unitType: 2 })],
        [
          unit({ x: 11, y: 10, strength: 1, range: 1, speed: 3, life: 1, unitType: 0 }),
          unit({ x: 11, y: 11, strength: 1, range: 1, speed: 3, life: 1, unitType: 0 }),
        ],
      ],
      flags: farFlags,
      playerIndex: 0,
      unitsCount: 1,
    },
    expected: {
      myUnitsLife: [1],
      opponentUnitsLife: [-2, -2],
      expectedBoomCount: 3,
    },
  },
  {
    name: "light_duo_moves_to_heavy",
    description: "2 Lights move into range of stationary Heavy — both hit (Euclidean² ≤ 2). Heavy life 1, both Lights die",
    input: {
      units: [
        [unit({ x: 10, y: 10, strength: 3, range: 3, speed: 1, life: 3, unitType: 2 })],
        [
          unit({ x: 14, y: 10, strength: 1, range: 1, speed: 3, life: 1, unitType: 0 }),
          unit({ x: 14, y: 11, strength: 1, range: 1, speed: 3, life: 1, unitType: 0 }),
        ],
      ],
      futureUnits: [
        [unit({ x: 10, y: 10, strength: 3, range: 3, speed: 1, life: 3, unitType: 2 })],
        [
          unit({ x: 11, y: 10, strength: 1, range: 1, speed: 3, life: 1, unitType: 0 }),
          unit({ x: 11, y: 11, strength: 1, range: 1, speed: 3, life: 1, unitType: 0 }),
        ],
      ],
      flags: farFlags,
      playerIndex: 0,
      unitsCount: 1,
    },
    expected: {
      myUnitsLife: [1],
      opponentUnitsLife: [-2, -2],
      expectedBoomCount: 3,
    },
  },
  {
    name: "flag_capture",
    description: "Unit with hasFlag near own flag — flag.inZone becomes false (captured)",
    input: {
      units: [
        [unit({ x: 1, y: 20, strength: 2, speed: 2, life: 2, hasFlag: false, unitType: 1 })],
        [unit({ x: 20, y: 20, strength: 2, speed: 2, life: 2, hasFlag: false, unitType: 1 })],
      ],
      futureUnits: [
        [unit({ x: 1, y: 20, strength: 2, speed: 2, life: 2, hasFlag: true, unitType: 1 })],
        [unit({ x: 20, y: 20, strength: 2, speed: 2, life: 2, hasFlag: false, unitType: 1 })],
      ],
      flags: [
        { x: 0, y: 20, originX: 0, originY: 20, inZone: true },
        { x: 21, y: 20, originX: 21, originY: 20, inZone: true },
      ],
      playerIndex: 0,
      unitsCount: 1,
    },
    expected: {
      myUnitsLife: [2],
      opponentUnitsLife: [2],
      flagsInZone: [true, false],
      expectedBoomCount: 0,
    },
  },
  {
    name: "flag_carrier_dies",
    description: "Unit with hasFlag dies — opponent flag returns to zone (inZone = true)",
    input: {
      units: [
        [unit({ x: 10, y: 10, strength: 1, speed: 3, life: 1, hasFlag: true, unitType: 0 })],
        [unit({ x: 11, y: 10, strength: 2, speed: 2, life: 2, hasFlag: false, unitType: 1 })],
      ],
      futureUnits: [
        [unit({ x: 10, y: 10, strength: 1, speed: 3, life: 1, hasFlag: true, unitType: 0 })],
        [unit({ x: 11, y: 10, strength: 2, speed: 2, life: 2, hasFlag: false, unitType: 1 })],
      ],
      flags: [
        { x: 0, y: 20, originX: 0, originY: 20, inZone: true },
        { x: 21, y: 20, originX: 21, originY: 20, inZone: false },
      ],
      playerIndex: 0,
      unitsCount: 1,
    },
    expected: {
      myUnitsLife: [-1],
      opponentUnitsLife: [1],
      flagsInZone: [true, true],
      expectedBoomCount: 2,
    },
  },
  {
    name: "mixed_range_asymmetric",
    description: "Light at (5,5) vs Heavy at (7,5) — Manhattan distance 2 ≤ 3 (Heavy hits), Euclidean² = 4 > 1 (Light misses)",
    input: {
      units: [
        [unit({ x: 5, y: 5, strength: 1, range: 1, speed: 3, life: 1, unitType: 0 })],
        [unit({ x: 7, y: 5, strength: 3, range: 3, speed: 1, life: 3, unitType: 2 })],
      ],
      futureUnits: [
        [unit({ x: 5, y: 5, strength: 1, range: 1, speed: 3, life: 1, unitType: 0 })],
        [unit({ x: 7, y: 5, strength: 3, range: 3, speed: 1, life: 3, unitType: 2 })],
      ],
      flags: farFlags,
      playerIndex: 0,
      unitsCount: 1,
    },
    expected: {
      myUnitsLife: [-2],
      opponentUnitsLife: [3],
      expectedBoomCount: 1,
    },
  },
  {
    name: "out_of_range",
    description: "Two Mediums far apart (distance 5) — no combat, no damage",
    input: {
      units: [
        [unit({ x: 5, y: 5, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
        [unit({ x: 10, y: 5, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      futureUnits: [
        [unit({ x: 5, y: 5, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
        [unit({ x: 10, y: 5, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      flags: farFlags,
      playerIndex: 0,
      unitsCount: 1,
    },
    expected: {
      myUnitsLife: [2],
      opponentUnitsLife: [2],
      expectedBoomCount: 0,
    },
  },
  {
    name: "flag_carrier_dies_stays_in_place",
    description: "Flag carrier dies with flagStayInPlace=true — flag drops at death position, not origin",
    input: {
      units: [
        [unit({ x: 10, y: 10, strength: 1, speed: 3, life: 1, hasFlag: true, unitType: 0 })],
        [unit({ x: 11, y: 10, strength: 2, speed: 2, life: 2, hasFlag: false, unitType: 1 })],
      ],
      futureUnits: [
        [unit({ x: 10, y: 10, strength: 1, speed: 3, life: 1, hasFlag: true, unitType: 0 })],
        [unit({ x: 11, y: 10, strength: 2, speed: 2, life: 2, hasFlag: false, unitType: 1 })],
      ],
      flags: [
        { x: 0, y: 20, originX: 0, originY: 20, inZone: true },
        { x: 21, y: 20, originX: 21, originY: 20, inZone: false },
      ],
      playerIndex: 0,
      unitsCount: 1,
      flagStayInPlace: true,
    },
    expected: {
      myUnitsLife: [-1],
      opponentUnitsLife: [1],
      // Flag should be at (10,10) — the dead carrier's position — not back at origin (21,20)
      flagsInZone: [true, true],
      expectedBoomCount: 2,
    },
  },
  {
    name: "flag_carrier_dies_default_returns",
    description: "Flag carrier dies with flagStayInPlace=false — flag returns to origin",
    input: {
      units: [
        [unit({ x: 10, y: 10, strength: 1, speed: 3, life: 1, hasFlag: true, unitType: 0 })],
        [unit({ x: 11, y: 10, strength: 2, speed: 2, life: 2, hasFlag: false, unitType: 1 })],
      ],
      futureUnits: [
        [unit({ x: 10, y: 10, strength: 1, speed: 3, life: 1, hasFlag: true, unitType: 0 })],
        [unit({ x: 11, y: 10, strength: 2, speed: 2, life: 2, hasFlag: false, unitType: 1 })],
      ],
      flags: [
        { x: 0, y: 20, originX: 0, originY: 20, inZone: true },
        { x: 21, y: 20, originX: 21, originY: 20, inZone: false },
      ],
      playerIndex: 0,
      unitsCount: 1,
      flagStayInPlace: false,
    },
    expected: {
      myUnitsLife: [-1],
      opponentUnitsLife: [1],
      flagsInZone: [true, true],
      expectedBoomCount: 2,
    },
  },
  {
    name: "flag_zone_stays_at_origin",
    description: "Flag dropped at (10,10) with flagStayInPlace — combat near (10,10) has no flag zone protection",
    input: {
      units: [
        [unit({ x: 10, y: 11, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
        [unit({ x: 10, y: 12, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      futureUnits: [
        [unit({ x: 10, y: 11, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
        [unit({ x: 10, y: 12, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      // Flag 1 was dropped at (10,10) but origin is (21,20) — zone should be at origin, not (10,10)
      flags: [
        { x: 0, y: 20, originX: 0, originY: 20, inZone: true },
        { x: 10, y: 10, originX: 21, originY: 20, inZone: true },
      ],
      playerIndex: 0,
      unitsCount: 1,
    },
    expected: {
      myUnitsLife: [0],
      opponentUnitsLife: [0],
      expectedBoomCount: 2,
    },
  },
  {
    name: "flag_pickup_after_drop_second_round",
    description: "Dead flag carrier from prior round should not re-trigger flag drop when another unit already picked up the flag",
    input: {
      units: [
        // Unit 0 died in a prior round while carrying flag (life < 1, hasFlag still true)
        // Unit 1 picked up the dropped flag and is alive
        [
          unit({ x: 10, y: 10, strength: 1, speed: 3, life: -1, hasFlag: true, unitType: 0 }),
          unit({ x: 5, y: 5, strength: 2, speed: 2, life: 2, hasFlag: true, unitType: 1 }),
        ],
        [unit({ x: 20, y: 20, strength: 2, speed: 2, life: 2, hasFlag: false, unitType: 1 })],
      ],
      futureUnits: [
        [
          unit({ x: 10, y: 10, strength: 1, speed: 3, life: -1, hasFlag: true, unitType: 0 }),
          unit({ x: 5, y: 5, strength: 2, speed: 2, life: 2, hasFlag: true, unitType: 1 }),
        ],
        [unit({ x: 20, y: 20, strength: 2, speed: 2, life: 2, hasFlag: false, unitType: 1 })],
      ],
      flags: [
        { x: 0, y: 20, originX: 0, originY: 20, inZone: true },
        { x: 21, y: 20, originX: 21, originY: 20, inZone: false }, // Flag was picked up
      ],
      playerIndex: 0,
      unitsCount: 2,
      flagStayInPlace: true,
    },
    expected: {
      myUnitsLife: [-1, 2],
      opponentUnitsLife: [2],
      // Flag 1 should stay inZone: false because unit 1 is alive and carrying it
      flagsInZone: [true, false],
      expectedBoomCount: 0,
    },
  },
  {
    name: "terrain_reconnect",
    description: "Scenario with terrain — verifies terrain persists through state restoration",
    input: {
      units: [
        [unit({ x: 3, y: 3, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
        [unit({ x: 15, y: 15, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      futureUnits: [
        [unit({ x: 3, y: 3, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
        [unit({ x: 15, y: 15, strength: 2, range: 2, speed: 2, life: 2, unitType: 1 })],
      ],
      flags: farFlags,
      playerIndex: 0,
      unitsCount: 1,
    },
    terrain: [
      { x: 5, y: 5 },
      { x: 6, y: 6 },
      { x: 7, y: 7 },
    ],
    expected: {
      myUnitsLife: [2],
      opponentUnitsLife: [2],
      expectedBoomCount: 0,
    },
  },
];

export { unit, deadUnit, farFlags };
