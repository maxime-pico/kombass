/**
 * Pure functions for unit movement logic.
 * Extracted from App.tsx changePosition and undoMove for testability.
 */
import { IUnit, IFlag } from "../types";

export interface ChangePositionInput {
  units: IUnit[][];
  futureUnits: IUnit[][];
  futureUnitsHistory: IUnit[][];
  movementPaths: (Array<{ x: number; y: number }> | null)[];
  flags: IFlag[];
  playerNumber: number;
  unitNumber: number;
  x: number;
  y: number;
  path?: Array<{ x: number; y: number }>;
}

export interface ChangePositionResult {
  futureUnits: IUnit[][];
  futureUnitsHistory: IUnit[][];
  movementPaths: (Array<{ x: number; y: number }> | null)[];
}

/**
 * Compute new state after a unit is moved to (x, y).
 * Handles flag capture detection and movement path recording.
 */
export function changePosition(input: ChangePositionInput): ChangePositionResult {
  const {
    units, flags, playerNumber, unitNumber, x, y, path,
  } = input;

  const life = units[playerNumber][unitNumber]?.life;
  const currentPlayerUnit = units[playerNumber][unitNumber];
  const opponentNumber = (playerNumber + 1) % 2;

  // Build updated future unit
  let futurePlayerUnit: IUnit = {
    ...currentPlayerUnit,
    x,
    y,
    life,
  };

  // Check if the unit captures the opponent's flag
  if (
    flags[opponentNumber].x === x &&
    flags[opponentNumber].y === y &&
    flags[opponentNumber].inZone &&
    life > 0
  ) {
    futurePlayerUnit = { ...futurePlayerUnit, hasFlag: true };
  }

  // Build new futureUnits array
  const futurePlayerUnits = [...input.futureUnits[playerNumber]];
  futurePlayerUnits[unitNumber] = futurePlayerUnit;

  const futureOpponentUnits = [...input.futureUnits[opponentNumber]];
  const newFutureUnits: IUnit[][] = [];
  newFutureUnits[opponentNumber] = futureOpponentUnits;
  newFutureUnits[playerNumber] = futurePlayerUnits;

  // Update history
  const newHistory = [...input.futureUnitsHistory, futurePlayerUnits];

  // Update movement paths
  const newPaths = [...input.movementPaths];
  const originX = currentPlayerUnit.x;
  const originY = currentPlayerUnit.y;
  newPaths[unitNumber] = (x === originX && y === originY) ? null : (path || null);

  return {
    futureUnits: newFutureUnits,
    futureUnitsHistory: newHistory,
    movementPaths: newPaths,
  };
}

export interface UndoMoveInput {
  futureUnits: IUnit[][];
  futureUnitsHistory: IUnit[][];
  unitsCount: number;
  playerIndex: 0 | 1;
}

export interface UndoMoveResult {
  futureUnits: IUnit[][];
  futureUnitsHistory: IUnit[][];
  movementPaths: (Array<{ x: number; y: number }> | null)[];
}

/**
 * Compute new state after undoing the last move.
 * Pops the last entry from history and reverts futureUnits.
 */
export function undoMove(input: UndoMoveInput): UndoMoveResult {
  const { futureUnits, playerIndex, unitsCount } = input;
  const newHistory = [...input.futureUnitsHistory];
  newHistory.pop();

  const myFutureUnits = newHistory.length
    ? newHistory[newHistory.length - 1]
    : Array(unitsCount).fill(null);

  const newFutureUnits = [...futureUnits];
  newFutureUnits[playerIndex] = [...myFutureUnits];

  return {
    futureUnits: newFutureUnits,
    futureUnitsHistory: newHistory,
    movementPaths: Array(unitsCount).fill(null),
  };
}
