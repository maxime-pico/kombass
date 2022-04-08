import React from "react";
import { IUnit, ISelectedUnit, IFlag, IPlayers } from "./App";

export function dispatchBoom(eventType: string, data: any) {
  const event = new CustomEvent(eventType, { detail: data });
  document.dispatchEvent(event);
}

export interface IGameContextProps {
  _applyMoves: () => void;
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
  _placeUnit: (unitNumber: number, col: number, row: number) => void;
  _setBoardSize: (length: number, width: number) => void;
  _setGameStarted: () => void;
  _setInRoom: (inRoom: boolean) => void;
  _setIsAdmin: (isAdmin: boolean) => void;
  _setIsPlayer: (isPlayer: 0 | 1) => void;
  _setPlacementZone: (zoneSize: number) => void;
  _setSelectedUnit: (
    playerNumber: number,
    unitNumber: number,
    step: number
  ) => void;
  _setUnitCount: (unitCount: number) => void;
  _setWaitingForMoves: (ready: boolean, player: number) => void;
  _undoMove: () => void;
  _updateOpponentUnits: (opponentsFutureunits: Array<IUnit>) => void;
  boardLength: number;
  boardWidth: number;
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
  selectedUnit: ISelectedUnit;
  step: number;
  units: Array<Array<IUnit>>;
  unitsCount: number;
  waitingForMoves: Array<boolean>;
}

const defaultState: IGameContextProps = {
  _applyMoves: () => {},
  _changeStep: () => {},
  _changePosition: () => {},
  _circlePlayer: () => {},
  _circleUnit: () => {},
  _placeUnit: () => {},
  _setBoardSize: () => {},
  _setGameStarted: () => {},
  _setInRoom: () => {},
  _setIsAdmin: () => {},
  _setIsPlayer: () => {},
  _setPlacementZone: () => {},
  _setSelectedUnit: () => {},
  _setUnitCount: () => {},
  _setWaitingForMoves: () => {},
  _undoMove: () => {},
  _updateOpponentUnits: () => {},
  boardLength: 21,
  boardWidth: 22,
  flags: [
    { x: 0, y: 10, inZone: true },
    { x: 21, y: 10, inZone: true },
  ],
  futureUnits: Array(2).fill(Array(5).fill(null)),
  gameStarted: false,
  isAdmin: true,
  isInRoom: false,
  isPlayer: 0,
  placedUnits: Array(2).fill(Array(5).fill(false)),
  placementZone: 5,
  player: 0,
  players: [
    { name: "P1", color: "blue" },
    { name: "P2", color: "red" },
  ],
  ready: [false, false],
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
    })
  ),
  unitsCount: 5,
  waitingForMoves: [false, false],
};

export default React.createContext(defaultState);
