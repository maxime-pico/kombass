import React, { useContext } from "react";
import gameContext from "../gameContext";
import Board from "./Board";
import UnitToPlace from "./UnitToPlace";

interface UnitPlacementProps {
  placedUnits: Array<Array<boolean>>;
}

//TODO: Change how placedUnits work to care only for units from current player
// Not skip after all self-units are placed and rather wait for other player to be ready
// Maybe contain that information in an array that needs [true, true] to proceed
// Also exchange unit placement information when proceeding to next step

function UnitPlacement(props: UnitPlacementProps) {
  const { units, isPlayer, selectedUnit } = useContext(gameContext);
  const selectedUnitNumber = selectedUnit.unitNumber;
  return (
    <div className="main">
      <Board placement={true} _screenShake={() => {}} />
      <div className={`unitPlacement${isPlayer ? " left" : " right"}`}>
        <div className="title"> Place your units!</div>
        <div className="unitPlacement-container">
          {props.placedUnits[isPlayer].map((placedUnit, unit_index) => {
            return (
              !placedUnit && (
                <UnitToPlace
                  key={unit_index}
                  playerIndex={isPlayer}
                  unit={units[isPlayer][unit_index]}
                  selected={selectedUnitNumber === unit_index}
                />
              )
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default UnitPlacement;
