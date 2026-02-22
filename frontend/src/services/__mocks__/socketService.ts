import { Socket } from "socket.io-client";

/**
 * Mock SocketService for testing
 * Provides a controllable socket instance for test scenarios
 */

const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
} as unknown as Socket;

class MockSocketService {
  public socket: Socket | null = mockSocket;

  public connect(url: string, ns: string): Promise<Socket> {
    return Promise.resolve(mockSocket);
  }

  // Test helper: reset mock state between tests
  public resetMock() {
    (mockSocket.emit as jest.Mock).mockClear();
    (mockSocket.on as jest.Mock).mockClear();
    (mockSocket.off as jest.Mock).mockClear();
  }
}

const mockSocketService = new MockSocketService();

export default mockSocketService;
export { mockSocket };
