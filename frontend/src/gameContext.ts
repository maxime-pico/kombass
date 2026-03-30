import React from "react";
import { IUnit, ISelectedUnit, IFlag, IPlayers, IAnimationPhase } from "./types";
import type { UnitConfig } from "./utilities/dict";
import { defaultUnitConfig } from "./utilities/dict";

export function dispatchCustomEvent(eventType: string, data: any) {
  const event = new CustomEvent(eventType, { detail: data });
  document.dispatchEvent(event);
}

export function isCustomEvent(event: Event): event is CustomEvent {
  return "detail" in event;
}

export interface IGameContextProps {
  applyBufferedMoves: () => void;
  applyMoves: () => Promise<any>;
  changeStep: (step: number, direction: -1 | 1) => void;
  changePosition: (
    playerNumber: number,
    unitNumber: number,
    x: number,
    y: number,
    path?: Array<{ x: number; y: number }>
  ) => void;
  circlePlayer: () => void;
  circleUnit: (
    playerIndex: number,
    unitIndex: number,
    currentType: number,
    direction: number
  ) => void;
  createRoom: () => Promise<void>;
  placeUnit: (unitNumber: number, col: number, row: number) => void;
  startGame: () => Promise<void>;
  setBoardSize: (length: number, width: number, customFlags?: Array<IFlag>) => void;
  setGameStarted: () => void;
  setInRoom: (inRoom: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setPlayerIndex: (playerIndex: 0 | 1) => void;
  setPlacementZone: (zoneSize: number) => void;
  setTerrain: (terrain: Array<{ x: number; y: number }>) => void;
  setFlags: (flags: Array<IFlag>) => void;
  setUnitConfig: (unitConfig: UnitConfig) => void;
  setFlagStayInPlace: (flagStayInPlace: boolean) => void;
  setSelectedUnit: (
    playerNumber: number,
    unitNumber: number,
    step: number
  ) => void;
  setUnitCount: (unitCount: number) => void;
  setWaitingForMoves: (ready: boolean, player: number) => void;
  undoMove: () => void;
  updateBufferOpponentUnits: (bufferOpponentUnits: Array<IUnit>) => void;
  updateMovesListener: (update: {
    units: Array<IUnit>;
    round: number;
  }) => void;
  updateOpponentUnits: (opponentsFutureunits: Array<IUnit>) => void;
  onWaitingForMoves: (e: Event) => void;
  boardLength: number;
  boardWidth: number;
  bufferOpponentUnits: Array<IUnit>;
  flags: Array<IFlag>;
  futureUnits: Array<Array<IUnit>>;
  gameStarted: boolean;
  isAdmin: boolean;
  isInRoom: boolean;
  playerIndex: 0 | 1;
  placedUnits: Array<Array<boolean>>;
  placementZone: number;
  player: 0 | 1;
  players: IPlayers;
  ready: Array<boolean>;
  roomId: string;
  round: number;
  selectedUnit: ISelectedUnit;
  step: number;
  units: Array<Array<IUnit>>;
  unitsCount: number;
  terrain: Array<{ x: number; y: number }>;
  unitConfig: UnitConfig;
  flagStayInPlace: boolean;
  waitingForMoves: Array<boolean>;
  animationPhase: IAnimationPhase;
}

const defaultState: IGameContextProps = {
  applyBufferedMoves: () => {},
  applyMoves: async () => {},
  changeStep: () => {},
  changePosition: () => {},
  circlePlayer: () => {},
  circleUnit: () => {},
  createRoom: async () => {},
  placeUnit: () => {},
  startGame: async () => {},
  setBoardSize: () => {},
  setGameStarted: () => {},
  setInRoom: () => {},
  setIsAdmin: () => {},
  setPlayerIndex: () => {},
  setPlacementZone: () => {},
  setTerrain: () => {},
  setFlags: () => {},
  setUnitConfig: () => {},
  setFlagStayInPlace: () => {},
  setSelectedUnit: () => {},
  setUnitCount: () => {},
  setWaitingForMoves: () => {},
  undoMove: () => {},
  updateBufferOpponentUnits: () => {},
  updateMovesListener: () => {},
  updateOpponentUnits: () => {},
  onWaitingForMoves: () => {},
  boardLength: 21,
  boardWidth: 22,
  bufferOpponentUnits: Array(5).fill(null),
  flags: [
    { x: 0, y: 10, originX: 0, originY: 10, inZone: true },
    { x: 21, y: 10, originX: 21, originY: 10, inZone: true },
  ],
  futureUnits: [Array(5).fill(null), Array(5).fill(null)],
  gameStarted: false,
  isAdmin: true,
  isInRoom: false,
  playerIndex: 0,
  placedUnits: [Array(5).fill(false), Array(5).fill(false)],
  placementZone: 5,
  player: 0,
  players: [
    { name: "P1", color: "blue" },
    { name: "P2", color: "red" },
  ],
  ready: [false, false],
  roomId: "",
  round: 0,
  selectedUnit: { playerNumber: 0, unitNumber: 0 },
  step: -5,
  units: Array(2).fill(
    Array(5).fill({
      strength: 1,
      speed: 3,
      x: 12,
      y: 6,
      life: 1,
      hasFlag: false,
      unitType: 0,
    })
  ),
  terrain: [],
  unitsCount: 5,
  unitConfig: defaultUnitConfig(),
  flagStayInPlace: false,
  waitingForMoves: [false, false],
  animationPhase: {
    isAnimating: false,
    currentAnimationIndex: 0,
    animationSubPhase: 'idle',
    queue: [],
    boomQueue: [],
    deadUnits: new Set(),
  },
};

export default React.createContext(defaultState);
