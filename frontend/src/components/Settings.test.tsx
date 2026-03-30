import { vi, type Mock } from 'vitest';

const { mockEmitter } = vi.hoisted(() => {
  const { EventEmitter } = require("events");
  const mockEmitter = new EventEmitter();
  mockEmitter.off = mockEmitter.removeListener.bind(mockEmitter);
  return { mockEmitter };
});

vi.mock('../services/socketService', () => ({
  __esModule: true,
  default: { socket: mockEmitter, connect: vi.fn() },
}));

vi.mock('../services/gameService', () => ({
  __esModule: true,
  default: {
    onJoinedGame: vi.fn(),
    onSettingsConfirmed: vi.fn(),
  },
}));

global.fetch = vi.fn().mockResolvedValue({ ok: true }) as any;

import React from "react";
import { render, act, fireEvent, waitFor } from "@testing-library/react";
import Settings from "./Settings";
import gameContext from "../gameContext";
import { defaultUnitConfig } from "../utilities/dict";
import gameService from "../services/gameService";

const defaultContextValue = {
  isAdmin: false,
  _setIsAdmin: vi.fn(),
  _setIsPlayer: vi.fn(),
  _setGameStarted: vi.fn(),
  gameStarted: false,
  boardWidth: 20,
  boardLength: 20,
  _setBoardSize: vi.fn(),
  placementZone: 5,
  _setPlacementZone: vi.fn(),
  unitsCount: 5,
  _setUnitCount: vi.fn(),
  unitConfig: defaultUnitConfig(),
  _setUnitConfig: vi.fn(),
  _setTerrain: vi.fn(),
  _setFlags: vi.fn(),
  _setFlagStayInPlace: vi.fn(),
  flagStayInPlace: false,
  flags: [
    { x: 0, y: 10, originX: 0, originY: 10, inZone: true },
    { x: 19, y: 10, originX: 19, originY: 10, inZone: true },
  ],
};

function renderSettings(selectUnitsMock: Mock) {
  return render(
    <gameContext.Provider value={defaultContextValue as any}>
      <Settings _selectUnits={selectUnitsMock} roomId="testroom" />
    </gameContext.Provider>
  );
}

describe("Settings READY button gating", () => {
  it("READY button is disabled when gameStarted is false", () => {
    const { getByText } = render(
      <gameContext.Provider value={{ ...defaultContextValue, gameStarted: false, isAdmin: true } as any}>
        <Settings _selectUnits={vi.fn()} roomId="testroom" />
      </gameContext.Provider>
    );
    expect(getByText("READY").closest("button")).toBeDisabled();
  });

  it("READY button is enabled when gameStarted is true", () => {
    const { getByText } = render(
      <gameContext.Provider value={{ ...defaultContextValue, gameStarted: true, isAdmin: true } as any}>
        <Settings _selectUnits={vi.fn()} roomId="testroom" />
      </gameContext.Provider>
    );
    expect(getByText("READY").closest("button")).not.toBeDisabled();
  });
});

describe("Settings component socket events", () => {
  beforeEach(() => {
    mockEmitter.removeAllListeners();
    (gameService.onSettingsConfirmed as Mock).mockImplementation(
      (socket: any, listener: (s: any) => void) => {
        socket.on('settings_confirmed', listener);
      }
    );
  });


  it("calls _selectUnits when settings_confirmed is received", () => {
    const mockSelectUnits = vi.fn();
    renderSettings(mockSelectUnits);

    act(() => {
      mockEmitter.emit("settings_confirmed", {
        boardWidth: 20, boardLength: 20, placementZone: 5, unitsCount: 5,
      });
    });

    expect(mockSelectUnits).toHaveBeenCalledTimes(1);
  });

  it("updates context values from settings_confirmed payload before calling _selectUnits", () => {
    const mockSelectUnits = vi.fn();
    const mockSetUnitCount = vi.fn();
    render(
      <gameContext.Provider value={{ ...defaultContextValue, _setUnitCount: mockSetUnitCount } as any}>
        <Settings _selectUnits={mockSelectUnits} roomId="testroom" />
      </gameContext.Provider>
    );
    act(() => {
      mockEmitter.emit("settings_confirmed", {
        boardWidth: 25, boardLength: 30, placementZone: 4, unitsCount: 3,
      });
    });
    expect(mockSetUnitCount).toHaveBeenCalledWith(3);
    expect(mockSelectUnits).toHaveBeenCalledTimes(1);
  });

  it("applies flags from settings_confirmed payload via _setBoardSize", () => {
    const mockSelectUnits = vi.fn();
    const mockSetBoardSize = vi.fn();
    render(
      <gameContext.Provider value={{ ...defaultContextValue, _setBoardSize: mockSetBoardSize } as any}>
        <Settings _selectUnits={mockSelectUnits} roomId="testroom" />
      </gameContext.Provider>
    );
    const customFlags = [
      { x: 0, y: 0, originX: 0, originY: 0, inZone: true },
      { x: 11, y: 9, originX: 11, originY: 9, inZone: true },
    ];
    act(() => {
      mockEmitter.emit("settings_confirmed", {
        boardWidth: 12, boardLength: 10, placementZone: 5, unitsCount: 5,
        flags: customFlags,
      });
    });
    expect(mockSetBoardSize).toHaveBeenCalledWith(10, 12, customFlags);
    expect(mockSelectUnits).toHaveBeenCalledTimes(1);
  });
});

