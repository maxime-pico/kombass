import React from "react";
import UnitSelector from "./UnitSelector";
import { IUnit, IPlayer } from "../App";

interface TaskForceSelectorProps {
  units: Array<IUnit>;
  player: IPlayer;
  _circleUnit: (
    playerIndex: number,
    unitIndex: number,
    currentType: number,
    direction: number
  ) => void;
}

function TaskForceSelector(props: TaskForceSelectorProps) {
  const units = props.units;
  return (
    <div className="taskForceSelector-container">
      {units.map((unit, unit_index) => {
        return (
          <UnitSelector
            key={unit_index}
            unit={unit}
            unitIndex={unit_index}
            playerIndex={props.player}
            _circleUnit={props._circleUnit}
          />
        );
      })}
    </div>
  );
}

export default TaskForceSelector;
