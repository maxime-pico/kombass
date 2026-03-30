import type { IUnit } from "../types";

type SetStateFn = (state: any) => void;
type CalculateCombatFn = () => any;

export function setupTestApi(
  setState: SetStateFn,
  getState: () => any,
  calculateCombatResults: CalculateCombatFn,
) {
  const { loadScenario, scenarios } = require("./scenarioLoader");

  (window as any).__KOMBASS_TEST_API__ = {
    loadScenario: (scenarioNameOrIndex: string | number) => {
      const scenario =
        typeof scenarioNameOrIndex === "number"
          ? scenarios[scenarioNameOrIndex]
          : scenarios.find((s: any) => s.name === scenarioNameOrIndex);
      if (!scenario) {
        console.error("Unknown scenario:", scenarioNameOrIndex);
        return;
      }
      const loaded = loadScenario(scenario);
      setState({
        units: loaded.units,
        futureUnits: loaded.futureUnits,
        flags: loaded.flags,
        unitsCount: loaded.unitsCount,
        playerIndex: loaded.playerIndex,
        step: loaded.step,
        gameStarted: true,
        ready: [true, true],
        isTestScenario: loaded.isTestScenario || false,
        flagStayInPlace: loaded.flagStayInPlace ?? false,
        terrain: loaded.terrain || [],
      });
    },
    getState: () => ({ ...getState() }),
    triggerCombat: () => calculateCombatResults(),
    setStep: (step: number) => setState({ step }),
    getScenarios: () => scenarios.map((s: any, i: number) => ({ index: i, name: s.name, description: s.description })),
    loadUndoScenario: () => {
      const aliveUnit = (x: number, y: number) => ({
        x, y, strength: 2, range: 2, speed: 2, life: 2,
        hasFlag: false, unitType: 1,
      });
      const dead = {
        x: 5, y: 5, strength: 0, range: 0, speed: 0, life: -1,
        hasFlag: false, unitType: 1,
      };
      const units: IUnit[][] = [
        [aliveUnit(2, 2), dead, aliveUnit(8, 8)],
        [aliveUnit(18, 18), aliveUnit(17, 17), aliveUnit(16, 16)],
      ];
      const movedUnit0 = { ...aliveUnit(3, 3) };
      const movedUnit2 = { ...aliveUnit(9, 9) };
      const futureUnits: Array<Array<IUnit>> = [
        [movedUnit0, null as any, movedUnit2],
        Array(3).fill(null),
      ];
      const futureUnitsHistory: Array<Array<IUnit>> = [
        [movedUnit0, null as any, null as any],
        [movedUnit0, null as any, movedUnit2],
      ];
      setState({
        units,
        futureUnits,
        futureUnitsHistory,
        flags: [
          { x: 0, y: 10, originX: 0, originY: 10, inZone: true },
          { x: 20, y: 10, originX: 20, originY: 10, inZone: true },
        ],
        unitsCount: 3,
        playerIndex: 0,
        step: 3,
        gameStarted: true,
        ready: [true, true],
        isTestScenario: true,
        boardLength: 21,
        boardWidth: 21,
        selectedUnit: { playerNumber: -1, unitNumber: -1 },
        round: 2,
      });
    },
  };

  // Auto-load scenario from sessionStorage if present
  const storedScenario = sessionStorage.getItem("KOMBASS_TEST_SCENARIO");
  if (storedScenario) {
    sessionStorage.removeItem("KOMBASS_TEST_SCENARIO");
    setTimeout(() => {
      (window as any).__KOMBASS_TEST_API__.loadScenario(storedScenario);
    }, 0);
  }

  const undoScenario = sessionStorage.getItem("KOMBASS_UNDO_SCENARIO");
  if (undoScenario) {
    sessionStorage.removeItem("KOMBASS_UNDO_SCENARIO");
    setTimeout(() => {
      (window as any).__KOMBASS_TEST_API__.loadUndoScenario();
    }, 0);
  }
}
