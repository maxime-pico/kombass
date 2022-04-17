import { Socket } from "socket.io-client";
import { IUnit } from "../../App";

class GameService {
  public async joinGameRoom(socket: Socket, roomId: string): Promise<boolean> {
    return new Promise((rs, rj) => {
      socket.emit("join_game", { roomId });
      socket.on("room_joined", () => rs(true));
      socket.on("room_joined_error", ({ error }) => rj(error));
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

  public async onSettingsReady(
    socket: Socket,
    settings: {
      boardWidth: number;
      boardLength: number;
      placementZone: number;
      unitsCount: number;
    }
  ) {
    socket.emit("update_settings", settings);
  }

  public async updateSettings(
    socket: Socket,
    listener: (settings: {
      boardWidth: number;
      boardLength: number;
      placementZone: number;
      unitsCount: number;
    }) => void
  ) {
    socket.on(
      "settings_updated",
      (settings: {
        boardWidth: number;
        boardLength: number;
        placementZone: number;
        unitsCount: number;
      }) => listener(settings)
    );
  }

  public async setReady(
    socket: Socket,
    player: 0 | 1,
    units: Array<Array<IUnit>>
  ) {
    socket.emit("player_ready", { player: player, units: units });
  }

  public async onReady(socket: Socket, listener: (message: any) => void) {
    socket.on("player_ready", (message) => listener(message));
  }

  public async sendMoves(socket: Socket, myUnits: Array<IUnit>, round: number) {
    socket.emit("moves_sent", { units: myUnits, round: round });
  }

  public async onUpdateMoves(socket: Socket, listener: (update: any) => void) {
    socket.on("moves_received", (update) => listener(update));
  }

  public async gameWin(socket: Socket, message: string) {
    socket.emit("game_win", { message });
  }

  public async onGameWin(socket: Socket, listener: (message: string) => void) {
    socket.on("on_game_win", ({ message }) => listener(message));
  }
}

export default new GameService();
