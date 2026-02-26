import React, { useContext, useEffect, useState } from "react";
import gameContext from "../gameContext";
import socketService from "../services/socketService";
import gameService from "../services/gameService";
import type { UnitConfig } from "../utilities/dict";
import { defaultUnitConfig } from "../utilities/dict";
import { generateTerrain } from "../engine/terrainGenerator";

interface SettingsProps {
  _selectUnits: () => void;
  roomId: string;
}

const backendUrl = process.env.REACT_APP_BACKEND_URL || "";

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
    _setTerrain,
    flags,
  } = useContext(gameContext);

  const [terrainPercentage, setTerrainPercentage] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localUnitConfig, setLocalUnitConfig] = useState<UnitConfig>(
    unitConfig || defaultUnitConfig()
  );

  const handleUnitConfigChange = (
    unitType: keyof UnitConfig,
    property: "strength" | "range" | "speed" | "life",
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
    _setUnitConfig(localUnitConfig);
    let terrain: Array<{ x: number; y: number }> = [];
    if (terrainPercentage > 0) {
      terrain = generateTerrain(boardWidth, boardLength, flags, placementZone, terrainPercentage);
      _setTerrain(terrain);
    }
    const body = { ...settings, terrain, terrainPercentage, randomTerrain: terrainPercentage > 0 };
    fetch(`${backendUrl}/api/room/${props.roomId}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch((err) => console.error("Error confirming settings:", err));
  };

  useEffect(() => {
    if (!socketService.socket) return;
    const socket = socketService.socket;

    gameService.onJoinedGame(socket, (options) => {
      _setIsAdmin(options.admin);
      _setIsPlayer(options.player);
      _setGameStarted();
    });


    const onConfirmed = (settings: { boardWidth: number; boardLength: number; placementZone: number; unitsCount: number; unitConfig?: UnitConfig; terrain?: Array<{ x: number; y: number }> }) => {
      _setBoardSize(settings.boardLength, settings.boardWidth);
      _setPlacementZone(settings.placementZone);
      _setUnitCount(settings.unitsCount);
      if (settings.unitConfig) {
        _setUnitConfig(settings.unitConfig);
        setLocalUnitConfig(settings.unitConfig);
      }
      if (settings.terrain) {
        _setTerrain(settings.terrain);
      }
      props._selectUnits();
    };
    gameService.onSettingsConfirmed(socket, onConfirmed);

    return () => {
      socket.off("settings_confirmed", onConfirmed);
    };
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
          <div className="subtitle">How much destroyed terrain? (%)</div>
          <div style={{ display: "flex", alignItems: "center", width: "260px" }}>
            <input
              type="number"
              min="0"
              max="30"
              value={terrainPercentage}
              onChange={(e) => setTerrainPercentage(Math.max(0, Math.min(30, parseInt(e.target.value) || 0)))}
            />
            <span style={{ marginLeft: "8px", opacity: 0.6 }}>
              {terrainPercentage === 0 ? "no destroyed terrain" : `~${terrainPercentage}% of squares destroyed`}
            </span>
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
                    <th style={{ padding: "8px", textAlign: "left" }}>Range</th>
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
                          value={localUnitConfig[unitType].range}
                          onChange={(e) =>
                            handleUnitConfigChange(
                              unitType,
                              "range",
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
