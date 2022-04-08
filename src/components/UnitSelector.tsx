import React, { useContext } from "react";
import gameContext from "../gameContext";
import Unit from "./Unit";
import { IUnit } from "../App";

interface UnitSelectorProps {
  unit: IUnit;
  playerIndex: number;
  unitIndex: number;
}

function UnitSelector(props: UnitSelectorProps) {
  const { _circleUnit } = useContext(gameContext);
  const unit = props.unit;
  const playerIndex = props.playerIndex;
  const unitIndex = props.unitIndex;
  const currentType = unit.strength - 1;
  return unit ? (
    <div className="taskForceSelector-unit">
      <div
        className="triangle up"
        onClick={() => _circleUnit(playerIndex, unitIndex, currentType, 1)}
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
        onClick={() => _circleUnit(playerIndex, unitIndex, currentType, -1)}
      ></div>
    </div>
  ) : null;
}

export default UnitSelector;
