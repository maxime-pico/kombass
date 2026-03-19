import {
  createInitialState,
  transitionPhase,
  placeUnits,
  submitMoves,
  GameState,
} from "../../engine/gameStateMachine";
import { GamePhase } from "../../../../shared/types";

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: GamePhase.LOBBY,
    round: 0,
    units: [[], []],
    futureUnits: [null, null],
    flags: [
      { x: 0, y: 10, originX: 0, originY: 10, inZone: true },
      { x: 21, y: 10, originX: 21, originY: 10, inZone: true },
    ],
    isReady: [false, false],
    unitsCount: 5,
    boardWidth: 22,
    boardLength: 21,
    placementZone: 5,
    flagStayInPlace: false,
    winner: null,
    ...overrides,
  };
}

function makeUnit(overrides: any = {}) {
  return {
    x: 0, y: 0, strength: 2, range: 2, speed: 2, life: 2,
    hasFlag: false, unitType: 1, ...overrides,
  };
}

function makeFlag(overrides: any = {}) {
  return { x: 0, y: 10, originX: 0, originY: 10, inZone: true, ...overrides };
}

describe("Phase transitions", () => {
  test("LOBBY → PLACEMENT is valid", () => {
    const state = makeState({ phase: GamePhase.LOBBY });
    const result = transitionPhase(state, GamePhase.PLACEMENT);
    expect(result.state.phase).toBe(GamePhase.PLACEMENT);
  });

  test("PLACEMENT → ACTIVE is valid", () => {
    const state = makeState({ phase: GamePhase.PLACEMENT });
    const result = transitionPhase(state, GamePhase.ACTIVE);
    expect(result.state.phase).toBe(GamePhase.ACTIVE);
  });

  test("ACTIVE → COMPLETED is valid", () => {
    const state = makeState({ phase: GamePhase.ACTIVE });
    const result = transitionPhase(state, GamePhase.COMPLETED);
    expect(result.state.phase).toBe(GamePhase.COMPLETED);
  });

  test("any → ABANDONED is valid", () => {
    for (const phase of [GamePhase.LOBBY, GamePhase.PLACEMENT, GamePhase.ACTIVE]) {
      const state = makeState({ phase });
      const result = transitionPhase(state, GamePhase.ABANDONED);
      expect(result.state.phase).toBe(GamePhase.ABANDONED);
    }
  });

  test("reject invalid transitions", () => {
    const state = makeState({ phase: GamePhase.LOBBY });
    const result = transitionPhase(state, GamePhase.ACTIVE);
    expect(result.error).toBeDefined();
  });

  test("reject transitions from terminal states", () => {
    for (const phase of [GamePhase.COMPLETED, GamePhase.ABANDONED]) {
      const state = makeState({ phase });
      const result = transitionPhase(state, GamePhase.ACTIVE);
      expect(result.error).toBeDefined();
    }
  });
});

describe("Placement guards", () => {
  test("reject placement in wrong phase", () => {
    const state = makeState({ phase: GamePhase.LOBBY });
    const result = placeUnits(state, {
      playerNumber: 0,
      units: [makeUnit()],
      flag: makeFlag(),
    });
    expect(result.error).toBeDefined();
  });

  test("reject duplicate placement", () => {
    const state = makeState({
      phase: GamePhase.PLACEMENT,
      isReady: [true, false],
    });
    const result = placeUnits(state, {
      playerNumber: 0,
      units: [makeUnit()],
      flag: makeFlag(),
    });
    expect(result.error).toBeDefined();
  });

  test("reject wrong unit count", () => {
    const state = makeState({ phase: GamePhase.PLACEMENT, unitsCount: 5 });
    const result = placeUnits(state, {
      playerNumber: 0,
      units: [makeUnit(), makeUnit()], // only 2 instead of 5
      flag: makeFlag(),
    });
    expect(result.error).toBeDefined();
  });

  test("reject units outside placement zone", () => {
    const state = makeState({ phase: GamePhase.PLACEMENT, unitsCount: 1, placementZone: 5 });
    const result = placeUnits(state, {
      playerNumber: 0,
      units: [makeUnit({ x: 10, y: 10 })], // center, outside zone
      flag: makeFlag(),
    });
    expect(result.error).toBeDefined();
  });

  test("reject overlapping unit positions", () => {
    const state = makeState({ phase: GamePhase.PLACEMENT, unitsCount: 2 });
    const result = placeUnits(state, {
      playerNumber: 0,
      units: [makeUnit({ x: 0, y: 0 }), makeUnit({ x: 0, y: 0 })],
      flag: makeFlag(),
    });
    expect(result.error).toBeDefined();
  });

  test("reject flag outside placement zone", () => {
    const state = makeState({ phase: GamePhase.PLACEMENT, unitsCount: 1 });
    const result = placeUnits(state, {
      playerNumber: 0,
      units: [makeUnit({ x: 0, y: 0 })],
      flag: makeFlag({ x: 10, y: 10 }),
    });
    expect(result.error).toBeDefined();
  });
});

