import React, { useState, useEffect, useContext } from "react";
import Unit from "./Unit";
import Flag from "./Flag";
import { AUDIO } from "../utilities/dict";
import { IUnit } from "../App";
import gameContext, { isCustomEvent } from "../gameContext";

interface SquareProps {
  _changePosition: (
    playerNumber: number,
    unitNumber: number,
    x: number,
    y: number
  ) => void;
  _changeStep: (step: number, direction: -1 | 1) => void;
  _placeUnit: (unitNumber: number, col: number, row: number) => void;
  _screenShake: () => void;
  boardWidth: number;
  col: number;
  containsFlag: Array<boolean>;
  ghostUnit: {
    unit: IUnit | null;
    unitNumber: number | null;
    playerNumber: number;
    display: boolean;
  };
  containsOpponentGhostUnits: {
    unit: IUnit | null;
    unitNumber: number | null;
    playerNumber: number;
    display: boolean;
  };
  isFlagZone: boolean;
  isForbidden: boolean;
  isInDanger: Array<boolean>;
  isReachable: boolean;
  opponentCanReach: boolean;
  row: number;
  selected: boolean;
  unit: {
    unit: IUnit | null;
    unitNumber: number | null;
    playerNumber: number;
    display: boolean;
  };
}

function Square(props: SquareProps) {
  const { animationPhase, isPlayer, players, selectedUnit, step, unitsCount, boardLength, boardWidth } =
    useContext(gameContext);
  const [boom, setBoom] = useState(false);
  const [animatedUnit, setAnimatedUnit] = useState<{
    player: 0 | 1;
    unitIndex: number;
    transform: string;
  } | null>(null);

  // Extract unit and ghostUnit at the top
  const unit = props.unit;
  const ghostUnit = props.ghostUnit;
  const { _screenShake, col, row, containsOpponentGhostUnits } = props;

  const _clickedSquare = () => {
    if (step !== unitsCount) {
      if (props.isReachable && !props.isForbidden) {
        if (step === -1) {
          props._placeUnit(selectedUnit.unitNumber, col, row);
        } else {
          props._changeStep(step, 1);
          props._changePosition(
            isPlayer,
            selectedUnit.unitNumber,
            col,
            row
          );
        }
      }
    }
  };

  // Add animate_unit event listener with proper cleanup
  useEffect(() => {
    const handleAnimateUnit = (e: Event) => {
      if (!isCustomEvent(e)) throw new Error("not a custom event");
      const { player, unitIndex, toX, toY } = e.detail;

      // Check if this unit is at the current square (original position)
      if (unit?.unit && player === unit.playerNumber && unitIndex === unit.unitNumber) {
        // To move from square (col, row) to (toX, toY):
        // Since each square-inside element is (100 / boardWidth) % of the board width,
        // translating by (toX - col) * 100% of its own width moves it by (toX - col) squares
        const xTranslate = (toX - col) * 100;
        const yTranslate = (toY - row) * 100;

        // Apply transform to move unit to target position
        setAnimatedUnit({
          player: player,
          unitIndex: unitIndex,
          transform: `translate(${xTranslate}%, ${yTranslate}%)`,
        });
      }
    };

    if (unit?.unit && animationPhase.isAnimating) {
      document.addEventListener("animate_unit", handleAnimateUnit);

      return () => {
        document.removeEventListener("animate_unit", handleAnimateUnit);
      };
    }
  }, [unit?.unit, unit?.playerNumber, unit?.unitNumber, animationPhase.isAnimating, col, row, boardWidth, boardLength]);

  // Reset animated unit when animation ends
  useEffect(() => {
    if (!animationPhase.isAnimating && animatedUnit) {
      setAnimatedUnit(null);
    }
  }, [animationPhase.isAnimating, animatedUnit]);

  // Add boom event listener with proper cleanup
  useEffect(() => {
    // Only add listener if this square should respond to boom events
    if ((ghostUnit.unit || containsOpponentGhostUnits.unit) && !boom) {
      const handleBoom = (e: Event) => {
        if (!isCustomEvent(e)) throw new Error("not a custom event");
        if (e.detail.x === col && e.detail.y === row) {
          _screenShake();
          const audio = new Audio();
          audio.src = AUDIO.boom;
          audio.play();
          setBoom(true);
        }
      };

      document.addEventListener("boom", handleBoom);

      return () => {
        document.removeEventListener("boom", handleBoom);
      };
    }
  }, [ghostUnit.unit, containsOpponentGhostUnits.unit, boom, col, row, _screenShake]);

  // Reset boom animation after 1 second
  useEffect(() => {
    if (boom) {
      const timeout = setTimeout(() => {
        setBoom(false);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [boom]);

  const containsFlag = props.containsFlag;
  const bgcol = containsFlag[0]
    ? players[0].color
    : containsFlag[1]
    ? players[1].color
    : "";
  const isReachable = props.isReachable;
  const opponentCanReach = props.opponentCanReach;
  const isForbidden = props.isForbidden;
  const isInDanger = props.isInDanger;
  const isFlagZone = props.isFlagZone;
  return (
    <div
      className="square-container"
      style={{ width: `${100 / props.boardWidth}%` }}
      data-testid={`square-${col}-${row}`}
    >
      <div
        className={`square${
          unit.unit || (ghostUnit.unit && !animationPhase.isAnimating)
            ? " active"
            : ""
        }${props.selected && unit.unit ? " selected" : ""}${
          isForbidden && !animationPhase.isAnimating ? " forbidden" : ""
        }${bgcol ? " contains-flag" : ""}${isFlagZone ? " flag-zone" : ""}${
          boom ? " boom" : ""
        }`}
        onClick={() => _clickedSquare()}
        onTouchEnd={void 0}
      >
        <div
          className={`square-inside${
            isReachable && !animationPhase.isAnimating ? " reachable" : ""
          } ${
            opponentCanReach && !animationPhase.isAnimating
              ? " opponent-can-reach"
              : ""
          }`}
          style={animatedUnit ? { transform: animatedUnit.transform, transition: 'transform 0.5s ease-in-out' } : undefined}
        >
          {unit?.unit ? (
            <Unit
              unit={unit.unit}
              playerIndex={unit.playerNumber}
              displayUnitInfo={false}
              isGhost={false}
            />
          ) : (
            ""
          )}
          {ghostUnit?.unit ? (
            <Unit
              unit={ghostUnit.unit}
              playerIndex={ghostUnit.playerNumber}
              displayUnitInfo={false}
              isGhost={false}
            />
          ) : (
            ""
          )}
          {bgcol && !ghostUnit.unit && !unit.unit ? (
            <Flag containsFlag={containsFlag} withPlayer={false} />
          ) : (
            ""
          )}
          {isInDanger.map(
            (danger, danger_id) =>
              isInDanger[danger_id] &&
              !unit.unit &&
              !ghostUnit.unit &&
              !animationPhase.isAnimating && (
                <div
                  key={danger_id}
                  className="danger"
                  style={{
                    backgroundColor: players[danger_id].color,
                  }}
                ></div>
              )
          )}
        </div>
      </div>
    </div>
  );
}

export default Square;
