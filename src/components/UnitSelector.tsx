import React from "react";
import Unit from "./Unit";
import { IUnit } from "../App";

interface UnitSelectorProps {
  unit: IUnit;
  playerIndex: number;
  unitIndex: number;
  _circleUnit: (
    playerIndex: number,
    unitIndex: number,
    currentType: number,
    direction: number
  ) => void;
}

function UnitSelector(props: UnitSelectorProps) {
  const unit = props.unit;
  const playerIndex = props.playerIndex;
  const unitIndex = props.unitIndex;
  const currentType = unit.strength - 1;
  return unit ? (
    <div className="taskForceSelector-unit">
      <div
        className="triangle up"
        onClick={() =>
          props._circleUnit(playerIndex, unitIndex, currentType, 1)
        }
      ></div>
      <div className="unit-box">
        <Unit
          unit={unit}
          playerIndex={playerIndex}
          displayUnitInfo
          isGhost={false}
        />
      </div>
      <div
        className="triangle down"
        onClick={() =>
          props._circleUnit(playerIndex, unitIndex, currentType, -1)
        }
      ></div>
    </div>
  ) : null;
}

export default UnitSelector;
