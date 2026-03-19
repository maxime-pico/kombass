import { Socket } from "socket.io-client";
import type { UnitConfig } from "../../utilities/dict";

class GameService {
  public authenticate(socket: Socket, sessionToken: string): void {
    socket.emit("authenticate", { sessionToken });
  }

  public async joinGameRoom(socket: Socket, roomId: string): Promise<boolean> {
    return new Promise((rs, rj) => {
      socket.emit("join_game", { roomId });
      socket.on("room_joined", () => rs(true));
      socket.on("join_room_error", ({ error }) => rj(error));
    });
  }

  // method to request list of active rooms and player count on each
  // unused at the moment as I have no way to handle self-socket room in UX
  public async listRooms(
    socket: Socket,
    listener: (rooms: Array<string>) => void
  ) {
    socket.emit("list_rooms");
    socket.on("rooms_list", (rooms) => listener(rooms));
  }

  public async onJoinedGame(socket: Socket, listener: (options: any) => void) {
    socket.on("start_game", listener);
  }


  public onSettingsConfirmed(
    socket: Socket,
    listener: (settings: { boardWidth: number; boardLength: number; placementZone: number; unitsCount: number; unitConfig?: UnitConfig; flagStayInPlace?: boolean }) => void
  ) {
    socket.on("settings_confirmed", listener);
  }

  public async onReady(socket: Socket, listener: (message: any) => void) {
    socket.on("player_ready", (message) => listener(message));
  }

  public onCombatResults(socket: Socket, listener: (data: any) => void): void {
    socket.on("combat_results", (data) => listener(data));
  }

  public onMovesSubmitted(socket: Socket, listener: (data: any) => void): void {
    socket.on("moves_submitted", (data) => listener(data));
  }

  public async onOpponentReconnected(socket: Socket, listener: () => void) {
    socket.on("opponent_reconnected", listener);
  }

  public abandonGame(socket: Socket, playerNumber: number): void {
    socket.emit("abandon_game", { playerNumber });
  }

  public submitRating(socket: Socket, rating: number, playerNumber: number): void {
    socket.emit("submit_rating", { rating, playerNumber });
  }

  public onOpponentAbandoned(
    socket: Socket,
    listener: (data: { playerNumber: number }) => void
  ): void {
    socket.on("on_opponent_abandoned", listener);
  }
}

const gameService = new GameService();
export default gameService;
