import React from "react";
import Board from "./Board";
import UnitToPlace from "./UnitToPlace";
import { IUnit, ISelectedUnit, IFlag, IPlayers } from "../App";

interface UnitPlacementProps {
  units: Array<Array<IUnit>>;
  player: 0 | 1;
  selectedUnit: ISelectedUnit;
  _setSelectedUnit: (
    playerNumber: number,
    unitNumber: number,
    step: number
  ) => void;
  placedUnits: Array<Array<boolean>>;
  flags: Array<IFlag>;
  players: IPlayers;
  _placeUnit: (
    playerNumber: number,
    unitNumber: number,
    col: number,
    row: number
  ) => void;
  step: number;
  boardLength: number;
  boardWidth: number;
  placementZone: number;
  unitsCount: number;
  futureUnits: Array<Array<IUnit>>;
  _changeStep: (step: number, direction: -1 | 1) => void;
  _changePosition: (
    playerNumber: number,
    unitNumber: number,
    x: number,
    y: number
  ) => void;
}

function UnitPlacement(props: UnitPlacementProps) {
  const units = props.units;
  const player = props.player;
  const selectedUnit = props.selectedUnit.unitNumber;
  return (
    <div className="main">
      <Board
        placement={true}
        units={units}
        player={player}
        selectedUnit={props.selectedUnit}
        _setSelectedUnit={props._setSelectedUnit}
        placedUnits={props.placedUnits}
        flags={props.flags}
        players={props.players}
        _placeUnit={props._placeUnit}
        step={props.step}
        boardLength={props.boardLength}
        boardWidth={props.boardWidth}
        placementZone={props.placementZone}
        unitsCount={props.unitsCount}
        futureUnits={props.futureUnits}
        _changeStep={props._changeStep}
        _changePosition={props._changePosition}
        _screenShake={() => {}}
      />
      <div className={`unitPlacement${player ? " left" : " right"}`}>
        <div className="title"> Place your units!</div>
        <div className="unitPlacement-container">
          {props.placedUnits[player].map((placedUnit, unit_index) => {
            return (
              !placedUnit && (
                <UnitToPlace
                  key={unit_index}
                  playerIndex={player}
                  unit={units[player][unit_index]}
                  selected={selectedUnit === unit_index}
                />
              )
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default UnitPlacement;