describe("Move submission guards", () => {
  test("reject moves in wrong phase", () => {
    const state = makeState({ phase: GamePhase.PLACEMENT });
    const result = submitMoves(state, {
      playerNumber: 0,
      futureUnits: [makeUnit()],
      round: 0,
    });
    expect(result.error).toBeDefined();
  });

  test("reject duplicate submit in same round", () => {
    const state = makeState({
      phase: GamePhase.ACTIVE,
      futureUnits: [[makeUnit()], null], // P0 already submitted
    });
    const result = submitMoves(state, {
      playerNumber: 0,
      futureUnits: [makeUnit()],
      round: 0,
    });
    expect(result.error).toBeDefined();
  });

  test("reject wrong round number", () => {
    const state = makeState({ phase: GamePhase.ACTIVE, round: 3 });
    const result = submitMoves(state, {
      playerNumber: 0,
      futureUnits: [makeUnit()],
      round: 2, // stale round
    });
    expect(result.error).toBeDefined();
  });

  test("reject dead units moved", () => {
    const state = makeState({
      phase: GamePhase.ACTIVE,
      unitsCount: 1,
      units: [[makeUnit({ x: 5, y: 5, life: -1 })], [makeUnit()]],
    });
    const result = submitMoves(state, {
      playerNumber: 0,
      futureUnits: [makeUnit({ x: 6, y: 5, life: -1 })], // moved a dead unit
      round: 0,
    });
    expect(result.error).toBeDefined();
  });

  test("reject units exceeding speed", () => {
    const state = makeState({
      phase: GamePhase.ACTIVE,
      unitsCount: 1,
      units: [[makeUnit({ x: 5, y: 5, speed: 2 })], [makeUnit()]],
    });
    const result = submitMoves(state, {
      playerNumber: 0,
      futureUnits: [makeUnit({ x: 5, y: 10 })], // moved 5 tiles, speed is 2
      round: 0,
    });
    expect(result.error).toBeDefined();
  });

  test("reject overlapping future positions", () => {
    const state = makeState({
      phase: GamePhase.ACTIVE,
      unitsCount: 2,
      units: [[makeUnit({ x: 0, y: 0 }), makeUnit({ x: 1, y: 0 })], [makeUnit()]],
    });
    const result = submitMoves(state, {
      playerNumber: 0,
      futureUnits: [makeUnit({ x: 1, y: 1 }), makeUnit({ x: 1, y: 1 })], // overlap
      round: 0,
    });
    expect(result.error).toBeDefined();
  });
});

describe("Round advancement", () => {
  test("no advance with only one submission", () => {
    const state = makeState({
      phase: GamePhase.ACTIVE,
      round: 0,
      unitsCount: 1,
      units: [[makeUnit({ x: 0, y: 0 })], [makeUnit({ x: 20, y: 20 })]],
    });
    const result = submitMoves(state, {
      playerNumber: 0,
      futureUnits: [makeUnit({ x: 1, y: 0 })],
      round: 0,
    });
    expect(result.state.round).toBe(0);
    expect(result.combatResult).toBeUndefined();
  });

  test("trigger combat when both submit", () => {
    const state = makeState({
      phase: GamePhase.ACTIVE,
      round: 0,
      unitsCount: 1,
      units: [[makeUnit({ x: 5, y: 5 })], [makeUnit({ x: 6, y: 5 })]],
      futureUnits: [[makeUnit({ x: 5, y: 5 })], null], // P0 already submitted
    });
    const result = submitMoves(state, {
      playerNumber: 1,
      futureUnits: [makeUnit({ x: 6, y: 5 })],
      round: 0,
    });
    expect(result.combatResult).toBeDefined();
  });

  test("increment round after combat", () => {
    const state = makeState({
      phase: GamePhase.ACTIVE,
      round: 0,
      unitsCount: 1,
      units: [[makeUnit({ x: 0, y: 0 })], [makeUnit({ x: 20, y: 20 })]],
      futureUnits: [[makeUnit({ x: 1, y: 0 })], null],
    });
    const result = submitMoves(state, {
      playerNumber: 1,
      futureUnits: [makeUnit({ x: 19, y: 20 })],
      round: 0,
    });
    expect(result.state.round).toBe(1);
  });

  test("reset futureUnits after combat", () => {
    const state = makeState({
      phase: GamePhase.ACTIVE,
      round: 0,
      unitsCount: 1,
      units: [[makeUnit({ x: 0, y: 0 })], [makeUnit({ x: 20, y: 20 })]],
      futureUnits: [[makeUnit({ x: 1, y: 0 })], null],
    });
    const result = submitMoves(state, {
      playerNumber: 1,
      futureUnits: [makeUnit({ x: 19, y: 20 })],
      round: 0,
    });
    expect(result.state.futureUnits).toEqual([null, null]);
  });
});

