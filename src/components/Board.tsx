import React from "react";
import Square from "./Square";
import { IUnit, IFlag, ISelectedUnit, IPlayers } from "../App";

interface BoardProps {
  player: 0 | 1;
  placementZone: number;
  flags: Array<IFlag>;
  boardWidth: number;
  boardLength: number;
  selectedUnit: ISelectedUnit;
  units: Array<Array<IUnit>>;
  placedUnits: Array<Array<boolean>>;
  futureUnits: Array<Array<IUnit>>;
  placement: boolean;
  players: IPlayers;
  _changeStep: (step: number, direction: -1 | 1) => void;
  step: number;
  _changePosition: (
    playerNumber: number,
    unitNumber: number,
    x: number,
    y: number
  ) => void;
  _placeUnit: (
    playerNumber: number,
    unitNumber: number,
    col: number,
    row: number
  ) => void;
  _screenShake: () => void;
  unitsCount: number;
  _setSelectedUnit: (
    playerNumber: number,
    unitNumber: number,
    step: number
  ) => void;
}

function Board(props: BoardProps) {
  // Placement was false by default
  const _isReachable = (
    unit: IUnit,
    col: number,
    row: number,
    placement: boolean
  ) => {
    let isReachable = false;
    if (placement) {
      const playerNumber = props.selectedUnit?.playerNumber || 0;
      const placementZone = props.placementZone;
      const ownFlag = props.flags[playerNumber];
      const flagZone = ownFlag
        ? Math.abs(col - ownFlag.x) + Math.abs(row - ownFlag.y) <= 3
        : false;
      isReachable = playerNumber
        ? col > props.boardWidth - placementZone - 1
        : col < placementZone;
      isReachable = isReachable && !flagZone;
    } else {
      const x = unit ? unit.x : 999;
      const y = unit ? unit.y : 999;
      const speed = unit ? unit.speed : -1;
      const ownFlag = props.flags[props.selectedUnit.playerNumber];
      const flagZone =
        ownFlag && !unit.hasFlag
          ? Math.abs(col - ownFlag.x) + Math.abs(row - ownFlag.y) <= 3
          : false;
      isReachable = unit
        ? Math.abs(x - col) + Math.abs(y - row) <= speed && !flagZone
        : false;
    }
    return isReachable;
  };

  // placement was default false
  const _isForbidden = (
    unit: IUnit,
    col: number,
    row: number,
    placement: boolean
  ) => {
    let playerNumber = props.selectedUnit?.playerNumber;
    const unitNumber = props.selectedUnit?.unitNumber;
    const ownFlag = props.flags[playerNumber];
    let isForbidden = false;

    if (placement) {
      playerNumber = props.player || 0;
      const placementZone = props.placementZone;
      props.units[playerNumber].forEach((unit, unit_index) => {
        if (props.placedUnits[playerNumber][unit_index]) {
          isForbidden = isForbidden || (unit.x === col && unit.y === row);
        }
      });
      if (ownFlag && ownFlag.x !== -1) {
        isForbidden =
          isForbidden ||
          Math.abs(col - ownFlag.x) + Math.abs(row - ownFlag.y) <= 3;
      }
      isForbidden = playerNumber
        ? isForbidden || col <= props.boardWidth - placementZone - 1
        : isForbidden || col >= placementZone;
    } else {
      if (playerNumber !== -1) {
        props.futureUnits[playerNumber].forEach((unit, unit_index) => {
          if (unit && unitNumber !== unit_index) {
            isForbidden = isForbidden || (unit.x === col && unit.y === row);
          }
        });
        if (!props.units[playerNumber][unitNumber].hasFlag) {
          if (ownFlag && ownFlag.x !== -1) {
            isForbidden =
              isForbidden ||
              Math.abs(col - ownFlag.x) + Math.abs(row - ownFlag.y) <= 3;
          }
        }
      }
    }
    return isForbidden;
  };

  const _isFlagZone = (col: number, row: number) => {
    const flags = props.flags;
    let isFlagZone = false;

    flags.forEach((flag, flag_index) => {
      isFlagZone =
        isFlagZone || Math.abs(col - flag.x) + Math.abs(row - flag.y) <= 3;
    });

    return isFlagZone;
  };

  // placement was false by default
  const _isInDanger = (col: number, row: number, placement: boolean) => {
    let isInDanger = [false, false, false];
    const currentPlayer = props.selectedUnit.playerNumber;
    const currentUnit = props.selectedUnit.unitNumber;
    if (!placement) {
      const playerNumber = props.selectedUnit.playerNumber;
      const flag1 = props.flags[0];
      let inReachFlag1 =
        flag1 &&
        flag1.x !== -1 &&
        !(Math.abs(col - flag1.x) + Math.abs(row - flag1.y) <= 3);
      const flag2 = props.flags[1];
      let inReachFlag2 =
        flag2 &&
        flag2.x !== -1 &&
        !(Math.abs(col - flag2.x) + Math.abs(row - flag2.y) <= 3);
      if (playerNumber !== -1) {
        const futureUnits = props.futureUnits;
        futureUnits.forEach((player, player_index) => {
          player.forEach((unit, unit_index) => {
            if (
              inReachFlag1 &&
              inReachFlag2 &&
              unit &&
              currentPlayer === player_index
            ) {
              if (unit.strength > 1) {
                isInDanger[player_index] =
                  isInDanger[player_index] ||
                  Math.abs(col - unit.x) + Math.abs(row - unit.y) <=
                    unit.strength;
              } else {
                isInDanger[player_index] =
                  isInDanger[player_index] ||
                  Math.abs(col - unit.x) ** 2 + Math.abs(row - unit.y) ** 2 <=
                    2;
              }
            }
          });
        });
        props.units.forEach((player, player_index) => {
          player.forEach((unit, unit_index) => {
            if (
              inReachFlag1 &&
              inReachFlag2 &&
              unit.life > 0 &&
              (player_index !== currentPlayer || unit_index >= currentUnit)
            ) {
              if (unit.strength > 1) {
                isInDanger[player_index] =
                  isInDanger[player_index] ||
                  Math.abs(col - unit.x) + Math.abs(row - unit.y) <=
                    unit.strength;
              } else {
                isInDanger[player_index] =
                  isInDanger[player_index] ||
                  Math.abs(col - unit.x) ** 2 + Math.abs(row - unit.y) ** 2 <=
                    2;
              }
            }
          });
        });
      }
    }
    return isInDanger;
  };

  // player was null by default
  // placement was false by default
  // ghost was false by default
  const _containsUnits = (
    units: Array<IUnit>,
    col: number,
    row: number,
    player: 0 | 1,
    placement: boolean,
    ghost: boolean
  ) => {
    const currentPlayer = props.selectedUnit.playerNumber;
    const currentUnit = props.selectedUnit.unitNumber;
    let unitContained = null;
    let unitNumber = null;
    let display = false;
    units.forEach((unit, index) => {
      let isPlaced = placement ? props.placedUnits[player][index] : true;
      if (
        placement ||
        ghost ||
        index >= currentUnit ||
        player !== currentPlayer
      ) {
        if (
          unit &&
          unit.x === col &&
          unit.y === row &&
          (unit.life > 0 || ghost) &&
          isPlaced
        ) {
          unitContained = unit;
          unitNumber = index;
          display = ghost && player !== currentPlayer ? false : true;
        }
      }
    });

    return { unit: unitContained, unitNumber: unitNumber, display: display };
  };

  const _containsFlag = (col: number, row: number) => {
    const flag1 = props.flags[0];
    const flag2 = props.flags[1];
    const containsFlag = [];
    containsFlag[0] = flag1.x === col && flag1.y === row && flag1.inZone;
    containsFlag[1] = flag2.x === col && flag2.y === row && flag2.inZone;
    return containsFlag;
  };

  const _isSelected = (
    col: number,
    row: number,
    selectedUnit: ISelectedUnit
  ) => {
    const unit =
      props.units[selectedUnit.playerNumber]?.[selectedUnit.unitNumber];
    return unit && unit.x === col && unit.y === row;
  };

  const renderSquare = (col: number, row: number) => {
    const player = props.selectedUnit?.playerNumber;
    const placement = props.placement;
    const unit = props.units[player]?.[props.selectedUnit.unitNumber];
    const [unitsp1, unitsp2] = props.units;
    const containsUnits1 = _containsUnits(
      unitsp1,
      col,
      row,
      0,
      placement,
      false
    );
    const containsUnits2 = _containsUnits(
      unitsp2,
      col,
      row,
      1,
      placement,
      false
    );
    const containsUnits =
      containsUnits1.unit && containsUnits1.display
        ? containsUnits1
        : containsUnits2.unit && containsUnits2.display
        ? containsUnits2
        : { unit: null, unitNumber: null, display: false };
    let containsGhostUnits = { unit: null, unitNumber: null, display: false };
    let containsGhostUnits1 = { unit: null, unitNumber: null, display: false };
    let containsGhostUnits2 = { unit: null, unitNumber: null, display: false };

    if (!placement) {
      containsGhostUnits1 = _containsUnits(
        props.futureUnits[0],
        col,
        row,
        0,
        placement,
        true
      );
      containsGhostUnits2 = _containsUnits(
        props.futureUnits[1],
        col,
        row,
        1,
        placement,
        true
      );
      containsGhostUnits =
        containsGhostUnits2.unit && containsGhostUnits2.display
          ? containsGhostUnits2
          : containsGhostUnits1.unit && containsGhostUnits1.display
          ? containsGhostUnits1
          : { unit: null, unitNumber: null, display: false };
    }

    // const containsPlayer = containsUnits1[0] || containsGhostUnits1[0] ? 0 : containsUnits2[0] || containsGhostUnits2[0] ? 1 : null
    const containsPlayer =
      containsUnits2?.unit || containsGhostUnits2?.unit
        ? 1
        : containsUnits1?.unit || containsGhostUnits1?.unit
        ? 0
        : null;
    const containsFlag = _containsFlag(col, row);
    const isReachable = _isReachable(unit, col, row, placement);
    const isForbidden = _isForbidden(unit, col, row, placement);
    const isInDanger = _isInDanger(col, row, placement);
    const isFlagZone = _isFlagZone(col, row);
    return (
      <Square
        key={`${col} ${row}`}
        col={col}
        row={row}
        unit={containsUnits}
        futureUnits={props.futureUnits}
        ghostUnit={containsGhostUnits}
        playerIndex={containsPlayer}
        players={props.players}
        _changeStep={props._changeStep}
        step={props.step}
        _changePosition={props._changePosition}
        isReachable={isReachable}
        isForbidden={isForbidden}
        isInDanger={isInDanger}
        isFlagZone={isFlagZone}
        selected={_isSelected(col, row, props.selectedUnit)}
        selectedUnit={props.selectedUnit}
        containsFlag={containsFlag}
        _placeUnit={props._placeUnit}
        player={props.player}
        _screenShake={props._screenShake}
        unitsCount={props.unitsCount}
        boardWidth={props.boardWidth}
      />
    );
  };

  return (
    <div className={`board p${props.selectedUnit.playerNumber + 1}`}>
      {Array(props.boardLength)
        .fill(Array(props.boardWidth).fill(null))
        .map((row: any, row_index: number) =>
          row.map((column: any, column_index: number) =>
            renderSquare(column_index, row_index)
          )
        )}
    </div>
  );
}

export default Board;
