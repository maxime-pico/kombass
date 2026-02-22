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

@SocketController()
export class GameController {
  private getSocketGameRoom(socket: Socket): string {
    const socketRooms = Array.from(socket.rooms.values()).filter(
      (r) => r !== socket.id
    );
    //add making sure we're actually connected to a socket
    const gameRoom = socketRooms && socketRooms[0];

    return gameRoom;
  }

  private async getGameIdFromRoom(roomId: string): Promise<string | null> {
    try {
      const game = await gameService.getGame(roomId);
      return game?.id || null;
    } catch (error) {
      console.error("Error getting game from room:", error);
      return null;
    }
  }

  private async getPlayerFromSocket(
    socket: Socket,
    playerNumber: number,
    gameId: string
  ): Promise<{ id: string; playerNumber: number } | null> {
    try {
      const game = await gameService.getGameById(gameId);
      const player = game?.players.find((p) => p.playerNumber === playerNumber);
      return player ? { id: player.id, playerNumber: player.playerNumber } : null;
    } catch (error) {
      console.error("Error getting player from socket:", error);
      return null;
    }
  }

  @OnMessage("update_settings")
  public async updateSettings(
    @SocketIO() io: Server,
    @ConnectedSocket() socket: Socket,
    @MessageBody() settings: any
  ) {
    console.log("Settings updated: ", settings);
    const gameRoom = this.getSocketGameRoom(socket);

    try {
      // Persist settings to database
      const gameId = await this.getGameIdFromRoom(gameRoom);
      if (gameId) {
        await gameService.updateGameConfig(gameId, settings);
        await gameService.updateGameState(gameId, { status: "PLACEMENT" });
      }
    } catch (error) {
      console.error("Error persisting settings:", error);
      // Continue with relay even if persistence fails
    }

    socket.to(gameRoom).emit("settings_updated", settings);
  }

