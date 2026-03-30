import { IUnit, IFlag, GamePhase, CombatResult } from "../../../shared/types";
import { calculateCombatResults } from "../../../shared/engine/combatEngine";
import { checkWinCondition } from "../../../shared/engine/winCondition";

export interface GameState {
  phase: GamePhase;
  round: number;
  units: IUnit[][];
  futureUnits: (IUnit[] | null)[];
  flags: IFlag[];
  isReady: [boolean, boolean];
  unitsCount: number;
  boardWidth: number;
  boardLength: number;
  placementZone: number;
  flagStayInPlace: boolean;
  winner: number | null;
}

export interface PlacementInput {
  playerNumber: 0 | 1;
  units: IUnit[];
  flag: IFlag;
}

export interface MoveInput {
  playerNumber: 0 | 1;
  futureUnits: IUnit[];
  round: number;
}

export interface TransitionResult {
  state: GameState;
  combatResult?: CombatResult;
  error?: string;
}

const VALID_TRANSITIONS: Record<string, GamePhase[]> = {
  [GamePhase.LOBBY]: [GamePhase.PLACEMENT, GamePhase.ABANDONED],
  [GamePhase.PLACEMENT]: [GamePhase.ACTIVE, GamePhase.ABANDONED],
  [GamePhase.ACTIVE]: [GamePhase.COMPLETED, GamePhase.ABANDONED],
  [GamePhase.COMPLETED]: [],
  [GamePhase.ABANDONED]: [],
};

export function createInitialState(config: {
  boardWidth?: number;
  boardLength?: number;
  placementZone?: number;
  unitsCount?: number;
  flagStayInPlace?: boolean;
} = {}): GameState {
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
    unitsCount: config.unitsCount ?? 5,
    boardWidth: config.boardWidth ?? 22,
    boardLength: config.boardLength ?? 21,
    placementZone: config.placementZone ?? 5,
    flagStayInPlace: config.flagStayInPlace ?? false,
    winner: null,
  };
}

export function transitionPhase(state: GameState, to: GamePhase): TransitionResult {
  const allowed = VALID_TRANSITIONS[state.phase] || [];
  if (!allowed.includes(to)) {
    return { state, error: `Invalid transition from ${state.phase} to ${to}` };
  }
  return { state: { ...state, phase: to } };
}

export function placeUnits(state: GameState, input: PlacementInput): TransitionResult {
  const { playerNumber, units, flag } = input;

  if (state.phase !== GamePhase.PLACEMENT) {
    return { state, error: `Cannot place units in phase ${state.phase}` };
  }

  if (state.isReady[playerNumber]) {
    return { state, error: `Player ${playerNumber} already placed units` };
  }

  if (units.length !== state.unitsCount) {
    return { state, error: `Expected ${state.unitsCount} units, got ${units.length}` };
  }

  // Check placement zone
  for (const unit of units) {
    if (playerNumber === 0 && unit.x >= state.placementZone) {
      return { state, error: `Unit at (${unit.x},${unit.y}) outside P0 placement zone` };
    }
    if (playerNumber === 1 && unit.x < state.boardWidth - state.placementZone) {
      return { state, error: `Unit at (${unit.x},${unit.y}) outside P1 placement zone` };
    }
  }

  // Check flag placement zone
  if (playerNumber === 0 && flag.x >= state.placementZone) {
    return { state, error: `Flag at (${flag.x},${flag.y}) outside P0 placement zone` };
  }
  if (playerNumber === 1 && flag.x < state.boardWidth - state.placementZone) {
    return { state, error: `Flag at (${flag.x},${flag.y}) outside P1 placement zone` };
  }

  // Check duplicate positions
  const positions = new Set<string>();
  for (const unit of units) {
    const key = `${unit.x},${unit.y}`;
    if (positions.has(key)) {
      return { state, error: `Duplicate unit position at (${unit.x},${unit.y})` };
    }
    positions.add(key);
  }

  const newUnits = [...state.units];
  newUnits[playerNumber] = units;

  const newFlags = [...state.flags] as IFlag[];
  newFlags[playerNumber] = flag;

  const newIsReady: [boolean, boolean] = [...state.isReady] as [boolean, boolean];
  newIsReady[playerNumber] = true;

  let newPhase: GamePhase = state.phase;
  if (newIsReady[0] && newIsReady[1]) {
    newPhase = GamePhase.ACTIVE;
  }

  return {
    state: {
      ...state,
      units: newUnits,
      flags: newFlags,
      isReady: newIsReady,
      phase: newPhase,
    },
  };
}

