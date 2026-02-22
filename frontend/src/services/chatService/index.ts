import { Socket } from "socket.io-client";

class ChatService {
  public async onChatConnected(
    socket: Socket,
    listener: (options: any) => void
  ) {
    socket.on("room_joined", listener);
  }

  public async sendMessage(
    socket: Socket,
    message: {
      who: string;
      content: string;
    }
  ) {
    socket.emit("message_sent", message);
  }

  public onMessageReceived(
    socket: Socket,
    listener: (message: { who: string; content: string }) => void
  ): () => void {
    const wrappedListener = (message: { who: string; content: string }) =>
      listener(message);

    socket.on("message_received", wrappedListener);

    // Return unsubscribe function for cleanup
    return () => {
      socket.off("message_received", wrappedListener);
    };
  }
}

const chatService = new ChatService();
export default chatService;
