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
  const { units, playerIndex, selectedUnit, startGame, ready } =
    useContext(gameContext);
  const selectedUnitNumber = selectedUnit.unitNumber;
  const allPlaced = props.placedUnits[playerIndex].every(Boolean);
  return (
    <div className="game-container">
      <div className="main placement-main">
        <div className="unitPlacement">
          {!allPlaced && (
            <div className="title">
              {" "}
              Place your units in the{" "}
              <span style={{ color: playerIndex ? "goldenrod" : "darkcyan" }}>
                {playerIndex ? "yellow" : "blue"}
              </span>{" "}
              zone!
            </div>
          )}
          <div className="unitPlacement-container">
            {!allPlaced &&
              props.placedUnits[playerIndex].map((placedUnit, unitIdx) => {
                return (
                  <div
                    key={unitIdx}
                    style={{ visibility: placedUnit ? "hidden" : "visible" }}
                  >
                    <UnitToPlace
                      playerIndex={playerIndex}
                      unit={units[playerIndex][unitIdx]}
                      selected={selectedUnitNumber === unitIdx}
                    />
                  </div>
                );
              })}
            {allPlaced && !ready[playerIndex] && (
              <button
                className="fight-button confirm"
                onClick={() => startGame()}
              >
                CONFIRM PLACEMENT
              </button>
            )}
            {ready[playerIndex] && (
              <button className="fight-button inactive" disabled>
                WAITING FOR OPPONENT...
              </button>
            )}
          </div>
        </div>
        <Board placement={true} screenShake={() => {}} />
      </div>
    </div>
  );
}

export default UnitPlacement;
