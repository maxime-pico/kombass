import {
  ConnectedSocket,
  OnConnect,
  OnDisconnect,
  OnMessage,
  MessageBody,
  SocketController,
  SocketIO,
} from "socket-controllers";
import { Socket, Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import * as sessionService from "../../services/sessionService";
import * as gameService from "../../services/gameService";

const prisma = new PrismaClient();

@SocketController()
export class MainController {
  @OnConnect()
  public onConnection(
    @ConnectedSocket() socket: Socket,
    @SocketIO() io: Server
  ) {
    console.log("New Socket connected: ", socket.id, socket.data);
  }
  @OnDisconnect()
  public async onDisconnection(
    @ConnectedSocket() socket: Socket,
    @SocketIO() io: Server
  ) {
    console.log("Socket disconnected: ", socket.id, socket.rooms);

    try {
      // Find and clear socketId for disconnected player (enables reconnection)
      const player = await prisma.player.findFirst({
        where: { socketId: socket.id },
      });

      if (player) {
        await prisma.player.update({
          where: { id: player.id },
          data: { socketId: null },
        });
        console.log("Cleared socketId for player:", player.id);
      }
    } catch (error) {
      console.error("Error clearing socketId on disconnect:", error);
    }
  }

  @OnMessage("reconnect_game")
  public async reconnectGame(
    @SocketIO() io: Server,
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: { sessionToken: string }
  ) {
    console.log("Reconnection attempt with token:", message.sessionToken);

    try {
      // 1. Validate session token
      const session = await sessionService.validateSession(message.sessionToken);

      if (!session) {
        socket.emit("reconnect_error", { error: "Invalid or expired session" });
        return;
      }

      // 2. Update socket ID
      await sessionService.updateSocketId(message.sessionToken, socket.id);

      // 3. Get full game state from database
      const gameState = await gameService.getGameState(session.gameId);

      if (!gameState) {
        socket.emit("reconnect_error", { error: "Game not found" });
        return;
      }

      // 4. Check if game is still active
      if (gameState.game.status === "COMPLETED" || gameState.game.status === "ABANDONED") {
        socket.emit("reconnect_error", { error: "Game has ended" });
        return;
      }

      // 5. Re-join socket.io room
      await socket.join(gameState.game.roomId);

      // 6. Send full game state to reconnecting client
      socket.emit("game_state_restored", {
        gameState,
        playerNumber: session.playerNumber,
        isAdmin: gameState.players[session.playerNumber].isAdmin,
      });

      // 7. Notify opponent
      socket.to(gameState.game.roomId).emit("opponent_reconnected", {
        playerNumber: session.playerNumber,
      });

      console.log(`Player ${session.playerNumber} reconnected to game ${session.gameId}`);

    } catch (error) {
      console.error("Error during reconnection:", error);
      socket.emit("reconnect_error", { error: "Reconnection failed" });
    }
  }
}
