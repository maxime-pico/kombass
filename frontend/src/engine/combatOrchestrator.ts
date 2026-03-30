import type { IUnit, IFlag, IAnimationPhase } from "../types";

interface CombatResults {
  newFutureUnits: Array<Array<IUnit>>;
  flags: Array<IFlag>;
  firstLivingUnitIndex: number;
}

export function buildFinalCombatState(
  results: CombatResults,
  currentState: { unitsCount: number; playerIndex: 0 | 1; round: number }
) {
  return {
    units: results.newFutureUnits,
    futureUnits: [
      Array(currentState.unitsCount).fill(null),
      Array(currentState.unitsCount).fill(null),
    ],
    futureUnitsHistory: [] as Array<Array<IUnit>>,
    movementPaths: Array(currentState.unitsCount).fill(null),
    waitingForMoves: [false, false],
    round: currentState.round + 1,
    step: results.firstLivingUnitIndex,
    selectedUnit: {
      playerNumber: currentState.playerIndex,
      unitNumber: results.firstLivingUnitIndex,
    },
    animationPhase: {
      isAnimating: false,
      currentAnimationIndex: 0,
      animationSubPhase: 'idle' as const,
      queue: [],
      boomQueue: [],
      deadUnits: new Set<string>(),
    } as IAnimationPhase,
    flags: results.flags,
  };
}
