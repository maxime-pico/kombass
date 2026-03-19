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
  isPlayer: 0 | 1;
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

export enum GamePhase {
  LOBBY = "LOBBY",
  PLACEMENT = "PLACEMENT",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  ABANDONED = "ABANDONED",
}
