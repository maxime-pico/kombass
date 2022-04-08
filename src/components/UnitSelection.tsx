import React, { useContext } from "react";
import gameContext from "../gameContext";
import TaskForceSelector from "./TaskForceSelector";

interface UnitSelectionProps {
  _placeUnits: () => void;
}

function UnitSelection(props: UnitSelectionProps) {
  return (
    <div className="unitSelection-container">
      <div> Compose your Task Force </div>
      <TaskForceSelector />
      <div>
        {" "}
        <button
          className="button"
          onClick={() => {
            props._placeUnits();
          }}
        >
          {"PLACE UNITS"}
        </button>{" "}
      </div>
    </div>
  );
}

export default UnitSelection;
