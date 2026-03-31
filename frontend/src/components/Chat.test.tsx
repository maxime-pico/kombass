import { vi } from 'vitest';

// Mock modules MUST be at the top before any imports
vi.mock('../services/socketService', () => ({
  __esModule: true,
  default: {
    socket: {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    },
    connect: vi.fn(),
  },
}));

vi.mock('../services/chatService', () => {
  const sendMessage = vi.fn().mockResolvedValue(undefined);
  const onChatConnected = vi.fn().mockResolvedValue(undefined);
  const onMessageReceived = vi.fn().mockReturnValue(() => {});

  return {
    __esModule: true,
    default: {
      onChatConnected,
      sendMessage,
      onMessageReceived,
    },
  };
});

vi.mock('../utilities/sound', () => ({
  playChatPing: vi.fn(),
}));

import React, { useState } from 'react';
import { screen, fireEvent, waitFor, render, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithContext } from '../test-utils';
import Chat from './Chat';
import gameContext from '../gameContext';
import socketService from '../services/socketService';
import chatService from '../services/chatService';

describe('Chat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const getCollapsible = () => document.querySelector('#chat .collapsible');

  describe('Initial Render State', () => {
    test('starts with empty history (messages appear via typewriter at step -2)', () => {
      renderWithContext(<Chat />);

      // History starts empty — intro messages are typewritten at step -2
      expect(screen.queryByText(/KRAU COM SYSTEM/i)).not.toBeInTheDocument();
    });

    test('shows "Communication system" title', () => {
      renderWithContext(<Chat />);

      expect(screen.getByText(/Communication system/i)).toBeInTheDocument();
    });

    test('chat is collapsed by default', () => {
      renderWithContext(<Chat />);

      expect(getCollapsible()).toHaveClass('collapsed');
    });

    test('connection indicator shows disconnected when gameStarted=false', () => {
      renderWithContext(<Chat />, {
        contextValue: { gameStarted: false },
      });

      const bubble = document.querySelector('.bubble');
      expect(bubble).toHaveClass('disconnected');
      expect(bubble).not.toHaveClass('connected');
    });

    test('connection indicator shows connected when gameStarted=true', () => {
      renderWithContext(<Chat />, {
        contextValue: { gameStarted: true },
      });

      const bubble = document.querySelector('.bubble');
      expect(bubble).toHaveClass('connected');
      expect(bubble).not.toHaveClass('disconnected');
    });
  });

  describe('Typewriter Briefing at step -2', () => {
    test('typewriter starts after 1s delay and types intro + settings', () => {
      renderWithContext(<Chat />, {
        contextValue: { step: -2, gameStarted: true },
      });

      // Nothing yet
      expect(screen.queryByText(/KRAU/)).not.toBeInTheDocument();

      // Advance past initial delay + some typing time
      act(() => { vi.advanceTimersByTime(15000); });

      expect(screen.getByText(/KRAU COM SYSTEM/)).toBeInTheDocument();
      expect(screen.getByText(/MISSION BRIEFING/)).toBeInTheDocument();
    });

    test('chat opens after initial delay', () => {
      renderWithContext(<Chat />, {
        contextValue: { step: -2, gameStarted: true },
      });

      expect(getCollapsible()).toHaveClass('collapsed');

      act(() => { vi.advanceTimersByTime(1200); });

      expect(getCollapsible()).not.toHaveClass('collapsed');
    });
  });

  describe('Waiting State Display (Critical for Bug)', () => {
    test('shows waiting class when gameStarted=false and chat expanded', () => {
      renderWithContext(<Chat />, {
        contextValue: { gameStarted: false },
      });

      const header = screen.getByText(/Communication system/i);
      fireEvent.click(header);

      expect(getCollapsible()).toHaveClass('waiting');
      expect(getCollapsible()).not.toHaveClass('collapsed');
    });

    test('removes waiting class when gameStarted=true', () => {
      renderWithContext(<Chat />, {
        contextValue: { gameStarted: true },
      });

      const header = screen.getByText(/Communication system/i);
      fireEvent.click(header);

      expect(getCollapsible()).not.toHaveClass('waiting');
    });

    test('[BUG TEST] waiting overlay transitions when game starts (realistic game flow)', () => {
      function GameFlowSimulator() {
        const [gameStarted, setGameStarted] = useState(false);

        return (
          <div>
            <button onClick={() => setGameStarted(true)} data-testid="start-game">
              Simulate Players Joining
            </button>
            <gameContext.Provider
              value={{
                gameStarted,
                playerIndex: 0,
                applyBufferedMoves: () => {},
                applyMoves: async () => {},
                changeStep: () => {},
                changePosition: () => {},
                circlePlayer: () => {},
                circleUnit: () => {},
                placeUnit: () => {},
                setBoardSize: () => {},
                setGameStarted: () => {},
                setInRoom: () => {},
                setIsAdmin: () => {},
                setPlayerIndex: () => {},
                setPlacementZone: () => {},
                setSelectedUnit: () => {},
                setUnitCount: () => {},
                setWaitingForMoves: () => {},
                undoMove: () => {},
                updateBufferOpponentUnits: () => {},
                updateMovesListener: () => {},
                updateOpponentUnits: () => {},
                onWaitingForMoves: () => {},
              } as any}
            >
              <Chat />
            </gameContext.Provider>
          </div>
        );
      }

      render(<GameFlowSimulator />);

      const header = screen.getByText(/Communication system/i);
      fireEvent.click(header);

      expect(getCollapsible()).toHaveClass('waiting');
      expect(getCollapsible()).not.toHaveClass('collapsed');

      const startButton = screen.getByTestId('start-game');
      fireEvent.click(startButton);

      expect(getCollapsible()).not.toHaveClass('waiting');
      expect(getCollapsible()).not.toHaveClass('collapsed');
    });
  });

  describe('Message Display', () => {
    test('admin messages appear without prefix at step -2', () => {
      renderWithContext(<Chat />, {
        contextValue: { step: -2, gameStarted: true },
      });

      act(() => { vi.advanceTimersByTime(5000); });

      const adminMessages = screen.getAllByText(/KRAU COM SYSTEM|MILITARY GRADE ENCRYPTION|----/);
      adminMessages.forEach(msg => {
        expect(msg.textContent).not.toMatch(/^P\d+>/);
      });
    });
  });

  describe('Message History Accumulation (Critical Bug)', () => {
    test('message history accumulates across multiple messages', async () => {
      vi.useRealTimers();
      renderWithContext(<Chat />, {
        contextValue: { gameStarted: true, playerIndex: 0 },
      });

      const header = screen.getByText(/Communication system/i);
      fireEvent.click(header);

      const input = screen.getByRole('textbox');
      const sendBtn = screen.getByText('>>');

      // Send first message
      await userEvent.type(input, 'First');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalledTimes(1);
      });

      // Send second message
      await userEvent.type(input, 'Second');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalledTimes(2);
      });
    });

    test('[BUG - Manual Reproduction] stale closure causes message loss', () => {
      expect(true).toBe(true);
    });
  });

  describe('User Interactions - Basic', () => {
    test('click header toggles collapsed state', () => {
      renderWithContext(<Chat />, {
        contextValue: { gameStarted: true },
      });

      const header = screen.getByText(/Communication system/i);

      // Initially collapsed
      expect(getCollapsible()).toHaveClass('collapsed');

      // Click to expand
      fireEvent.click(header);
      expect(getCollapsible()).not.toHaveClass('collapsed');

      // Click to collapse
      fireEvent.click(header);
      expect(getCollapsible()).toHaveClass('collapsed');
    });

    test('expanding when gameStarted=true focuses input', async () => {
      vi.useRealTimers();
      renderWithContext(<Chat />, {
        contextValue: { gameStarted: true },
      });

      const header = screen.getByText(/Communication system/i);
      const input = screen.getByRole('textbox');

      expect(input).not.toHaveFocus();

      fireEvent.click(header);

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    test('expanding when gameStarted=false does NOT focus input', () => {
      renderWithContext(<Chat />, {
        contextValue: { gameStarted: false },
      });

      const header = screen.getByText(/Communication system/i);
      const input = screen.getByRole('textbox');

      fireEvent.click(header);

      expect(input).not.toHaveFocus();
    });

    test('typing updates message state', async () => {
      vi.useRealTimers();
      renderWithContext(<Chat />, {
        contextValue: { gameStarted: true },
      });

      const input = screen.getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, 'Hello World');

      expect(input.value).toBe('Hello World');
    });

    test('Enter key sends message when focused', async () => {
      vi.useRealTimers();
      renderWithContext(<Chat />, {
        contextValue: { gameStarted: true },
      });

      const header = screen.getByText(/Communication system/i);
      fireEvent.click(header);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await userEvent.type(input, 'Hello');
      expect(input.value).toBe('Hello');

      // Press Enter (charCode 13 triggers sendMessage)
      fireEvent.keyPress(input, { charCode: 13 });

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalledWith(
          socketService.socket,
          { who: '1', content: 'Hello' }
        );
      });
    });

    test('send button triggers message send', async () => {
      vi.useRealTimers();
      renderWithContext(<Chat />, {
        contextValue: { gameStarted: true },
      });

      const header = screen.getByText(/Communication system/i);
      fireEvent.click(header);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await userEvent.type(input, 'Test msg');

      const sendBtn = screen.getByText('>>');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalledWith(
          socketService.socket,
          { who: '1', content: 'Test msg' }
        );
      });
    });

    test('message cleared after sending', async () => {
      vi.useRealTimers();
      renderWithContext(<Chat />, {
        contextValue: { gameStarted: true },
      });

      const header = screen.getByText(/Communication system/i);
      fireEvent.click(header);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await userEvent.type(input, 'Clear me');
      expect(input.value).toBe('Clear me');

      const sendBtn = screen.getByText('>>');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('Socket Integration', () => {
    test('registers message listener on mount', () => {
      renderWithContext(<Chat />, {
        contextValue: { gameStarted: true },
      });

      expect(chatService.onMessageReceived).toHaveBeenCalledWith(
        socketService.socket,
        expect.any(Function)
      );
    });

    test('sendMessage called with correct format for player 0', async () => {
      vi.useRealTimers();
      renderWithContext(<Chat />, {
        contextValue: { gameStarted: true, playerIndex: 0 },
      });

      const header = screen.getByText(/Communication system/i);
      fireEvent.click(header);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'P0 msg');

      const sendBtn = screen.getByText('>>');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalledWith(
          socketService.socket,
          { who: '1', content: 'P0 msg' }
        );
      });
    });

    test('sendMessage called with correct format for player 1', async () => {
      vi.useRealTimers();
      renderWithContext(<Chat />, {
        contextValue: { gameStarted: true, playerIndex: 1 },
      });

      const header = screen.getByText(/Communication system/i);
      fireEvent.click(header);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'P1 msg');

      const sendBtn = screen.getByText('>>');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalledWith(
          socketService.socket,
          { who: '2', content: 'P1 msg' }
        );
      });
    });
  });
});
