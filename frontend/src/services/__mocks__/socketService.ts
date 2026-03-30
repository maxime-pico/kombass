import { vi } from "vitest";
import { Socket } from "socket.io-client";

/**
 * Mock SocketService for testing
 * Provides a controllable socket instance for test scenarios
 */

const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
} as unknown as Socket;

class MockSocketService {
  public socket: Socket | null = mockSocket;

  public connect(url: string, ns: string): Promise<Socket> {
    return Promise.resolve(mockSocket);
  }

  // Test helper: reset mock state between tests
  public resetMock() {
    (mockSocket.emit as ReturnType<typeof vi.fn>).mockClear();
    (mockSocket.on as ReturnType<typeof vi.fn>).mockClear();
    (mockSocket.off as ReturnType<typeof vi.fn>).mockClear();
  }
}

const mockSocketService = new MockSocketService();

export default mockSocketService;
export { mockSocket };
