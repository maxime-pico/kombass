import React, { useState } from "react";
import TaskForceSelector from "./TaskForceSelector";
import { IUnit, IFlag } from "../App";

interface UnitSelectionProps {
  units: Array<Array<IUnit>>;
  _circleUnit: (
    playerIndex: number,
    unitIndex: number,
    currentType: number,
    direction: number
  ) => void;
  _placeUnits: () => void;
  player: 0 | 1;
  _circlePlayer: () => void;
}

function UnitSelection(props: UnitSelectionProps) {
  const [errors, setErrors] = useState(false);
  const _checkForViolation = (units: Array<IUnit>) => {
    // const unitCount = [0, 0, 0]; // <-- commented to remove unit selection check when player count can be altered
    // units.forEach((unit) => {
    //   unitCount[unit.life - 1] = unitCount[unit.life - 1] + 1;
    // });
    // const violations = unitCount.filter((count) => count > 3);
    // if (violations.length > 0) {
    //   this.setState({
    //     errors: true,
    //   });
    // } else {
    if (props.player === 0) {
      props._circlePlayer();
    } else {
      props._placeUnits();
    }
    // }
    // return true;
  };

  const units = props.units[props.player];
  return (
    <div className="unitSelection-container">
      <div> Compose your Task Force </div>
      <TaskForceSelector
        units={units}
        player={props.player}
        _circleUnit={props._circleUnit}
      />
      <div className="error">{errors ? "Max three units per type!" : ""}</div>
      <div>
        {" "}
        <button
          className="button"
          onClick={() => {
            _checkForViolation(units);
          }}
        >
          {props.player === 0 ? "NEXT" : "START"}{" "}
        </button>{" "}
      </div>
    </div>
  );
}

export default UnitSelection;
