/**
 * Pure functions for unit placement logic.
 * Extracted from App.tsx placeUnit for testability.
 */
import { IUnit } from "../types";

export interface PlaceUnitInput {
  units: IUnit[][];
  placedUnits: boolean[][];
  playerIndex: 0 | 1;
  unitNumber: number;
  col: number;
  row: number;
  unitsCount: number;
}

export interface PlaceUnitResult {
  units: IUnit[][];
  placedUnits: boolean[][];
  nextUnitNumber: number;
}

/**
 * Compute new state after placing a unit at (col, row).
 * Returns updated units array, placement matrix, and next unit to place.
 */
export function placeUnit(input: PlaceUnitInput): PlaceUnitResult {
  const { playerIndex, unitNumber, col, row, unitsCount } = input;

  // Deep copy the player's units
  const units = input.units.map(playerUnits => [...playerUnits]);
  const currentPlayerUnits = [...units[playerIndex]];
  currentPlayerUnits[unitNumber] = { ...currentPlayerUnits[unitNumber], x: col, y: row };
  units[playerIndex] = currentPlayerUnits;

  // Update placement matrix
  const placedUnits = input.placedUnits.map(playerPlaced => [...playerPlaced]);
  const currentPlayerPlaced = [...placedUnits[playerIndex]];
  currentPlayerPlaced[unitNumber] = true;
  placedUnits[playerIndex] = currentPlayerPlaced;

  // Next unit wraps around
  const nextUnitNumber = (unitNumber + 1) % unitsCount;

  return { units, placedUnits, nextUnitNumber };
}
