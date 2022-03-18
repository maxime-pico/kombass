import React from "react";
import Unit from "./Unit";
import { IUnit } from "../App";

interface UnitToPlaceProps {
  unit: IUnit;
  playerIndex: number;
  selected: boolean;
}

function UnitToPlace(props: UnitToPlaceProps) {
  const unit = props.unit;
  const playerIndex = props.playerIndex;
  const selected = props.selected;
  return (
    <div className={`unitPlacement-box${selected ? " selected" : ""}`}>
      <div className="unitPlacement-background"></div>
      <Unit
        unit={unit}
        playerIndex={playerIndex}
        isGhost={false}
        displayUnitInfo={false}
      />
    </div>
  );
}

export default UnitToPlace;
