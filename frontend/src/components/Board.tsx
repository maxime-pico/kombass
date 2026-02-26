import React, { useContext } from "react";
import Square from "./Square";
import { IUnit, ISelectedUnit } from "../App";
import gameContext from "../gameContext";

interface BoardProps {
  placement: boolean;
  _screenShake: () => void;
}

function Board(props: BoardProps) {
  // Placement was false by default
  const {
    _changeStep,
    _changePosition,
    _placeUnit,
    animationPhase,
    boardLength,
    boardWidth,
    flags,
    futureUnits,
    isPlayer,
    placedUnits,
    placementZone,
    ready,
    selectedUnit,
    step,
    terrain,
    units,
    unitsCount,
    waitingForMoves,
  } = useContext(gameContext);

  const terrainSet = new Set(terrain.map((t: { x: number; y: number }) => `${t.x},${t.y}`));
  const isTerrainSquare = (col: number, row: number) => terrainSet.has(`${col},${row}`);

  const _isReachable = (
    unit: IUnit,
    col: number,
    row: number,
    placement: boolean
  ) => {
    let isReachable = false;
    if (isTerrainSquare(col, row)) return false;
    const ownFlag = flags[isPlayer];
    if (placement) {
      const flagZone = ownFlag
        ? Math.abs(col - ownFlag.x) + Math.abs(row - ownFlag.y) <= 3
        : false;
      isReachable = isPlayer
        ? col > boardWidth - placementZone - 1
        : col < placementZone;
      isReachable = isReachable && !flagZone;
    } else {
      const x = unit ? unit.x : 999;
      const y = unit ? unit.y : 999;
      const speed = unit ? unit.speed : -1;
      const flagZone =
        ownFlag && !unit?.hasFlag
          ? Math.abs(col - ownFlag.x) + Math.abs(row - ownFlag.y) <= 3
          : false;
      isReachable = unit
        ? Math.abs(x - col) + Math.abs(y - row) <= speed && !flagZone
        : false;
    }
    return isReachable;
  };

  const _opponentCanReach = (
    units: Array<IUnit>,
    col: number,
    row: number,
    placement: boolean
  ) => {
    let opponentCanReach = false;
    let opponentFlag = flags[(isPlayer + 1) % 2];
    if (!placement) {
      units.forEach((unit) => {
        let x = unit ? unit.x : 999;
        let y = unit ? unit.y : 999;
        let speed = unit ? unit.speed : -1;
        let life = unit ? unit.life : -1;
        let opponentFlagZone =
          Math.abs(col - opponentFlag.x) + Math.abs(row - opponentFlag.y) <= 3;
        opponentCanReach =
          opponentCanReach ||
          (Math.abs(x - col) + Math.abs(y - row) <= speed &&
            !opponentFlagZone &&
            life > 0);
      });
    }
    return opponentCanReach;
  };

  // placement was default false
  const _isForbidden = (
    unit: IUnit,
    col: number,
    row: number,
    placement: boolean
  ) => {
    const unitNumber = selectedUnit?.unitNumber;
    const ownFlag = flags[isPlayer];
    let isForbidden = false;

    if (isTerrainSquare(col, row)) return true;

    if (placement) {
      units[isPlayer].forEach((unit, unit_index) => {
        if (placedUnits[isPlayer][unit_index]) {
          isForbidden = isForbidden || (unit.x === col && unit.y === row);
        }
      });
      if (ownFlag && ownFlag.x !== -1) {
        isForbidden =
          isForbidden ||
          Math.abs(col - ownFlag.x) + Math.abs(row - ownFlag.y) <= 3;
      }
      isForbidden = isPlayer
        ? isForbidden || col <= boardWidth - placementZone - 1
        : isForbidden || col >= placementZone;
    } else {
      futureUnits[isPlayer].forEach((unit, unit_index) => {
        if (unit && unitNumber !== unit_index) {
          isForbidden = isForbidden || (unit.x === col && unit.y === row);
        }
      });
      if (!units[isPlayer][unitNumber]?.hasFlag) {
        if (ownFlag && ownFlag.x !== -1) {
          isForbidden =
            isForbidden ||
            Math.abs(col - ownFlag.x) + Math.abs(row - ownFlag.y) <= 3;
        }
      }
    }
    return isForbidden;
  };

  const _isFlagZone = (col: number, row: number) => {
    let isFlagZone = false;

    flags.forEach((flag, flag_index) => {
      isFlagZone =
        isFlagZone || Math.abs(col - flag.x) + Math.abs(row - flag.y) <= 3;
    });

    return isFlagZone;
  };

  // Determines whether current square should display a danger bubble or not
  // the "danger bubble" is the visual indicator showing the damage radius of a unit
  // returns an array of boolean where:
  // first cell determines if it's a player zero unit creating danger
  // second cell determines if it's a player one unit creating danger
  // third cell determines ??? I removed it, I couldn't read the code
  const _isInDanger = (col: number, row: number, placement: boolean) => {
    // initialise vars
    let isInDanger = [false, false];
    const currentUnit = selectedUnit.unitNumber;

    // During placement, do not display danger indicators
    if (!placement) {
      // determine if we are in the flagzone or not. In the flagzone, players cannot be in danger
      const flag1 = flags[0];
      let notInReachFlag1 =
        flag1 &&
        flag1.x !== -1 &&
        !(Math.abs(col - flag1.x) + Math.abs(row - flag1.y) <= 3);
      const flag2 = flags[1];
      let notInReachFlag2 =
        flag2 &&
        flag2.x !== -1 &&
        !(Math.abs(col - flag2.x) + Math.abs(row - flag2.y) <= 3);

      // Future units are units already moved of the current player
      // For each unit, determine whether it creates a danger bubble or not for current square
      futureUnits.forEach((player, player_index) => {
        player.forEach((unit, unit_index) => {
          // Check if not in reach of the flags and if unit belongs to current player
          if (
            notInReachFlag1 &&
            notInReachFlag2 &&
            unit &&
            isPlayer === player_index
          ) {
            // In that case, for each type of unit check if it's in range of current square
            if (unit.range > 1) {
              // normal unit
              isInDanger[player_index] =
                isInDanger[player_index] ||
                Math.abs(col - unit.x) + Math.abs(row - unit.y) <=
                  unit.range;
            } else {
              // infantry unit with different range mechanism
              isInDanger[player_index] =
                isInDanger[player_index] ||
                Math.abs(col - unit.x) ** 2 + Math.abs(row - unit.y) ** 2 <= 2;
            }
          }
        });
      });
      // For each unit, determine whether it creates a danger bubble or not for current square
      units.forEach((player, player_index) => {
        player.forEach((unit, unit_index) => {
          // Check if not in reach of the flags and if unit belongs to current player
          // also make sure player has finished placing units and is ready to start
          if (
            (step === unitsCount && player_index !== isPlayer) ||
            step !== unitsCount
          ) {
            if (
              notInReachFlag1 &&
              notInReachFlag2 &&
              unit &&
              unit.life > 0 &&
              (player_index !== isPlayer || unit_index >= currentUnit) &&
              ready[player_index]
            ) {
              // In that case, for each type of unit check if it's in range of current square
              if (unit.range > 1) {
                // normal unit
                isInDanger[player_index] =
                  isInDanger[player_index] ||
                  Math.abs(col - unit.x) + Math.abs(row - unit.y) <=
                    unit.range;
              } else {
                // infantry unit with different range mechanism
                isInDanger[player_index] =
                  isInDanger[player_index] ||
                  Math.abs(col - unit.x) ** 2 + Math.abs(row - unit.y) ** 2 <=
                    2;
              }
            }
          }
        });
      });
    }
    return isInDanger;
  };

  // Determines whether current square (row, col) contains a unit or not and if so
  // what type it is and if it should be displayed
  const _containsUnits = (
    units: Array<IUnit>,
    col: number,
    row: number,
    player: number,
    placement: boolean,
    ghost: boolean
  ) => {
    // initialise vars
    const currentUnit = selectedUnit.unitNumber;
    let unitContained = null;
    let unitNumber = null;
    let display = false;

    // During animation phase, we need to handle display differently:
    // - Show own units at original positions (from units array)
    // - Hide ghost units while animations play (to avoid duplicates)
    const isAnimatingCombat = animationPhase.isAnimating && step === unitsCount;
    const shouldUseOriginalPositions =
      isAnimatingCombat && player === isPlayer && !ghost;
    const shouldHideGhosts = isAnimatingCombat && ghost;

    // for each unit in the current player array
    units.forEach((unit, index) => {
      let isPlaced = placement ? placedUnits[player][index] : true;

      // only continue if we are considering units that have not been moved or placed yet
      if (placement || ghost || index >= currentUnit || player !== isPlayer) {
        // only continue if the unit we look at is supposed to be in current square
        if (
          unit &&
          unit.x === col &&
          unit.y === row &&
          (unit.life > 0 || ghost) &&
          isPlaced
        ) {
          // in that case, let square know that there is indeed a unit of current player
          unitContained = unit;
          unitNumber = index;

          // Check if unit is dead during animation
          const unitKey = `${player}_${index}`;
          const isDeadDuringAnimation = isAnimatingCombat && animationPhase.deadUnits.has(unitKey);

          // During animation, show own units at original positions and hide ghosts
          if (isDeadDuringAnimation) {
            display = false; // Hide units that died during animation
          } else if (shouldHideGhosts) {
            display = false; // Hide ghost units during animation
          } else if (shouldUseOriginalPositions) {
            display = true; // Show own units at original positions
          } else {
            display =
              ((ghost || !ready[player]) && player !== isPlayer) ||
              (step === unitsCount && !ghost && player === isPlayer) ||
              (waitingForMoves[isPlayer] && !ghost && player === isPlayer)
                ? false // Hide: ghosts of opponent, opponent units if not ready, own units during combat or when waiting for opponent
                : true;
          }
        }
      }
    });

    return {
      unit: unitContained,
      unitNumber: unitNumber,
      playerNumber: player,
      display: display,
    };
  };

  const _containsFlag = (col: number, row: number) => {
    const flag1 = flags[0];
    const flag2 = flags[1];
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
    const unit = units[selectedUnit.playerNumber]?.[selectedUnit.unitNumber];
    return unit && unit.x === col && unit.y === row;
  };

  const renderSquare = (col: number, row: number) => {
    const placement = props.placement;
    const unit = units[isPlayer]?.[selectedUnit.unitNumber];
    const containsUnitsPlayer = _containsUnits(
      units[isPlayer],
      col,
      row,
      isPlayer,
      placement,
      false
    );
    const containsUnitsOpponent = _containsUnits(
      units[(isPlayer + 1) % 2],
      col,
      row,
      (isPlayer + 1) % 2,
      placement,
      false
    );
    const containsUnits =
      containsUnitsPlayer.unit && containsUnitsPlayer.display
        ? containsUnitsPlayer
        : containsUnitsOpponent.unit && containsUnitsOpponent.display
        ? containsUnitsOpponent
        : { unit: null, unitNumber: null, playerNumber: -1, display: false };
    let containsGhostUnits = {
      unit: null,
      unitNumber: null,
      playerNumber: -1,
      display: false,
    };
    let containsOpponentGhostUnits = {
      unit: null,
      unitNumber: null,
      playerNumber: -1,
      display: false,
    };
    let containsGhostUnitsPlayer = {
      unit: null,
      unitNumber: null,
      playerNumber: -1,
      display: false,
    };
    let containsGhostUnitsOpponent = {
      unit: null,
      unitNumber: null,
      playerNumber: -1,
      display: false,
    };

    if (!placement) {
      containsGhostUnitsPlayer = _containsUnits(
        futureUnits[isPlayer],
        col,
        row,
        isPlayer,
        placement,
        true
      );
      containsGhostUnitsOpponent = _containsUnits(
        futureUnits[(isPlayer + 1) % 2],
        col,
        row,
        (isPlayer + 1) % 2,
        placement,
        true
      );
      containsGhostUnits =
        containsGhostUnitsPlayer.unit && containsGhostUnitsPlayer.display
          ? containsGhostUnitsPlayer
          : {
              unit: null,
              unitNumber: null,
              playerNumber: -1,
              display: false,
            };
      containsOpponentGhostUnits = containsGhostUnitsOpponent || {
        unit: null,
        unitNumber: null,
        playerNumber: -1,
        display: false,
      };
    }

    const containsFlag = _containsFlag(col, row);
    const isReachable = _isReachable(unit, col, row, placement);
    const opponentCanReach = _opponentCanReach(
      units[(isPlayer + 1) % 2],
      col,
      row,
      placement
    );
    const isForbidden = _isForbidden(unit, col, row, placement);
    const isInDanger = _isInDanger(col, row, placement);
    const isFlagZone = _isFlagZone(col, row);
    return (
      <Square
        _changePosition={_changePosition}
        _changeStep={_changeStep}
        _placeUnit={_placeUnit}
        _screenShake={props._screenShake}
        boardWidth={boardWidth}
        col={col}
        containsFlag={containsFlag}
        ghostUnit={containsGhostUnits}
        containsOpponentGhostUnits={containsOpponentGhostUnits}
        isFlagZone={isFlagZone}
        isForbidden={isForbidden}
        isTerrain={isTerrainSquare(col, row)}
        isInDanger={isInDanger}
        isReachable={isReachable}
        opponentCanReach={opponentCanReach}
        key={`${col} ${row}`}
        row={row}
        selected={_isSelected(col, row, selectedUnit)}
        unit={containsUnits}
      />
    );
  };

  return (
    <div
      className={`board p${isPlayer + 1}`}
      style={{
        pointerEvents: animationPhase.isAnimating ? 'none' : 'auto',
      }}
    >
      {Array(boardLength)
        .fill(Array(boardWidth).fill(null))
        .map((row: any, row_index: number) =>
          row.map((column: any, column_index: number) =>
            renderSquare(column_index, row_index)
          )
        )}
    </div>
  );
}

export default Board;
