import { placeUnit } from "../placementEngine";
import { IUnit } from "../../types";

function makeUnit(overrides: Partial<IUnit> = {}): IUnit {
  return {
    strength: 2, range: 2, speed: 2, x: -1, y: -1, life: 2,
    hasFlag: false, unitType: 1, ...overrides,
  };
}

describe("placeUnit", () => {
  it("places a unit at the specified position", () => {
    const units = [[makeUnit(), makeUnit()], [makeUnit(), makeUnit()]];
    const placedUnits = [[false, false], [false, false]];

    const result = placeUnit({
      units,
      placedUnits,
      isPlayer: 0,
      unitNumber: 0,
      col: 3,
      row: 4,
      unitsCount: 2,
    });

    expect(result.units[0][0].x).toBe(3);
    expect(result.units[0][0].y).toBe(4);
  });

  it("marks the unit as placed", () => {
    const units = [[makeUnit()], [makeUnit()]];
    const placedUnits = [[false], [false]];

    const result = placeUnit({
      units,
      placedUnits,
      isPlayer: 0,
      unitNumber: 0,
      col: 1,
      row: 1,
      unitsCount: 1,
    });

    expect(result.placedUnits[0][0]).toBe(true);
  });

  it("does not mutate other player's units", () => {
    const p1Unit = makeUnit({ x: 5, y: 5 });
    const units = [[makeUnit()], [p1Unit]];
    const placedUnits = [[false], [false]];

    const result = placeUnit({
      units,
      placedUnits,
      isPlayer: 0,
      unitNumber: 0,
      col: 2,
      row: 2,
      unitsCount: 1,
    });

    expect(result.units[1][0].x).toBe(5);
    expect(result.units[1][0].y).toBe(5);
  });

  it("wraps nextUnitNumber around", () => {
    const units = [[makeUnit(), makeUnit()], [makeUnit(), makeUnit()]];
    const placedUnits = [[false, false], [false, false]];

    const result = placeUnit({
      units,
      placedUnits,
      isPlayer: 0,
      unitNumber: 1, // last unit
      col: 1,
      row: 1,
      unitsCount: 2,
    });

    expect(result.nextUnitNumber).toBe(0);
  });

  it("does not mutate input arrays", () => {
    const originalUnit = makeUnit({ x: -1, y: -1 });
    const units = [[originalUnit], [makeUnit()]];
    const placedUnits = [[false], [false]];

    placeUnit({
      units,
      placedUnits,
      isPlayer: 0,
      unitNumber: 0,
      col: 3,
      row: 3,
      unitsCount: 1,
    });

    expect(units[0][0].x).toBe(-1);
    expect(placedUnits[0][0]).toBe(false);
  });
});
