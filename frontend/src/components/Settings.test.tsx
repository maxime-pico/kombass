jest.mock('../services/socketService', () => {
  const { EventEmitter } = require("events");
  const emitter = new EventEmitter();
  emitter.off = emitter.removeListener.bind(emitter);
  return {
    __esModule: true,
    default: { socket: emitter, connect: jest.fn() },
    __mockEmitter: emitter,
  };
});

jest.mock('../services/gameService', () => ({
  __esModule: true,
  default: {
    onJoinedGame: jest.fn(),
    onSettingsConfirmed: jest.fn(),
  },
}));

global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;

import React from "react";
import { render, act } from "@testing-library/react";
import Settings from "./Settings";
import gameContext from "../gameContext";
import { defaultUnitConfig } from "../utilities/dict";
import gameService from "../services/gameService";

// Access the shared mock emitter (same object used by the mock)
const socketServiceModule = require('../services/socketService');
const mockEmitter = socketServiceModule.__mockEmitter as import("events").EventEmitter;

const defaultContextValue = {
  isAdmin: false,
  _setIsAdmin: jest.fn(),
  _setIsPlayer: jest.fn(),
  _setGameStarted: jest.fn(),
  gameStarted: false,
  boardWidth: 20,
  boardLength: 20,
  _setBoardSize: jest.fn(),
  placementZone: 5,
  _setPlacementZone: jest.fn(),
  unitsCount: 5,
  _setUnitCount: jest.fn(),
  unitConfig: defaultUnitConfig(),
  _setUnitConfig: jest.fn(),
};

function renderSettings(selectUnitsMock: jest.Mock) {
  return render(
    <gameContext.Provider value={defaultContextValue as any}>
      <Settings _selectUnits={selectUnitsMock} roomId="testroom" />
    </gameContext.Provider>
  );
}

describe("Settings component socket events", () => {
  beforeEach(() => {
    mockEmitter.removeAllListeners();
    // Restore implementations (reset by resetMocks: true in react-scripts jest config)
    (gameService.onSettingsConfirmed as jest.Mock).mockImplementation(
      (socket: any, listener: (s: any) => void) => {
        socket.on('settings_confirmed', listener);
      }
    );
  });


  it("calls _selectUnits when settings_confirmed is received", () => {
    const mockSelectUnits = jest.fn();
    renderSettings(mockSelectUnits);

    act(() => {
      mockEmitter.emit("settings_confirmed", {
        boardWidth: 20, boardLength: 20, placementZone: 5, unitsCount: 5,
      });
    });

    expect(mockSelectUnits).toHaveBeenCalledTimes(1);
  });

  it("updates context values from settings_confirmed payload before calling _selectUnits", () => {
    const mockSelectUnits = jest.fn();
    const mockSetUnitCount = jest.fn();
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
});
