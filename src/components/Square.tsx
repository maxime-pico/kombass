import React, { useState, useEffect } from "react";
import Unit from "./Unit";
import Flag from "./Flag";
import { AUDIO } from "../utilities/dict";
import { IUnit, IPlayers, ISelectedUnit } from "../App";

interface SquareProps {
  col: number;
  row: number;
  unit: { unit: IUnit | null; unitNumber: number | null; display: boolean };
  futureUnits: Array<Array<IUnit>>;
  ghostUnit: {
    unit: IUnit | null;
    unitNumber: number | null;
    display: boolean;
  };
  playerIndex: 0 | 1 | null;
  players: IPlayers;
  _changeStep: (step: number, direction: -1 | 1) => void;
  step: number;
  _changePosition: (
    playerNumber: number,
    unitNumber: number,
    x: number,
    y: number
  ) => void;
  isReachable: boolean;
  isForbidden: boolean;
  isInDanger: Array<boolean>;
  isFlagZone: boolean;
  selected: boolean;
  selectedUnit: ISelectedUnit;
  containsFlag: Array<boolean>;
  _placeUnit: (
    playerNumber: number,
    unitNumber: number,
    col: number,
    row: number
  ) => void;
  player: 0 | 1;
  _screenShake: () => void;
  unitsCount: number;
  boardWidth: number;
}

function Square(props: SquareProps) {
  const [boom, setBoom] = useState(false);

  const squareRef = React.createRef() as React.RefObject<HTMLDivElement>;

  const _boom = () => {
    props._screenShake();
    var audio = new Audio();
    audio.src = AUDIO.boom;
    audio.play();
    setBoom(true);
  };

  const _clickedSquare = () => {
    const playerNumber = props.step < props.unitsCount ? 0 : 1;
    if (props.step !== props.unitsCount * 2) {
      if (props.isReachable && !props.isForbidden) {
        if (props.step === -1) {
          props._placeUnit(
            props.player,
            props.selectedUnit.unitNumber,
            props.col,
            props.row
          );
        } else {
          props._changeStep(props.step, 1);
          props._changePosition(
            playerNumber,
            props.selectedUnit.unitNumber,
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
      window.removeEventListener("boom", () => _boom());
    }
  }, [boom, setBoom]);

  const unit = props.unit;
  const ghostUnit = props.ghostUnit;
  const playerIndex = props.playerIndex;

  if (ghostUnit.unit && !boom) {
    if (
      props.futureUnits &&
      props.futureUnits.reduce(
        (playersFutureUnits, futureUnit) =>
          playersFutureUnits || futureUnit[ghostUnit.unitNumber || 0]?.life < 1,
        false
      )
    ) {
      window.addEventListener("boom", () => _boom());
    }
  }

  const containsFlag = props.containsFlag;
  const bgcol = containsFlag[0]
    ? props.players[0].color
    : containsFlag[1]
    ? props.players[1].color
    : "";
  const isReachable = props.isReachable;
  const isForbidden = props.isForbidden;
  const isInDanger = props.isInDanger;
  const isFlagZone = props.isFlagZone;
  return (
    <div
      className="square-container"
      style={{ width: `${100 / props.boardWidth}%` }}
    >
      <div
        ref={squareRef}
        className={`square${unit.unit || ghostUnit.unit ? " active" : ""}${
          props.selected && unit.unit ? " selected" : ""
        }${isForbidden ? " forbidden" : ""}${bgcol ? " contains-flag" : ""}${
          isFlagZone ? " flag-zone" : ""
        }${boom ? " boom" : ""}`}
        onClick={() => _clickedSquare()}
        onTouchEnd={void 0}
      >
        <div className={`square-inside${isReachable ? " reachable" : ""}`}>
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
          {isInDanger.map((danger, danger_id) =>
            isInDanger[danger_id] &&
            !unit.unit &&
            !ghostUnit.unit &&
            danger_id !== 2 ? (
              <div
                key={danger_id}
                className="danger"
                style={{
                  backgroundColor: props.players[danger_id].color,
                }}
              ></div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}

export default Square;
