import { Socket } from "socket.io-client";

/**
 * Mock ChatService for testing
 * Allows testing chat functionality without real socket connections
 */

class MockChatService {
  public onChatConnected = jest.fn(
    async (socket: Socket, listener: (options: any) => void) => {
      // Store listener for test control
      return Promise.resolve();
    }
  );

  public sendMessage = jest.fn(
    async (
      socket: Socket,
      message: {
        who: string;
        content: string;
      }
    ) => {
      // Immediately resolve so the .then() callback runs
      return Promise.resolve();
    }
  );

  public onMessageReceived = jest.fn(
    async (
      socket: Socket,
      listener: (message: { who: string; content: string }) => void
    ) => {
      // Store listener for test control
      return Promise.resolve();
    }
  );

  // Test helper: reset mock state between tests
  public resetMock() {
    this.onChatConnected.mockClear();
    this.sendMessage.mockClear();
    this.onMessageReceived.mockClear();
  }
}

const mockChatService = new MockChatService();

export default mockChatService;
