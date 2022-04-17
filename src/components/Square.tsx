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
    display: boolean;
  };
  containsOpponentGhostUnits: {
    unit: IUnit | null;
    unitNumber: number | null;
    display: boolean;
  };
  isFlagZone: boolean;
  isForbidden: boolean;
  isInDanger: Array<boolean>;
  isReachable: boolean;
  opponentCanReach: boolean;
  playerIndex: number | null;
  row: number;
  selected: boolean;
  unit: { unit: IUnit | null; unitNumber: number | null; display: boolean };
}

function Square(props: SquareProps) {
  const { isPlayer, players, selectedUnit, step, unitsCount } =
    useContext(gameContext);
  const [boom, setBoom] = useState(false);

  const _boom = () => {
    props._screenShake();
    var audio = new Audio();
    audio.src = AUDIO.boom;
    audio.play();
    setBoom(true);
  };

  const _clickedSquare = () => {
    if (step !== unitsCount) {
      if (props.isReachable && !props.isForbidden) {
        if (step === -1) {
          props._placeUnit(selectedUnit.unitNumber, props.col, props.row);
        } else {
          props._changeStep(step, 1);
          props._changePosition(
            isPlayer,
            selectedUnit.unitNumber,
            props.col,
            props.row
          );
        }
      }
    }
  };

  useEffect(() => {
    if (boom) {
      setTimeout(() => {
        setBoom(false);
      }, 1000);
      document.removeEventListener("boom", () => _boom());
    }
  }, [boom, setBoom]);

  const unit = props.unit;
  const ghostUnit = props.ghostUnit;
  const playerIndex = props.playerIndex;

  if ((ghostUnit.unit || props.containsOpponentGhostUnits.unit) && !boom) {
    document.addEventListener("boom", (e: Event) => {
      if (!isCustomEvent(e)) throw new Error("not a custom event");
      // e is now narrowed to CustomEvent ...
      if (e.detail.x === props.col && e.detail.y === props.row) _boom();
    });
  }

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
    >
      <div
        className={`square${unit.unit || ghostUnit.unit ? " active" : ""}${
          props.selected && unit.unit ? " selected" : ""
        }${isForbidden ? " forbidden" : ""}${bgcol ? " contains-flag" : ""}${
          isFlagZone ? " flag-zone" : ""
        }${boom ? " boom" : ""}`}
        onClick={() => _clickedSquare()}
        onTouchEnd={void 0}
      >
        <div
          className={`square-inside${isReachable ? " reachable" : ""} ${
            opponentCanReach ? " opponent-can-reach" : ""
          }`}
        >
          {unit?.unit ? (
            <Unit
              unit={unit.unit}
              playerIndex={playerIndex}
              displayUnitInfo={false}
              isGhost={false}
            />
          ) : (
            ""
          )}
          {ghostUnit?.unit ? (
            <Unit
              unit={ghostUnit.unit}
              playerIndex={playerIndex}
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
              !ghostUnit.unit && (
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
