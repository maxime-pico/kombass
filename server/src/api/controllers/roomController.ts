import {
  SocketController,
  OnMessage,
  SocketIO,
  ConnectedSocket,
  MessageBody,
} from "socket-controllers";
import { Server, Socket } from "socket.io";
import * as gameService from "../../services/gameService";
import * as sessionService from "../../services/sessionService";

interface RoomListMessage {
  // Empty for now - list_rooms doesn't use message body
}

interface JoinGameMessage {
  roomId: string;
}

@SocketController()
export class RoomController {
  // Authenticate via session token and join room
  @OnMessage("authenticate")
  public async authenticate(
    @SocketIO() io: Server,
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: { sessionToken: string }
  ) {
    const session = await sessionService.validateSession(message.sessionToken);
    if (!session) {
      socket.emit("auth_error", { error: "invalid session" });
      return;
    }

    const game = await gameService.getGameById(session.gameId);
    if (!game) {
      socket.emit("auth_error", { error: "game not found" });
      return;
    }

    // Update socketId and join room (guard against double-join)
    await sessionService.updateSocketId(message.sessionToken, socket.id);
    if (!socket.rooms.has(game.roomId)) {
      await socket.join(game.roomId);
    }

    // Store player info on socket for later lookup
    socket.data.playerNumber = session.playerNumber;
    socket.data.isAdmin = session.playerNumber === 0;


    // Emit start_game immediately to the authenticating player
    console.log("[authenticate] emitting start_game to socket", socket.id, "player:", socket.data.playerNumber, "admin:", socket.data.isAdmin);
    socket.emit("start_game", {
      player: socket.data.playerNumber,
      admin: socket.data.isAdmin,
    });
  }

  // lists rooms and how full it is, not used at the moment as I do not know
  // how to handle the automatic self room gracefully from the UX POV
  @OnMessage("list_rooms")
  public async listRooms(
    @SocketIO() io: Server,
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: RoomListMessage
  ) {
    const existingRooms = Array.from(io.sockets.adapter.rooms).filter(
      (r) => r[0] !== socket.id //except self
    );
    const responseArray: Array<{ name: string; playersCount: number }> = [];
    existingRooms.map((room) =>
      responseArray.push({ name: room[0], playersCount: room[1].size })
    );
    socket.emit("rooms_list", { rooms: responseArray });
  }

  @OnMessage("join_game")
  public async joinGame(
    @SocketIO() io: Server,
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: JoinGameMessage
  ) {
    console.log("New user joining the room: ", message);

    const connectedSockets = io.sockets.adapter.rooms.get(message.roomId);
    const socketRooms = Array.from(socket.rooms.values()).filter(
      (r) => r !== socket.id
    );

    if (
      socketRooms.length > 0 ||
      (connectedSockets && connectedSockets.size === 2)
    ) {
      socket.emit("join_room_error", {
        error: "room full",
      });
    } else {
      await socket.join(message.roomId);
      socket.emit("room_joined");

      if (io.sockets.adapter.rooms.get(message.roomId)?.size === 2) {
        // Both players have joined - create game and player records
        try {
          // Get or create the game
          let game = await gameService.getGame(message.roomId);

          if (!game) {
            await gameService.createGame(message.roomId);
            // Fetch the game again to include players
            game = await gameService.getGame(message.roomId);
          }

          if (!game) {
            throw new Error("Failed to create or retrieve game");
          }

          // Get all sockets in the room
          const socketsInRoom = Array.from(io.sockets.adapter.rooms.get(message.roomId) || []);

          // The joining socket (current socket) is player 1
          // The other socket in the room is player 0
          const otherSocketId = socketsInRoom.find((sid) => sid !== socket.id);

          if (otherSocketId) {
            // Create Player records for both players
            const sessionToken1 = await sessionService.createSession(
              game.id,
              1,
              socket.id
            );

            const sessionToken0 = await sessionService.createSession(
              game.id,
              0,
              otherSocketId
            );

            // Send start_game messages with session tokens
            // Joining player (player 1) - not admin
            socket.emit("start_game", {
              admin: false,
              player: 1,
              sessionToken: sessionToken1,
            });

            // Other player (player 0) - admin
            socket.to(message.roomId).emit("start_game", {
              admin: true,
              player: 0,
              sessionToken: sessionToken0,
            });
          }
        } catch (error) {
          console.error("Error creating game or session:", error);
          socket.emit("join_room_error", {
            error: "Failed to create game session",
          });
        }
      }
    }
  }
}
