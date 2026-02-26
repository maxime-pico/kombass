import React from "react";
import { IUnit, ISelectedUnit, IFlag, IPlayers, IAnimationPhase } from "./App";
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
  _applyBufferedMoves: () => void;
  _applyMoves: () => Promise<any>;
  _changeStep: (step: number, direction: -1 | 1) => void;
  _changePosition: (
    playerNumber: number,
    unitNumber: number,
    x: number,
    y: number
  ) => void;
  _circlePlayer: () => void;
  _circleUnit: (
    playerIndex: number,
    unitIndex: number,
    currentType: number,
    direction: number
  ) => void;
  _createRoom: () => Promise<void>;
  _placeUnit: (unitNumber: number, col: number, row: number) => void;
  _setBoardSize: (length: number, width: number) => void;
  _setGameStarted: () => void;
  _setInRoom: (inRoom: boolean) => void;
  _setIsAdmin: (isAdmin: boolean) => void;
  _setIsPlayer: (isPlayer: 0 | 1) => void;
  _setPlacementZone: (zoneSize: number) => void;
  _setTerrain: (terrain: Array<{ x: number; y: number }>) => void;
  _setUnitConfig: (unitConfig: UnitConfig) => void;
  _setSelectedUnit: (
    playerNumber: number,
    unitNumber: number,
    step: number
  ) => void;
  _setUnitCount: (unitCount: number) => void;
  _setWaitingForMoves: (ready: boolean, player: number) => void;
  _undoMove: () => void;
  _updateBufferOpponentUnits: (bufferOpponentUnits: Array<IUnit>) => void;
  _updateMovesListener: (update: {
    units: Array<IUnit>;
    round: number;
  }) => void;
  _updateOpponentUnits: (opponentsFutureunits: Array<IUnit>) => void;
  _waitingForMoves: (e: Event) => void;
  boardLength: number;
  boardWidth: number;
  bufferOpponentUnits: Array<IUnit>;
  flags: Array<IFlag>;
  futureUnits: Array<Array<IUnit>>;
  gameStarted: boolean;
  isAdmin: boolean;
  isInRoom: boolean;
  isPlayer: 0 | 1;
  placedUnits: Array<Array<boolean>>;
  placementZone: number;
  player: 0 | 1;
  players: IPlayers;
  ready: Array<boolean>;
  round: number;
  selectedUnit: ISelectedUnit;
  step: number;
  units: Array<Array<IUnit>>;
  unitsCount: number;
  terrain: Array<{ x: number; y: number }>;
  unitConfig: UnitConfig;
  waitingForMoves: Array<boolean>;
  animationPhase: IAnimationPhase;
}

const defaultState: IGameContextProps = {
  _applyBufferedMoves: () => {},
  _applyMoves: async () => {},
  _changeStep: () => {},
  _changePosition: () => {},
  _circlePlayer: () => {},
  _circleUnit: () => {},
  _createRoom: async () => {},
  _placeUnit: () => {},
  _setBoardSize: () => {},
  _setGameStarted: () => {},
  _setInRoom: () => {},
  _setIsAdmin: () => {},
  _setIsPlayer: () => {},
  _setPlacementZone: () => {},
  _setTerrain: () => {},
  _setUnitConfig: () => {},
  _setSelectedUnit: () => {},
  _setUnitCount: () => {},
  _setWaitingForMoves: () => {},
  _undoMove: () => {},
  _updateBufferOpponentUnits: () => {},
  _updateMovesListener: () => {},
  _updateOpponentUnits: () => {},
  _waitingForMoves: () => {},
  boardLength: 21,
  boardWidth: 22,
  bufferOpponentUnits: Array(5).fill(null),
  flags: [
    { x: 0, y: 10, inZone: true },
    { x: 21, y: 10, inZone: true },
  ],
  futureUnits: [Array(5).fill(null), Array(5).fill(null)],
  gameStarted: false,
  isAdmin: true,
  isInRoom: false,
  isPlayer: 0,
  placedUnits: [Array(5).fill(false), Array(5).fill(false)],
  placementZone: 5,
  player: 0,
  players: [
    { name: "P1", color: "blue" },
    { name: "P2", color: "red" },
  ],
  ready: [false, false],
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
  waitingForMoves: [false, false],
  animationPhase: {
    isAnimating: false,
    currentAnimationIndex: 0,
    queue: [],
    boomQueue: [],
    deadUnits: new Set(),
  },
};

export default React.createContext(defaultState);