describe("Combat integration", () => {
  test("correct input shape to calculateCombatResults", () => {
    const state = makeState({
      phase: GamePhase.ACTIVE,
      round: 0,
      unitsCount: 1,
      units: [[makeUnit({ x: 5, y: 5 })], [makeUnit({ x: 6, y: 5 })]],
      futureUnits: [[makeUnit({ x: 5, y: 5 })], null],
    });
    const result = submitMoves(state, {
      playerNumber: 1,
      futureUnits: [makeUnit({ x: 6, y: 5 })],
      round: 0,
    });
    expect(result.combatResult).toBeDefined();
    expect(result.combatResult!.newFutureUnits).toHaveLength(2);
  });

  test("win check after combat — flag capture transitions to COMPLETED", () => {
    const state = makeState({
      phase: GamePhase.ACTIVE,
      round: 0,
      unitsCount: 1,
      units: [
        [makeUnit({ x: 1, y: 10, hasFlag: true, life: 2 })],
        [makeUnit({ x: 20, y: 20, life: 2 })],
      ],
      futureUnits: [
        [makeUnit({ x: 1, y: 10, hasFlag: true, life: 2 })],
        null,
      ],
      flags: [
        { x: 0, y: 10, originX: 0, originY: 10, inZone: true },
        { x: 21, y: 10, originX: 21, originY: 10, inZone: false },
      ],
    });
    const result = submitMoves(state, {
      playerNumber: 1,
      futureUnits: [makeUnit({ x: 20, y: 20 })],
      round: 0,
    });
    expect(result.state.phase).toBe(GamePhase.COMPLETED);
    expect(result.state.winner).toBe(0);
  });

  test("mutual destruction transitions to COMPLETED with no winner", () => {
    const state = makeState({
      phase: GamePhase.ACTIVE,
      round: 0,
      unitsCount: 1,
      units: [
        [makeUnit({ x: 5, y: 5, life: 1, strength: 3 })],
        [makeUnit({ x: 6, y: 5, life: 1, strength: 3 })],
      ],
      futureUnits: [
        [makeUnit({ x: 5, y: 5, life: 1, strength: 3 })],
        null,
      ],
    });
    const result = submitMoves(state, {
      playerNumber: 1,
      futureUnits: [makeUnit({ x: 6, y: 5, life: 1, strength: 3 })],
      round: 0,
    });
    expect(result.state.phase).toBe(GamePhase.COMPLETED);
    expect(result.state.winner).toBeNull();
  });

  test("stay ACTIVE on no win", () => {
    const state = makeState({
      phase: GamePhase.ACTIVE,
      round: 0,
      unitsCount: 1,
      units: [[makeUnit({ x: 0, y: 0 })], [makeUnit({ x: 20, y: 20 })]],
      futureUnits: [[makeUnit({ x: 1, y: 0 })], null],
    });
    const result = submitMoves(state, {
      playerNumber: 1,
      futureUnits: [makeUnit({ x: 19, y: 20 })],
      round: 0,
    });
    expect(result.state.phase).toBe(GamePhase.ACTIVE);
    expect(result.state.winner).toBeNull();
  });
});

describe("Edge cases", () => {
  test("double submit rejected", () => {
    const state = makeState({
      phase: GamePhase.ACTIVE,
      futureUnits: [[makeUnit()], null],
    });
    const result = submitMoves(state, {
      playerNumber: 0,
      futureUnits: [makeUnit()],
      round: 0,
    });
    expect(result.error).toBeDefined();
  });

  test("submit after game over rejected", () => {
    const state = makeState({ phase: GamePhase.COMPLETED });
    const result = submitMoves(state, {
      playerNumber: 0,
      futureUnits: [makeUnit()],
      round: 0,
    });
    expect(result.error).toBeDefined();
  });

  test("wrong player number rejected", () => {
    const state = makeState({ phase: GamePhase.ACTIVE });
    const result = submitMoves(state, {
      playerNumber: 2 as any,
      futureUnits: [makeUnit()],
      round: 0,
    });
    expect(result.error).toBeDefined();
  });
});
