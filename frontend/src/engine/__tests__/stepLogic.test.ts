import { findNextAliveStep } from "../stepLogic";

describe("findNextAliveStep", () => {
  // 3 units: u0 alive, u1 dead, u2 alive
  const threeUnits_u1Dead = [1, 0, 1];

  test("3 units, u1 dead, forward from 0 → skip to 2", () => {
    expect(findNextAliveStep(0, 1, threeUnits_u1Dead, 3)).toBe(2);
  });

  test("3 units, u1 dead, backward from 2 → skip to 0", () => {
    expect(findNextAliveStep(2, -1, threeUnits_u1Dead, 3)).toBe(0);
  });

  // 5 units: u0 alive, u1 alive, u2 dead, u3 dead, u4 alive
  const fiveUnits_u2u3Dead = [1, 1, 0, 0, 1];

  test("5 units, u2+u3 dead, forward from 1 → skip to 4", () => {
    expect(findNextAliveStep(1, 1, fiveUnits_u2u3Dead, 5)).toBe(4);
  });

  test("5 units, u2+u3 dead, backward from 4 → skip to 1", () => {
    expect(findNextAliveStep(4, -1, fiveUnits_u2u3Dead, 5)).toBe(1);
  });

  // 7 units: u0 alive, u1-u5 dead, u6 alive
  const sevenUnits_u1to5Dead = [1, 0, 0, 0, 0, 0, 1];

  test("7 units, u1-u5 dead, backward from 6 → skip to 0", () => {
    expect(findNextAliveStep(6, -1, sevenUnits_u1to5Dead, 7)).toBe(0);
  });

  // All alive
  const threeAlive = [1, 1, 1];

  test("all alive, forward from 0 → 1", () => {
    expect(findNextAliveStep(0, 1, threeAlive, 3)).toBe(1);
  });

  test("all alive, backward from 2 → 1", () => {
    expect(findNextAliveStep(2, -1, threeAlive, 3)).toBe(1);
  });

  // Edge: step 0, only u0 alive, backward → stays at 0
  test("step 0, backward → stays at 0 (boundary)", () => {
    const onlyFirst = [1, 0, 0];
    // backward from 0: (0 + -1) % 4 = -1, clamped to 0
    expect(findNextAliveStep(0, -1, onlyFirst, 3)).toBe(0);
  });
});
