import React, { useContext } from "react";
import Unit from "./Unit";
import { IUnit, ISelectedUnit } from "../App";
import gameContext from "../gameContext";

interface TeamPanelProps {
  units: Array<IUnit>;
  playerIndex: 0 | 1;
  selectedUnit: ISelectedUnit;
}

function TeamPanel(props: TeamPanelProps) {
  const { animationPhase } = useContext(gameContext);
  const units = props.units;
  const playerIndex = props.playerIndex;
  const selectedUnit = props.selectedUnit;
  let selected = false;
  return (
    <div className="teamPanel-container">
      <div className="teamPanel">
        {units.map((unit, unit_index) => {
          if (!unit) return null;
          selected =
            selectedUnit.playerNumber === playerIndex &&
            selectedUnit.unitNumber === unit_index;

          // Check if unit is dead during animation
          const unitKey = `${playerIndex}_${unit_index}`;
          const isDeadDuringAnimation = animationPhase.isAnimating && animationPhase.deadUnits.has(unitKey);
          const isDead = unit.life < 1 || isDeadDuringAnimation;

          return (
            <div key={unit_index} className="teamPanel-box">
              {isDead ? (
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
