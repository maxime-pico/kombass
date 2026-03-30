/**
 * Shared types — keep in sync with shared/types.ts
 *
 * CRA restricts imports to within src/, so we can't import directly from
 * the shared/ directory. These types mirror shared/types.ts and must be
 * updated when shared types change.
 */

export type IUnit = {
  strength: number;
  range: number;
  speed: number;
  x: number;
  y: number;
  life: number;
  hasFlag: boolean;
  unitType: number; // 0=light, 1=medium, 2=heavy (sprite/cycling index, decoupled from stats)
};

export type IFlag = { x: number; y: number; originX: number; originY: number; inZone: boolean };

export type IGameSettings = {
  boardWidth: number;
  boardLength: number;
  placementZone: number;
  unitsCount: number;
  unitConfig?: UnitConfig;
  terrain?: Array<{ x: number; y: number }>;
  randomTerrain?: boolean;
  flagStayInPlace?: boolean;
};

export type UnitConfig = {
  light: { strength: number; range: number; speed: number; life: number };
  medium: { strength: number; range: number; speed: number; life: number };
  heavy: { strength: number; range: number; speed: number; life: number };
};

export interface CombatInput {
  units: IUnit[][];
  futureUnits: IUnit[][];
  flags: IFlag[];
  playerIndex: 0 | 1;
  unitsCount: number;
  flagStayInPlace?: boolean;
}

export interface CombatResult {
  newFutureUnits: IUnit[][];
  flags: IFlag[];
  firstLivingUnitIndex: number;
}

export interface WinResult {
  gameOver: string;
  winner: number | null;
  loser: number | null;
}

/**
 * Frontend-only types
 */

export type IPlayer = 0 | 1;
export type IPlayers = Array<{ name: string; color: string }>;

export type ISelectedUnit = {
  playerNumber: number;
  unitNumber: number;
};

export type IAnimationItem = {
  player: 0 | 1;
  unitIndex: number;
  unit: IUnit;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  path?: Array<{ x: number; y: number }>;
};

export type IBoomEvent = {
  afterAnimationIndex: number;
  x: number;
  y: number;
};

export type AnimationSubPhase = 'idle' | 'pre-move' | 'moving' | 'post-move' | 'scanning' | 'targeting' | 'combat';

export type IAnimationPhase = {
  isAnimating: boolean;
  currentAnimationIndex: number;
  animationSubPhase: AnimationSubPhase;
  queue: Array<IAnimationItem>;
  boomQueue: Array<IBoomEvent>;
  deadUnits: Set<string>; // Format: "player_unitIndex" (e.g., "0_2" for player 0, unit 2)
};
