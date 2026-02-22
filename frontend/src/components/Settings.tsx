import React, { useContext, useEffect } from "react";
import gameContext from "../gameContext";
import socketService from "../services/socketService";
import gameService from "../services/gameService";

interface SettingsProps {
  _selectUnits: () => void;
}

function Settings(props: SettingsProps) {
  const {
    isAdmin,
    _setIsAdmin,
    _setIsPlayer,
    _setGameStarted,
    gameStarted,
    boardWidth,
    boardLength,
    _setBoardSize,
    placementZone,
    _setPlacementZone,
    unitsCount,
    _setUnitCount,
  } = useContext(gameContext);

  const settings = {
    boardWidth: boardWidth,
    boardLength: boardLength,
    placementZone: placementZone,
    unitsCount: unitsCount,
  };

  const settingsReady = () => {
    if (socketService.socket) {
      gameService.onSettingsReady(socketService.socket, settings).then(() => {
        props._selectUnits();
      });
    }
  };

  useEffect(() => {
    const handleGameStart = () => {
      if (socketService.socket) {
        gameService.onJoinedGame(socketService.socket, (options) => {
          _setIsAdmin(options.admin);
          _setIsPlayer(options.player);
          _setGameStarted();
        });
      }
    };

    const updateSettings = () => {
      if (socketService.socket) {
        gameService.updateSettings(socketService.socket, (settings) => {
          _setBoardSize(settings.boardLength, settings.boardWidth);
          _setPlacementZone(settings.placementZone);
          _setUnitCount(settings.unitsCount);
          props._selectUnits();
        });
      }
    };

    handleGameStart();
    updateSettings();
  }, [_setIsAdmin, _setIsPlayer, _setGameStarted, _setBoardSize, _setPlacementZone, _setUnitCount, props]);

  return (
    <div>
      {isAdmin ? (
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
              value={boardWidth}
              onChange={(e) =>
                _setBoardSize(boardLength, parseInt(e.target.value))
              }
            />
            Width
            <input
              type="number"
              id="boardLength"
              name="boardLength"
              min="20"
              value={boardLength}
              onChange={(e) =>
                _setBoardSize(parseInt(e.target.value), boardWidth)
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
              value={placementZone}
              onChange={(e) => _setPlacementZone(parseInt(e.target.value))}
            />
          </div>
          <div className="subtitle">How many units per player?</div>
          <div>
            <input
              type="number"
              id="unitsCount"
              name="unitsCount"
              min="1"
              value={unitsCount}
              onChange={(e) => _setUnitCount(parseInt(e.target.value))}
            />
          </div>
          <br />
          <br />
          <div className="button-container">
            <button
              className={`button ${gameStarted ? "active" : "disabled"}`}
              onClick={() => {
                // props._selectUnits();
                settingsReady();
              }}
              disabled={!gameStarted}
            >
              {" "}
              READY{" "}
            </button>
            {!gameStarted && (
              <div className="hint">
                {" "}
                Waiting for the other player to start...
              </div>
            )}
          </div>
        </div>
      ) : (
        <div id="settings" className="settings-container">
          <div className="title">
            {"//"} Please wait while the other player defines the Game Rules...
            {" //"}
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
