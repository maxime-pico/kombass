import React, { useContext, useEffect, useState } from "react";
import gameContext from "../gameContext";
import socketService from "../services/socketService";
import gameService from "../services/gameService";
import type { UnitConfig } from "../utilities/dict";
import { defaultUnitConfig } from "../utilities/dict";
import { generateTerrain } from "../engine/terrainGenerator";

interface SettingsProps {
  selectUnits: () => void;
  roomId: string;
}

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:9000";

function Settings(props: SettingsProps) {
  const {
    isAdmin,
    setIsAdmin,
    setPlayerIndex,
    setGameStarted,
    gameStarted,
    boardWidth,
    boardLength,
    setBoardSize,
    placementZone,
    setPlacementZone,
    unitsCount,
    setUnitCount,
    unitConfig,
    setUnitConfig,
    setTerrain,
    setFlags,
    setFlagStayInPlace,
    flagStayInPlace,
    flags,
  } = useContext(gameContext);

  const [terrainPercentage, setTerrainPercentage] = useState(0);
  const [importedMap, setImportedMap] = useState<{ terrain: Array<{ x: number; y: number }>; flags: Array<{ x: number; y: number }> } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const roomCode = props.roomId;
  const roomUrl = window.location.origin + "/game/" + roomCode;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
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
    flagStayInPlace: flagStayInPlace,
  };

  const settingsReady = () => {
    setUnitConfig(localUnitConfig);
    let terrain: Array<{ x: number; y: number }> = [];
    if (importedMap) {
      terrain = importedMap.terrain;
      setTerrain(terrain);
      const importedFlags = importedMap.flags.map((f) => ({
        x: f.x, y: f.y, originX: f.x, originY: f.y, inZone: true,
      }));
      setFlags(importedFlags);
    } else if (terrainPercentage > 0) {
      terrain = generateTerrain(boardWidth, boardLength, flags, placementZone, terrainPercentage);
      setTerrain(terrain);
    }
    const body = { ...settings, terrain, terrainPercentage, randomTerrain: terrainPercentage > 0 && !importedMap, flags: importedMap ? importedMap.flags.map((f) => ({ x: f.x, y: f.y, originX: f.x, originY: f.y, inZone: true })) : undefined };
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
      setIsAdmin(options.admin);
      setPlayerIndex(options.player);
      setGameStarted();
    });


    const onConfirmed = (settings: { boardWidth: number; boardLength: number; placementZone: number; unitsCount: number; unitConfig?: UnitConfig; terrain?: Array<{ x: number; y: number }>; flags?: Array<{ x: number; y: number; originX: number; originY: number; inZone: boolean }>; flagStayInPlace?: boolean }) => {
      setBoardSize(settings.boardLength, settings.boardWidth, settings.flags || undefined);
      setPlacementZone(settings.placementZone);
      setUnitCount(settings.unitsCount);
      if (settings.unitConfig) {
        setUnitConfig(settings.unitConfig);
        setLocalUnitConfig(settings.unitConfig);
      }
      if (settings.terrain) {
        setTerrain(settings.terrain);
      }
      if (settings.flagStayInPlace !== undefined) {
        setFlagStayInPlace(settings.flagStayInPlace);
      }
      props.selectUnits();
    };
    gameService.onSettingsConfirmed(socket, onConfirmed);

    return () => {
      socket.off("settings_confirmed", onConfirmed);
    };
  }, [setIsAdmin, setPlayerIndex, setGameStarted, setBoardSize, setPlacementZone, setUnitCount, setUnitConfig, setFlagStayInPlace, props]);

  return (
    <div>
      {isAdmin ? (
        <div id="settings" className="settings-container">
          <div className="title">
            {"//"} Define Game Rules {"//"}
          </div>
          <div className="room-code-display">
            <div className="room-code-label">Room Code</div>
            <div className="room-code-value">{roomCode}</div>
            <div className="room-code-buttons">
              <button className="room-code-copy-btn" onClick={() => copyToClipboard(roomCode, setCodeCopied)}>
                {codeCopied ? "Copied!" : "Copy Code"}
              </button>
              <button className="room-code-copy-btn" onClick={() => copyToClipboard(roomUrl, setLinkCopied)}>
                {linkCopied ? "Copied!" : "Copy Link"}
              </button>
            </div>
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
                setBoardSize(boardLength, parseInt(e.target.value))
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
                setBoardSize(parseInt(e.target.value), boardWidth)
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
              onChange={(e) => setPlacementZone(parseInt(e.target.value))}
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
              onChange={(e) => setUnitCount(parseInt(e.target.value))}
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
              disabled={!!importedMap}
            />
            <span style={{ marginLeft: "8px", opacity: 0.6 }}>
              {importedMap ? "using imported map" : terrainPercentage === 0 ? "no destroyed terrain" : `~${terrainPercentage}% of squares destroyed`}
            </span>
          </div>
          <br />
          <div className="subtitle">Or import a custom map</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label className="button active" style={{ cursor: "pointer", fontSize: "14px", padding: "4px 12px" }}>
              Import Map JSON
              <input
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const data = JSON.parse(reader.result as string);
                      setBoardSize(data.boardLength, data.boardWidth);
                      setImportedMap({ terrain: data.terrain || [], flags: data.flags || [] });
                    } catch {
                      console.error("Invalid map file");
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
            {importedMap && (
              <button
                className="button"
                style={{ fontSize: "14px", padding: "4px 12px" }}
                onClick={() => setImportedMap(null)}
              >
                Clear
              </button>
            )}
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
              <div style={{ marginBottom: "12px" }}>
                <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={flagStayInPlace}
                    onChange={(e) => setFlagStayInPlace(e.target.checked)}
                  />
                  Flag stays in place when carrier dies
                </label>
              </div>
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
                // props.selectUnits();
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
          <div className="room-code-display">
            <div className="room-code-label">Room Code</div>
            <div className="room-code-value">{roomCode}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
