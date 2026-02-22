import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import gameContext, { IGameContextProps } from './gameContext';

/**
 * Custom render function that wraps components with gameContext provider
 * Allows overriding default context values for testing
 */

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  contextValue?: Partial<IGameContextProps>;
}

const defaultContextValue: Partial<IGameContextProps> = {
  gameStarted: false,
  isPlayer: 0,
  _applyBufferedMoves: () => {},
  _applyMoves: async () => {},
  _changeStep: () => {},
  _changePosition: () => {},
  _circlePlayer: () => {},
  _circleUnit: () => {},
  _placeUnit: () => {},
  _setBoardSize: () => {},
  _setGameStarted: () => {},
  _setInRoom: () => {},
  _setIsAdmin: () => {},
  _setIsPlayer: () => {},
  _setPlacementZone: () => {},
  _setSelectedUnit: () => {},
  _setUnitCount: () => {},
  _setWaitingForMoves: () => {},
  _undoMove: () => {},
  _updateBufferOpponentUnits: () => {},
  _updateMovesListener: () => {},
  _updateOpponentUnits: () => {},
  _waitingForMoves: () => {},
};

export function renderWithContext(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { contextValue, ...renderOptions } = options || {};

  const mergedContextValue = {
    ...defaultContextValue,
    ...contextValue,
  } as IGameContextProps;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <gameContext.Provider value={mergedContextValue}>
        {children}
      </gameContext.Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Mock socket factory for testing
 */
export function createMockSocket() {
  const listeners: { [key: string]: Function[] } = {};

  return {
    emit: jest.fn(),
    on: jest.fn((event: string, callback: Function) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
    }),
    off: jest.fn((event: string, callback: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
      }
    }),
    // Helper to trigger events in tests
    triggerEvent: (event: string, ...args: any[]) => {
      if (listeners[event]) {
        listeners[event].forEach(callback => callback(...args));
      }
    },
    listeners,
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
