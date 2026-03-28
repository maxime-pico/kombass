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
  const { units, isPlayer, selectedUnit, _startGame, ready } =
    useContext(gameContext);
  const selectedUnitNumber = selectedUnit.unitNumber;
  const allPlaced = props.placedUnits[isPlayer].every(Boolean);
  return (
    <div className="game-container">
      <div className="main placement-main">
        <div className="unitPlacement">
          {!allPlaced && (
            <div className="title">
              {" "}
              Place your units in the{" "}
              <span style={{ color: isPlayer ? "goldenrod" : "darkcyan" }}>
                {isPlayer ? "yellow" : "blue"}
              </span>{" "}
              zone!
            </div>
          )}
          <div className="unitPlacement-container">
            {!allPlaced &&
              props.placedUnits[isPlayer].map((placedUnit, unit_index) => {
                return (
                  <div
                    key={unit_index}
                    style={{ visibility: placedUnit ? "hidden" : "visible" }}
                  >
                    <UnitToPlace
                      playerIndex={isPlayer}
                      unit={units[isPlayer][unit_index]}
                      selected={selectedUnitNumber === unit_index}
                    />
                  </div>
                );
              })}
            {allPlaced && !ready[isPlayer] && (
              <button
                className="fight-button confirm"
                onClick={() => _startGame()}
              >
                CONFIRM PLACEMENT
              </button>
            )}
            {ready[isPlayer] && (
              <button className="fight-button inactive" disabled>
                WAITING FOR OPPONENT...
              </button>
            )}
          </div>
        </div>
        <Board placement={true} _screenShake={() => {}} />
      </div>
    </div>
  );
}

export default UnitPlacement;
