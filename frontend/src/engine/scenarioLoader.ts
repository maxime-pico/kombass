import { scenarios, TestScenario } from "./scenarios";
import { IUnit, IFlag } from "../App";

export interface LoadedScenario {
  units: IUnit[][];
  futureUnits: IUnit[][];
  flags: IFlag[];
  unitsCount: number;
  isPlayer: 0 | 1;
  step: number;
  isTestScenario?: boolean;
}

/**
 * Convert a TestScenario into a partial AppState shape suitable for injection.
 */
export function loadScenario(scenario: TestScenario): LoadedScenario {
  return {
    units: scenario.input.units,
    futureUnits: scenario.input.futureUnits,
    flags: scenario.input.flags,
    unitsCount: scenario.input.unitsCount,
    isPlayer: scenario.input.isPlayer,
    // step = unitsCount puts app in combat phase, ready to play
    step: scenario.input.unitsCount,
    isTestScenario: true,
  };
}

export { scenarios };
export type { TestScenario };
