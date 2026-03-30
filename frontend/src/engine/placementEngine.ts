/**
 * Pure functions for unit placement logic.
 * Extracted from App.tsx _placeUnit for testability.
 */
import { IUnit } from "../types";

export interface PlaceUnitInput {
  units: IUnit[][];
  placedUnits: boolean[][];
  isPlayer: 0 | 1;
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
  const { isPlayer, unitNumber, col, row, unitsCount } = input;

  // Deep copy the player's units
  const units = input.units.map(playerUnits => [...playerUnits]);
  const currentPlayerUnits = [...units[isPlayer]];
  currentPlayerUnits[unitNumber] = { ...currentPlayerUnits[unitNumber], x: col, y: row };
  units[isPlayer] = currentPlayerUnits;

  // Update placement matrix
  const placedUnits = input.placedUnits.map(playerPlaced => [...playerPlaced]);
  const currentPlayerPlaced = [...placedUnits[isPlayer]];
  currentPlayerPlaced[unitNumber] = true;
  placedUnits[isPlayer] = currentPlayerPlaced;

  // Next unit wraps around
  const nextUnitNumber = (unitNumber + 1) % unitsCount;

  return { units, placedUnits, nextUnitNumber };
}
