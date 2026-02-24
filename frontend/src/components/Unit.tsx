import React from "react";
import { UNITS } from "../utilities/dict";
import Flag from "./Flag";
import { IUnit } from "../App";

interface UnitProps {
  unit: IUnit | null;
  playerIndex: number | null;
  displayUnitInfo: boolean;
  isGhost: boolean;
}

function Unit(props: UnitProps) {
  const unit = props.unit || {
    strength: 0,
    speed: 0,
    x: 0,
    y: 0,
    life: 0,
    hasFlag: false,
    unitType: 0,
  };
  let isGhost = props.isGhost ? " ghost" : "";
  const playerIndex = props.playerIndex || 0;
  const hasFlag = unit?.hasFlag;
  const unitSprite = UNITS[unit ? (unit.unitType ?? 0) : 0]?.svg[playerIndex || 0];
  const displayUnitInfo = props.displayUnitInfo ? true : false;
  let containsFlag = [];
  containsFlag[(playerIndex + 1) % 2] = hasFlag;
  return (
    <div className={`unit${hasFlag ? " has-flag" : ""}${isGhost}`}>
      <div className={`unit-sprite${hasFlag ? " mirror" : ""}`}>
        <img src={unitSprite} alt="player unit" />
      </div>
      {displayUnitInfo ? (
        <div className="unit-info">{`HP:${unit.life} S:${unit.strength}`}</div>
      ) : null}
      {hasFlag ? <Flag containsFlag={containsFlag} withPlayer={true} /> : null}
    </div>
  );
}

export default Unit;
