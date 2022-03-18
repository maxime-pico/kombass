import React from "react";

interface SettingsProps {
  boardWidth: number;
  boardLength: number;
  _setBoardSize: ({ length, width }: { length: number; width: number }) => void;
  placementZone: number;
  _setPlacementZone: (zoneSize: number) => void;
  unitsCount: number;
  _setUnitCount: (unitCount: number) => void;
  _selectUnits: () => void;
}

function Settings(props: SettingsProps) {
  return (
    <div id="settings" className="settings-container">
      <div className="title">
        {"//"} Define Game Rules {"//"}
      </div>
      <br />
      <div className="subtitle">How large should the board be?</div>
      <div>
        Length:
        <input
          type="number"
          id="boardWidth"
          name="boardWidth"
          min="20"
          value={props.boardWidth}
          onChange={(e) =>
            props._setBoardSize({
              length: props.boardLength,
              width: parseInt(e.target.value),
            })
          }
        />
        Width
        <input
          type="number"
          id="boardLength"
          name="boardLength"
          min="20"
          value={props.boardLength}
          onChange={(e) =>
            props._setBoardSize({
              length: parseInt(e.target.value),
              width: props.boardWidth,
            })
          }
        />
      </div>
      <br />
      <div className="subtitle">
        How far into the board can units be placed?
      </div>
      <div>
        <input
          type="number"
          id="placementZone"
          name="placementZone"
          min="1"
          value={props.placementZone}
          onChange={(e) => props._setPlacementZone(parseInt(e.target.value))}
        />
      </div>
      <div className="subtitle">How many units per player?</div>
      <div>
        <input
          type="number"
          id="unitsCount"
          name="unitsCount"
          min="1"
          value={props.unitsCount}
          onChange={(e) => props._setUnitCount(parseInt(e.target.value))}
        />
      </div>
      <br />
      <div>
        <button
          className="button active"
          onClick={() => {
            props._selectUnits();
          }}
        >
          {" "}
          READY{" "}
        </button>
      </div>
    </div>
  );
}

export default Settings;