export function submitMoves(state: GameState, input: MoveInput): TransitionResult {
  const { playerNumber, futureUnits, round } = input;

  if (state.phase !== GamePhase.ACTIVE) {
    return { state, error: `Cannot submit moves in phase ${state.phase}` };
  }

  if (playerNumber !== 0 && playerNumber !== 1) {
    return { state, error: `Invalid player number: ${playerNumber}` };
  }

  if (state.futureUnits[playerNumber] !== null) {
    return { state, error: `Player ${playerNumber} already submitted moves` };
  }

  if (round !== state.round) {
    return { state, error: `Wrong round: expected ${state.round}, got ${round}` };
  }

  // Validate dead units don't move
  const currentUnits = state.units[playerNumber];
  for (let i = 0; i < currentUnits.length; i++) {
    if (currentUnits[i] && currentUnits[i].life <= 0) {
      if (futureUnits[i] && (futureUnits[i].x !== currentUnits[i].x || futureUnits[i].y !== currentUnits[i].y)) {
        return { state, error: `Dead unit ${i} cannot move` };
      }
    }
  }

  // Validate speed
  for (let i = 0; i < currentUnits.length; i++) {
    if (currentUnits[i] && currentUnits[i].life > 0 && futureUnits[i]) {
      const dx = Math.abs(futureUnits[i].x - currentUnits[i].x);
      const dy = Math.abs(futureUnits[i].y - currentUnits[i].y);
      if (dx + dy > currentUnits[i].speed) {
        return { state, error: `Unit ${i} moved ${dx + dy} tiles but speed is ${currentUnits[i].speed}` };
      }
    }
  }

  // Check duplicate future positions among living units
  const livingPositions = new Set<string>();
  for (let i = 0; i < futureUnits.length; i++) {
    if (currentUnits[i] && currentUnits[i].life > 0 && futureUnits[i]) {
      const key = `${futureUnits[i].x},${futureUnits[i].y}`;
      if (livingPositions.has(key)) {
        return { state, error: `Duplicate future position at (${futureUnits[i].x},${futureUnits[i].y})` };
      }
      livingPositions.add(key);
    }
  }

  // Set futureUnits for this player
  const newFutureUnits = [...state.futureUnits];
  newFutureUnits[playerNumber] = futureUnits;

  const opponentNumber = playerNumber === 0 ? 1 : 0;

  // If only one player submitted, return without combat
  if (newFutureUnits[opponentNumber] === null) {
    return {
      state: { ...state, futureUnits: newFutureUnits },
    };
  }

  // Both submitted — run combat from P0's perspective
  const combatResult = calculateCombatResults({
    units: state.units,
    futureUnits: newFutureUnits as IUnit[][],
    flags: state.flags,
    playerIndex: 0,
    unitsCount: state.unitsCount,
    flagStayInPlace: state.flagStayInPlace,
  });

  // Update units from combat results
  const newUnits = combatResult.newFutureUnits;

  // Check win condition
  const winResult = checkWinCondition(
    newUnits,
    combatResult.flags,
    state.unitsCount
  );

  let newPhase: GamePhase = state.phase;
  let winner = state.winner;
  if (winResult.winner !== null || winResult.gameOver !== "") {
    newPhase = GamePhase.COMPLETED;
    winner = winResult.winner;
  }

  return {
    state: {
      ...state,
      units: newUnits,
      flags: combatResult.flags,
      futureUnits: [null, null],
      round: state.round + 1,
      phase: newPhase,
      winner,
    },
    combatResult,
  };
}
