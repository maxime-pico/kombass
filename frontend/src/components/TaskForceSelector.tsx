import React, { useContext } from "react";
import gameContext from "../gameContext";
import UnitSelector from "./UnitSelector";

interface TaskForceSelectorProps {}

function TaskForceSelector(props: TaskForceSelectorProps) {
  const { units, isPlayer } = useContext(gameContext);
  const currentPlayersUnits = units[isPlayer];
  return (
    <div className="taskForceSelector-container">
      {currentPlayersUnits.map((unit, unit_index) => {
        return (
          <UnitSelector
            key={unit_index}
            unit={unit}
            unitIndex={unit_index}
            playerIndex={isPlayer}
          />
        );
      })}
    </div>
  );
}

export default TaskForceSelector;
