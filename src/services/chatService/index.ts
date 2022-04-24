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

  public async onMessageReceived(
    socket: Socket,
    listener: (message: { who: string; content: string }) => void
  ) {
    socket.on("message_received", (message: { who: string; content: string }) =>
      listener(message)
    );
  }
}

export default new ChatService();
