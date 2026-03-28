import React, { useState, useCallback, useRef } from "react";

type Tool = "flag1" | "flag2" | "terrain" | "clear";

interface MapData {
  boardWidth: number;
  boardLength: number;
  flags: Array<{ x: number; y: number }>;
  terrain: Array<{ x: number; y: number }>;
}

function manhattanDist(x1: number, y1: number, x2: number, y2: number) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function MapDesigner() {
  const [boardWidth, setBoardWidth] = useState(22);
  const [boardLength, setBoardLength] = useState(21);
  const [tool, setTool] = useState<Tool>("terrain");
  const [terrain, setTerrain] = useState<Set<string>>(new Set());
  const [flag1, setFlag1] = useState({ x: 0, y: 10 });
  const [flag2, setFlag2] = useState({ x: 21, y: 10 });
  const isPainting = useRef(false);

  const applyTool = useCallback(
    (col: number, row: number) => {
      switch (tool) {
        case "flag1":
          setFlag1({ x: col, y: row });
          // Clear terrain in new flag zone
          setTerrain((prev) => {
            const next = new Set(prev);
            next.forEach((key) => {
              const [x, y] = key.split(",").map(Number);
              if (manhattanDist(x, y, col, row) <= 3) next.delete(key);
            });
            return next;
          });
          break;
        case "flag2":
          setFlag2({ x: col, y: row });
          setTerrain((prev) => {
            const next = new Set(prev);
            next.forEach((key) => {
              const [x, y] = key.split(",").map(Number);
              if (manhattanDist(x, y, col, row) <= 3) next.delete(key);
            });
            return next;
          });
          break;
        case "terrain": {
          const key = `${col},${row}`;
          // Don't place terrain in flag zones
          if (manhattanDist(col, row, flag1.x, flag1.y) <= 3) return;
          if (manhattanDist(col, row, flag2.x, flag2.y) <= 3) return;
          setTerrain((prev) => new Set(prev).add(key));
          break;
        }
        case "clear": {
          const key = `${col},${row}`;
          setTerrain((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
          break;
        }
      }
    },
    [tool, flag1, flag2]
  );

  const handleMouseDown = (col: number, row: number) => {
    isPainting.current = true;
    applyTool(col, row);
  };

  const handleMouseOver = (col: number, row: number) => {
    if (isPainting.current && (tool === "terrain" || tool === "clear")) {
      applyTool(col, row);
    }
  };

  const handleMouseUp = () => {
    isPainting.current = false;
  };

  const exportMap = () => {
    const data: MapData = {
      boardWidth,
      boardLength,
      flags: [flag1, flag2],
      terrain: Array.from(terrain).map((key) => {
        const [x, y] = key.split(",").map(Number);
        return { x, y };
      }),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `map-${boardWidth}x${boardLength}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importMap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data: MapData = JSON.parse(reader.result as string);
        setBoardWidth(data.boardWidth);
        setBoardLength(data.boardLength);
        setFlag1(data.flags[0]);
        setFlag2(data.flags[1]);
        setTerrain(new Set(data.terrain.map((t) => `${t.x},${t.y}`)));
      } catch {
        alert("Invalid map file");
      }
    };
    reader.readAsText(file);
  };

  const handleResize = (newWidth: number, newLength: number) => {
    setBoardWidth(newWidth);
    setBoardLength(newLength);
    // Clamp flags to new bounds
    setFlag1((f) => ({
      x: Math.min(f.x, newWidth - 1),
      y: Math.min(f.y, newLength - 1),
    }));
    setFlag2((f) => ({
      x: Math.min(f.x, newWidth - 1),
      y: Math.min(f.y, newLength - 1),
    }));
    // Remove out-of-bounds terrain
    setTerrain((prev) => {
      const next = new Set<string>();
      prev.forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        if (x < newWidth && y < newLength) next.add(key);
      });
      return next;
    });
  };

  const getSquareClass = (col: number, row: number) => {
    const key = `${col},${row}`;
    if (col === flag1.x && row === flag1.y) return "designer-flag1";
    if (col === flag2.x && row === flag2.y) return "designer-flag2";
    if (terrain.has(key)) return "designer-terrain";
    if (manhattanDist(col, row, flag1.x, flag1.y) <= 3) return "designer-zone1";
    if (manhattanDist(col, row, flag2.x, flag2.y) <= 3) return "designer-zone2";
    return "";
  };

  const toolButtons: Array<{ id: Tool; label: string }> = [
    { id: "flag1", label: "Flag P1" },
    { id: "flag2", label: "Flag P2" },
    { id: "terrain", label: "Terrain" },
    { id: "clear", label: "Eraser" },
  ];

  return (
    <div className="map-designer" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="designer-toolbar">
        <h2>Map Designer</h2>
        <div className="designer-controls">
          <label>
            Width:{" "}
            <input
              type="number"
              min="8"
              max="40"
              value={boardWidth}
              onChange={(e) => handleResize(parseInt(e.target.value) || 8, boardLength)}
            />
          </label>
          <label>
            Height:{" "}
            <input
              type="number"
              min="8"
              max="40"
              value={boardLength}
              onChange={(e) => handleResize(boardWidth, parseInt(e.target.value) || 8)}
            />
          </label>
        </div>
        <div className="designer-tools">
          {toolButtons.map((t) => (
            <button
              key={t.id}
              className={`designer-tool-btn${tool === t.id ? " active" : ""}`}
              onClick={() => setTool(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="designer-actions">
          <button className="button active" onClick={exportMap}>
            Export JSON
          </button>
          <label className="button active" style={{ cursor: "pointer" }}>
            Import JSON
            <input
              type="file"
              accept=".json"
              onChange={importMap}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </div>

      <div
        className="designer-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${boardWidth}, 1fr)`,
          userSelect: "none",
        }}
      >
        {Array.from({ length: boardLength }, (_, row) =>
          Array.from({ length: boardWidth }, (_, col) => (
            <div
              key={`${col}-${row}`}
              className={`designer-square ${getSquareClass(col, row)}`}
              onMouseDown={() => handleMouseDown(col, row)}
              onMouseOver={() => handleMouseOver(col, row)}
            />
          ))
        )}
      </div>

      <div className="designer-legend">
        <span><span className="legend-swatch designer-flag1" /> Flag P1</span>
        <span><span className="legend-swatch designer-zone1" /> P1 Zone</span>
        <span><span className="legend-swatch designer-flag2" /> Flag P2</span>
        <span><span className="legend-swatch designer-zone2" /> P2 Zone</span>
        <span><span className="legend-swatch designer-terrain" /> Terrain</span>
      </div>
    </div>
  );
}

export default MapDesigner;
