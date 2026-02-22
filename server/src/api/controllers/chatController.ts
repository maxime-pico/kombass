import {
  SocketController,
  OnMessage,
  SocketIO,
  ConnectedSocket,
  MessageBody,
} from "socket-controllers";
import { Server, Socket } from "socket.io";

@SocketController()
export class ChatController {
  private getSocketGameRoom(socket: Socket): string {
    const socketRooms = Array.from(socket.rooms.values()).filter(
      (r) => r !== socket.id
    );
    //add making sure we're actually connected to a socket
    const gameRoom = socketRooms && socketRooms[0];

    return gameRoom;
  }

  @OnMessage("message_sent")
  public async updateSettings(
    @SocketIO() io: Server,
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: any
  ) {
    console.log("Message received: ", message);
    const gameRoom = this.getSocketGameRoom(socket);
    socket.to(gameRoom).emit("message_received", message);
  }
}
