import { changePosition, undoMove } from "../movementEngine";
import { IUnit, IFlag } from "../../types";

function makeUnit(overrides: Partial<IUnit> = {}): IUnit {
  return {
    strength: 2, range: 2, speed: 2, x: 0, y: 0, life: 2,
    hasFlag: false, unitType: 1, ...overrides,
  };
}

function makeFlag(overrides: Partial<IFlag> = {}): IFlag {
  return {
    x: 0, y: 0, originX: 0, originY: 0, inZone: true, ...overrides,
  };
}

describe("changePosition", () => {
  it("moves a unit to the target position", () => {
    const unit = makeUnit({ x: 1, y: 1 });
    const result = changePosition({
      units: [[unit], [makeUnit({ x: 5, y: 5 })]],
      futureUnits: [[null as any], [null as any]],
      futureUnitsHistory: [],
      movementPaths: [null],
      flags: [makeFlag({ x: 0, y: 9 }), makeFlag({ x: 9, y: 0 })],
      playerNumber: 0,
      unitNumber: 0,
      x: 3,
      y: 3,
    });

    expect(result.futureUnits[0][0].x).toBe(3);
    expect(result.futureUnits[0][0].y).toBe(3);
    expect(result.futureUnits[0][0].life).toBe(2);
  });

  it("captures opponent flag when moving onto it", () => {
    const unit = makeUnit({ x: 1, y: 1 });
    const opponentFlag = makeFlag({ x: 3, y: 3, inZone: true });

    const result = changePosition({
      units: [[unit], [makeUnit({ x: 5, y: 5 })]],
      futureUnits: [[null as any], [null as any]],
      futureUnitsHistory: [],
      movementPaths: [null],
      flags: [makeFlag({ x: 0, y: 9 }), opponentFlag],
      playerNumber: 0,
      unitNumber: 0,
      x: 3,
      y: 3,
    });

    expect(result.futureUnits[0][0].hasFlag).toBe(true);
  });

  it("does not capture flag when flag is not in zone", () => {
    const unit = makeUnit({ x: 1, y: 1 });
    const opponentFlag = makeFlag({ x: 3, y: 3, inZone: false });

    const result = changePosition({
      units: [[unit], [makeUnit({ x: 5, y: 5 })]],
      futureUnits: [[null as any], [null as any]],
      futureUnitsHistory: [],
      movementPaths: [null],
      flags: [makeFlag({ x: 0, y: 9 }), opponentFlag],
      playerNumber: 0,
      unitNumber: 0,
      x: 3,
      y: 3,
    });

    expect(result.futureUnits[0][0].hasFlag).toBe(false);
  });

  it("does not capture flag when unit is dead", () => {
    const unit = makeUnit({ x: 1, y: 1, life: 0 });
    const opponentFlag = makeFlag({ x: 3, y: 3, inZone: true });

    const result = changePosition({
      units: [[unit], [makeUnit({ x: 5, y: 5 })]],
      futureUnits: [[null as any], [null as any]],
      futureUnitsHistory: [],
      movementPaths: [null],
      flags: [makeFlag({ x: 0, y: 9 }), opponentFlag],
      playerNumber: 0,
      unitNumber: 0,
      x: 3,
      y: 3,
    });

    expect(result.futureUnits[0][0].hasFlag).toBe(false);
  });

  it("appends to futureUnitsHistory", () => {
    const unit = makeUnit({ x: 1, y: 1 });
    const result = changePosition({
      units: [[unit], [makeUnit()]],
      futureUnits: [[null as any], [null as any]],
      futureUnitsHistory: [],
      movementPaths: [null],
      flags: [makeFlag(), makeFlag()],
      playerNumber: 0,
      unitNumber: 0,
      x: 2,
      y: 2,
    });

    expect(result.futureUnitsHistory).toHaveLength(1);
    expect(result.futureUnitsHistory[0][0].x).toBe(2);
  });

  it("records movement path when unit moves", () => {
    const unit = makeUnit({ x: 1, y: 1 });
    const path = [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }];

    const result = changePosition({
      units: [[unit], [makeUnit()]],
      futureUnits: [[null as any], [null as any]],
      futureUnitsHistory: [],
      movementPaths: [null],
      flags: [makeFlag(), makeFlag()],
      playerNumber: 0,
      unitNumber: 0,
      x: 3,
      y: 1,
      path,
    });

    expect(result.movementPaths[0]).toEqual(path);
  });

  it("clears movement path when unit stays in place", () => {
    const unit = makeUnit({ x: 1, y: 1 });
    const result = changePosition({
      units: [[unit], [makeUnit()]],
      futureUnits: [[null as any], [null as any]],
      futureUnitsHistory: [],
      movementPaths: [[{ x: 0, y: 0 }]],
      flags: [makeFlag(), makeFlag()],
      playerNumber: 0,
      unitNumber: 0,
      x: 1,
      y: 1,
    });

    expect(result.movementPaths[0]).toBeNull();
  });
});

describe("undoMove", () => {
  it("pops last history entry and reverts futureUnits", () => {
    const movedUnit = makeUnit({ x: 3, y: 3 });
    const previousUnits = [makeUnit({ x: 2, y: 2 })];

    const result = undoMove({
      futureUnits: [[movedUnit], [null as any]],
      futureUnitsHistory: [previousUnits, [movedUnit]],
      unitsCount: 1,
      isPlayer: 0,
    });

    expect(result.futureUnitsHistory).toHaveLength(1);
    expect(result.futureUnits[0][0].x).toBe(2);
  });

  it("resets to nulls when history becomes empty", () => {
    const movedUnit = makeUnit({ x: 3, y: 3 });

    const result = undoMove({
      futureUnits: [[movedUnit], [null as any]],
      futureUnitsHistory: [[movedUnit]],
      unitsCount: 2,
      isPlayer: 0,
    });

    expect(result.futureUnitsHistory).toHaveLength(0);
    expect(result.futureUnits[0]).toEqual([null, null]);
  });

  it("resets all movement paths", () => {
    const result = undoMove({
      futureUnits: [[makeUnit()], [null as any]],
      futureUnitsHistory: [[makeUnit()]],
      unitsCount: 3,
      isPlayer: 0,
    });

    expect(result.movementPaths).toEqual([null, null, null]);
  });
});
