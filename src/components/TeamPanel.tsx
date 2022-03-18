import React from "react";
import Unit from "./Unit";
import { IUnit, ISelectedUnit } from "../App";

interface TeamPanelProps {
  units: Array<IUnit>;
  playerIndex: 0 | 1;
  selectedUnit: ISelectedUnit;
}

function TeamPanel(props: TeamPanelProps) {
  const units = props.units;
  const playerIndex = props.playerIndex;
  const selectedUnit = props.selectedUnit;
  let selected = false;
  return (
    <div className="teamPanel-container">
      <div className="teamPanel">
        {units.map((unit, unit_index) => {
          selected =
            selectedUnit.playerNumber === playerIndex &&
            selectedUnit.unitNumber === unit_index;
          return (
            <div key={unit_index} className="teamPanel-box">
              {unit.life < 1 ? (
                <div
                  className={`unitPanel-foreground p${playerIndex + 1}${
                    selected ? " selected" : ""
                  }`}
                ></div>
              ) : null}
              <Unit
                unit={unit}
                playerIndex={playerIndex}
                displayUnitInfo
                isGhost={false}
              />
              <div
                className={`unitPanel-background p${playerIndex + 1}${
                  selected ? " selected" : ""
                }`}
              ></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TeamPanel;
