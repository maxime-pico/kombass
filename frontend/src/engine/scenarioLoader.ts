import { scenarios, TestScenario } from "./scenarios";
import { IUnit, IFlag } from "../types";

export interface LoadedScenario {
  units: IUnit[][];
  futureUnits: IUnit[][];
  flags: IFlag[];
  unitsCount: number;
  playerIndex: 0 | 1;
  step: number;
  isTestScenario?: boolean;
  flagStayInPlace?: boolean;
  terrain: Array<{ x: number; y: number }>;
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
    playerIndex: scenario.input.playerIndex,
    // step = unitsCount puts app in combat phase, ready to play
    step: scenario.input.unitsCount,
    isTestScenario: true,
    flagStayInPlace: scenario.input.flagStayInPlace ?? false,
    terrain: scenario.terrain ?? [],
  };
}

export { scenarios };
export type { TestScenario };