  @OnMessage("player_ready")
  public async playerReady(
    @SocketIO() io: Server,
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: any
  ) {
    console.log(`Player ${message.player} is ready`);
    console.log("Message structure:", {
      player: message.player,
      hasUnits: !!message.units,
      unitsType: Array.isArray(message.units) ? "array" : typeof message.units,
      unitsLength: Array.isArray(message.units) ? message.units.length : "N/A",
      hasFlag: !!message.flag,
    });
    const gameRoom = this.getSocketGameRoom(socket);

    try {
      // Persist player units and flag to database
      const gameId = await this.getGameIdFromRoom(gameRoom);
      if (gameId && message.player !== undefined) {
        const player = await this.getPlayerFromSocket(socket, message.player, gameId);
        if (player) {
          // Extract units for this player from the 2D array
          const playerUnits = message.units[message.player];
          console.log("Extracted playerUnits:", {
            playerNumber: message.player,
            unitsType: Array.isArray(playerUnits) ? "array" : typeof playerUnits,
            unitsLength: Array.isArray(playerUnits) ? playerUnits.length : "N/A",
            sample: Array.isArray(playerUnits) ? playerUnits.slice(0, 1) : playerUnits,
          });
          await gameService.savePlayerUnits(player.id, playerUnits);

          // Save flag if provided
          if (message.flag) {
            await gameService.saveFlag(player.id, message.flag);
          }

          // Mark player as ready
          await gameService.updatePlayerReady(player.id, true);

          // Check if both players are ready, then update status to ACTIVE and start movement phase
          const game = await gameService.getGameById(gameId);
          if (game && game.players.length === 2) {
            const bothReady = game.players.every((p) => p.isReady);
            if (bothReady) {
              await gameService.updateGameState(gameId, {
                status: "ACTIVE",
                round: 0,
                step: 0
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error persisting player ready state:", error);
      // Continue with relay even if persistence fails
    }

    socket.to(gameRoom).emit("player_ready", message);
  }

  @OnMessage("moves_sent")
  public async updateGame(
    @SocketIO() io: Server,
    @ConnectedSocket() socket: Socket,
    @MessageBody() update: any
  ) {
    console.log("moves_sent", update);
    const gameRoom = this.getSocketGameRoom(socket);

    try {
      // Persist pending moves to database
      const gameId = await this.getGameIdFromRoom(gameRoom);
      if (gameId) {
        // Find the player by socketId
        const game = await gameService.getGameById(gameId);
        const player = game?.players.find((p) => p.socketId === socket.id);

        if (player) {
          // Save futureUnits (pending moves)
          await gameService.savePlayerUnits(player.id, undefined, update.units);

          // Update game round if provided
          if (update.round !== undefined) {
            await gameService.updateGameState(gameId, { round: update.round });
          }
        }
      }
    } catch (error) {
      console.error("Error persisting moves:", error);
      // Continue with relay even if persistence fails
    }

    socket.to(gameRoom).emit("moves_received", update);
  }

  @OnMessage("next_round")
  public async nextRound(
    @SocketIO() io: Server,
    @ConnectedSocket() socket: Socket,
    @MessageBody() round: any
  ) {
    console.log("next_round");
    console.log(round);
    const gameRoom = this.getSocketGameRoom(socket);

    try {
      // Update game state for next round
      const gameId = await this.getGameIdFromRoom(gameRoom);
      if (gameId) {
        // Clear pending moves for all players (futureUnits)
        await gameService.clearPendingMoves(gameId);

        // Update game step and round if provided
        const updateData: any = {};
        if (round.step !== undefined) {
          updateData.step = round.step;
        }
        if (round.round !== undefined) {
          updateData.round = round.round;
        }
        if (Object.keys(updateData).length > 0) {
          await gameService.updateGameState(gameId, updateData);
        }
      }
    } catch (error) {
      console.error("Error persisting next round:", error);
      // Continue with relay even if persistence fails
    }

    socket.to(gameRoom).emit("opponent_ready", round);
  }

  @OnMessage("game_win")
  public async gameWin(
    @SocketIO() io: Server,
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: any
  ) {
    console.log("game win");
    const gameRoom = this.getSocketGameRoom(socket);

    try {
      // Mark game as completed in database
      const gameId = await this.getGameIdFromRoom(gameRoom);
      if (gameId) {
        await gameService.updateGameState(gameId, { status: "COMPLETED" });
      }
    } catch (error) {
      console.error("Error persisting game win:", error);
      // Continue with relay even if persistence fails
    }

    socket.to(gameRoom).emit("on_game_win", message);
  }

  @OnMessage("abandon_game")
  public async abandonGame(
    @SocketIO() io: Server,
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: any
  ) {
    console.log(`Player ${message.playerNumber} abandoned`);
    const gameRoom = this.getSocketGameRoom(socket);

    try {
      const gameId = await this.getGameIdFromRoom(gameRoom);
      if (gameId) {
        await gameService.updateGameState(gameId, { status: "ABANDONED" });
      }
    } catch (error) {
      console.error("Error persisting abandon:", error);
    }

    socket.to(gameRoom).emit("on_opponent_abandoned", { playerNumber: message.playerNumber });
  }

  @OnMessage("combat_finalized")
  public async combatFinalized(
    @SocketIO() io: Server,
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: any
  ) {
    console.log(`Combat finalized: Player ${message.playerNumber}, Round ${message.round}`);
    const gameRoom = this.getSocketGameRoom(socket);

    // Validate new-format fields
    if (!Array.isArray(message.allUnits) || !Array.isArray(message.allFlags)) {
      console.error(
        `combat_finalized: missing allUnits/allFlags — received keys: ${Object.keys(message).join(', ')}. ` +
        'Server may be running stale compiled code. Restart the server.'
      );
      // Still relay to opponent even if persistence fails
      socket.to(gameRoom).emit("opponent_combat_finalized", {
        playerNumber: message.playerNumber,
        round: message.round,
        step: message.step,
      });
      return;
    }

    try {
      const gameId = await this.getGameIdFromRoom(gameRoom);
      if (gameId) {
        const game = await gameService.getGameById(gameId);

        if (game && game.players && game.players.length === 2) {
          // Update BOTH players with the post-combat state
          // Both players calculate identical combat results, so we can use their data
          for (const player of game.players) {
            await gameService.updatePlayerAfterCombat(
              player.id,
              message.allUnits[player.playerNumber],
              message.allFlags[player.playerNumber]
            );
          }

          // Update game state (round and step)
          await gameService.updateGameState(gameId, {
            round: message.round,
            step: message.step,
          });
        } else {
          console.error(`Game or players not found for game ${gameId}`);
        }
      } else {
        console.error(`Game ID not found for room ${gameRoom}`);
      }
    } catch (error) {
      console.error("Error persisting combat finalized:", error);
      // Continue even if persistence fails
    }

    // Relay to opponent for synchronization
    socket.to(gameRoom).emit("opponent_combat_finalized", {
      playerNumber: message.playerNumber,
      round: message.round,
      step: message.step,
    });
  }
}