describe("Custom map import", () => {
  const testMapData = {
    boardWidth: 12,
    boardLength: 10,
    flags: [{ x: 0, y: 0 }, { x: 11, y: 9 }],
    terrain: [
      { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 },
      { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 6, y: 6 },
      { x: 5, y: 6 }, { x: 5, y: 7 },
    ],
  };

  function createMapFile() {
    const content = JSON.stringify(testMapData);
    return new File([content], "test-map.json", { type: "application/json" });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockEmitter.removeAllListeners();
    (gameService.onSettingsConfirmed as Mock).mockImplementation(
      (socket: any, listener: (s: any) => void) => {
        socket.on("settings_confirmed", listener);
      }
    );
  });

  it("imports map file and updates board size", async () => {
    const mockSetBoardSize = vi.fn();
    const { container } = render(
      <gameContext.Provider value={{ ...defaultContextValue, isAdmin: true, gameStarted: true, _setBoardSize: mockSetBoardSize } as any}>
        <Settings _selectUnits={vi.fn()} roomId="testroom" />
      </gameContext.Provider>
    );

    const fileInput = container.querySelector("input[type='file'][accept='.json']") as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [createMapFile()] } });
      // Wait for FileReader to complete
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockSetBoardSize).toHaveBeenCalledWith(10, 12);
  });

  it("shows 'using imported map' and disables terrain slider after import", async () => {
    const { container, getByText } = render(
      <gameContext.Provider value={{ ...defaultContextValue, isAdmin: true, gameStarted: true } as any}>
        <Settings _selectUnits={vi.fn()} roomId="testroom" />
      </gameContext.Provider>
    );

    const fileInput = container.querySelector("input[type='file'][accept='.json']") as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [createMapFile()] } });
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(getByText("using imported map")).toBeTruthy();

    // Terrain percentage input should be disabled
    const terrainInput = container.querySelector("input[type='number'][min='0'][max='30']") as HTMLInputElement;
    expect(terrainInput.disabled).toBe(true);
  });

  it("sends imported terrain and flags when READY is clicked", async () => {
    (global.fetch as Mock).mockResolvedValue({ ok: true });
    const mockSetTerrain = vi.fn();
    const mockSetFlags = vi.fn();
    const { container, getByText } = render(
      <gameContext.Provider value={{
        ...defaultContextValue,
        isAdmin: true,
        gameStarted: true,
        _setTerrain: mockSetTerrain,
        _setFlags: mockSetFlags,
      } as any}>
        <Settings _selectUnits={vi.fn()} roomId="testroom" />
      </gameContext.Provider>
    );

    const fileInput = container.querySelector("input[type='file'][accept='.json']") as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [createMapFile()] } });
      await new Promise((r) => setTimeout(r, 50));
    });

    // Click READY
    await act(async () => {
      fireEvent.click(getByText("READY"));
    });

    // Should have called _setTerrain with the imported terrain
    expect(mockSetTerrain).toHaveBeenCalledWith(testMapData.terrain);

    // Should have called _setFlags with full flag objects
    expect(mockSetFlags).toHaveBeenCalledWith([
      { x: 0, y: 0, originX: 0, originY: 0, inZone: true },
      { x: 11, y: 9, originX: 11, originY: 9, inZone: true },
    ]);

    // fetch should have been called with terrain in body
    expect(global.fetch).toHaveBeenCalled();
    const fetchCall = (global.fetch as Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.terrain).toEqual(testMapData.terrain);
    expect(body.flags).toBeTruthy();
    expect(body.randomTerrain).toBe(false);
  });

  it("clearing imported map re-enables terrain slider", async () => {
    const { container, getByText, queryByText } = render(
      <gameContext.Provider value={{ ...defaultContextValue, isAdmin: true, gameStarted: true } as any}>
        <Settings _selectUnits={vi.fn()} roomId="testroom" />
      </gameContext.Provider>
    );

    const fileInput = container.querySelector("input[type='file'][accept='.json']") as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [createMapFile()] } });
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(getByText("using imported map")).toBeTruthy();

    // Click Clear button
    await act(async () => {
      fireEvent.click(getByText("Clear"));
    });

    expect(queryByText("using imported map")).toBeNull();

    const terrainInput = container.querySelector("input[type='number'][min='0'][max='30']") as HTMLInputElement;
    expect(terrainInput.disabled).toBe(false);
  });
});
