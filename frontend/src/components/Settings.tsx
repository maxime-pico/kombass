import React, { useContext, useEffect, useState } from "react";
import gameContext from "../gameContext";
import socketService from "../services/socketService";
import gameService from "../services/gameService";
import type { UnitConfig } from "../utilities/dict";
import { defaultUnitConfig } from "../utilities/dict";

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
    unitConfig,
    _setUnitConfig,
  } = useContext(gameContext);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localUnitConfig, setLocalUnitConfig] = useState<UnitConfig>(
    unitConfig || defaultUnitConfig()
  );

  const handleUnitConfigChange = (
    unitType: keyof UnitConfig,
    property: "strength" | "speed" | "life",
    value: number
  ) => {
    const updated = { ...localUnitConfig };
    updated[unitType] = { ...updated[unitType], [property]: value };
    setLocalUnitConfig(updated);
  };

  const settings = {
    boardWidth: boardWidth,
    boardLength: boardLength,
    placementZone: placementZone,
    unitsCount: unitsCount,
    unitConfig: localUnitConfig,
  };

  const settingsReady = () => {
    if (socketService.socket) {
      _setUnitConfig(localUnitConfig);
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
          if (settings.unitConfig) {
            _setUnitConfig(settings.unitConfig);
            setLocalUnitConfig(settings.unitConfig);
          }
          props._selectUnits();
        });
      }
    };

    handleGameStart();
    updateSettings();
  }, [_setIsAdmin, _setIsPlayer, _setGameStarted, _setBoardSize, _setPlacementZone, _setUnitCount, _setUnitConfig, props]);

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
          <div className="subtitle">
            <button
              className="advanced-toggle"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                fontSize: "inherit",
                fontWeight: "inherit",
              }}
            >
              {showAdvanced ? "▼" : "▶"} Advanced Unit Configuration
            </button>
          </div>
          {showAdvanced && (
            <div className="advanced-section" style={{ marginLeft: "20px" }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "8px", textAlign: "left" }}>Unit</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>
                      Strength
                    </th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Speed</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Life</th>
                  </tr>
                </thead>
                <tbody>
                  {(["light", "medium", "heavy"] as const).map((unitType) => (
                    <tr key={unitType}>
                      <td style={{ padding: "8px", textTransform: "capitalize" }}>
                        {unitType}
                      </td>
                      <td style={{ padding: "8px" }}>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={localUnitConfig[unitType].strength}
                          onChange={(e) =>
                            handleUnitConfigChange(
                              unitType,
                              "strength",
                              parseInt(e.target.value)
                            )
                          }
                          style={{ width: "50px" }}
                        />
                      </td>
                      <td style={{ padding: "8px" }}>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={localUnitConfig[unitType].speed}
                          onChange={(e) =>
                            handleUnitConfigChange(
                              unitType,
                              "speed",
                              parseInt(e.target.value)
                            )
                          }
                          style={{ width: "50px" }}
                        />
                      </td>
                      <td style={{ padding: "8px" }}>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={localUnitConfig[unitType].life}
                          onChange={(e) =>
                            handleUnitConfigChange(
                              unitType,
                              "life",
                              parseInt(e.target.value)
                            )
                          }
                          style={{ width: "50px" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
