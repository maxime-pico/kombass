import React, { useContext } from "react";
import gameContext from "../gameContext";
import UnitSelector from "./UnitSelector";

interface TaskForceSelectorProps {}

function TaskForceSelector(props: TaskForceSelectorProps) {
  const { units, playerIndex } = useContext(gameContext);
  const currentPlayersUnits = units[playerIndex];
  return (
    <div className="taskForceSelector-container">
      {currentPlayersUnits.map((unit, unitIdx) => {
        return (
          <UnitSelector
            key={unitIdx}
            unit={unit}
            unitIndex={unitIdx}
            playerIndex={playerIndex}
          />
        );
      })}
    </div>
  );
}

export default TaskForceSelector;
