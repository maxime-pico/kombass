import { buildAnimationQueue, buildBoomQueue } from "../animationEngine";
import { scenarios } from "../scenarios";

describe("buildBoomQueue", () => {
  scenarios.forEach((scenario) => {
    test(`${scenario.name}: boomCount=${scenario.expected.expectedBoomCount}`, () => {
      const animQueue = buildAnimationQueue(scenario.input);
      const boomQueue = buildBoomQueue(scenario.input, animQueue);
      expect(boomQueue.length).toBe(scenario.expected.expectedBoomCount);
    });
  });
});

describe("buildAnimationQueue", () => {
  test("basic_melee: interleaves both players", () => {
    const scenario = scenarios[0]; // basic_melee
    const animQueue = buildAnimationQueue(scenario.input);

    // Should have living units from both players
    const player0Count = animQueue.filter((a) => a.player === 0).length;
    const player1Count = animQueue.filter((a) => a.player === 1).length;

    expect(player0Count).toBeGreaterThan(0);
    expect(player1Count).toBeGreaterThan(0);
  });

  test("out_of_range: includes living units even when no combat", () => {
    const scenario = scenarios[9]; // out_of_range
    const animQueue = buildAnimationQueue(scenario.input);

    // Even though no combat, animation queue should contain the living units
    const player0Units = animQueue.filter((a) => a.player === 0);
    const player1Units = animQueue.filter((a) => a.player === 1);

    // Each should have at least one living unit
    expect(player0Units.length).toBeGreaterThan(0);
    expect(player1Units.length).toBeGreaterThan(0);
  });

  test("flag_zone_invincibility: contains units in flag zone (but no boom)", () => {
    const scenario = scenarios[3]; // flag_zone_invincibility
    const animQueue = buildAnimationQueue(scenario.input);

    // Animation queue should contain the units (they're alive and animate)
    expect(animQueue.length).toBeGreaterThan(0);

    // But boom queue should be empty (they're in flag zone)
    const boomQueue = buildBoomQueue(scenario.input, animQueue);
    expect(boomQueue.length).toBe(0);
  });
});

describe("buildBoomQueue - specific behavior", () => {
  test("light_euclidean_range: CURRENTLY FAILS - expects 2 booms but gets 0", () => {
    // This test documents the known bug: two Lights diagonal (dx=1, dy=1)
    // Combat engine sees them as in range (Euclidean² = 2 ≤ 2, special case for both Light)
    // But boom builder does NOT have the special case, uses dx² + dy² ≤ 1 per attacker
    // So boom builder says they're NOT in range → no boom
    const scenario = scenarios[2]; // light_euclidean_range
    const animQueue = buildAnimationQueue(scenario.input);
    const boomQueue = buildBoomQueue(scenario.input, animQueue);

    // THIS WILL FAIL UNTIL THE BUG IS FIXED
    expect(boomQueue.length).toBe(2);
  });

  test("multi_attacker: deduplicates booms at same location", () => {
    const scenario = scenarios[5]; // multi_attacker: Heavy at (10,10) vs 3 Mediums
    const animQueue = buildAnimationQueue(scenario.input);
    const boomQueue = buildBoomQueue(scenario.input, animQueue);

    // Should have booms at 4 unique locations: (10,10), (11,10), (10,11), (9,10)
    expect(boomQueue.length).toBe(4);

    // Verify unique locations
    const locations = new Set(boomQueue.map((b) => `${b.x}_${b.y}`));
    expect(locations.size).toBe(4);
  });

  test("flag_zone_invincibility: no booms when both units in flag zone", () => {
    const scenario = scenarios[3];
    const animQueue = buildAnimationQueue(scenario.input);
    const boomQueue = buildBoomQueue(scenario.input, animQueue);

    // Despite being adjacent (in range), both units are in flag zone
    expect(boomQueue.length).toBe(0);
  });
});
