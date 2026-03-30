import type { IFlag } from "../types";

export function buildUnitCountState(count: number) {
  return {
    units: Array(2).fill(
      Array(count).fill({
        strength: 1,
        range: 1,
        speed: 3,
        x: 12,
        y: 6,
        life: 1,
        hasFlag: false,
        unitType: 0,
      })
    ),
    futureUnits: [Array(count).fill(null), Array(count).fill(null)],
    movementPaths: Array(count).fill(null),
    placedUnits: [Array(count).fill(false), Array(count).fill(false)],
    unitsCount: count,
  };
}

export function buildBoardSizeState(length: number, width: number, customFlags?: Array<IFlag>) {
  return {
    boardLength: length,
    boardWidth: width,
    flags: customFlags || [
      {
        x: 0,
        y: Math.floor(length / 2),
        originX: 0,
        originY: Math.floor(length / 2),
        inZone: true,
      },
      {
        x: width - 1,
        y: Math.floor(length / 2),
        originX: width - 1,
        originY: Math.floor(length / 2),
        inZone: true,
      },
    ],
  };
}
