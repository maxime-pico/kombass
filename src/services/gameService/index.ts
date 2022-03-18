import { Socket } from "socket.io-client";
// import { IPlayerMatrix } from "../../components/game";
// import { IStartGame } from "../../components/game/index";

class GameService {
  public async joinGameRoom(socket: Socket, roomId: string): Promise<boolean> {
    return new Promise((rs, rj) => {
      socket.emit("join_game", { roomId });
      socket.on("room_joined", () => rs(true));
      socket.on("room_joined_error", ({ error }) => rj(error));
    });
  }

  public async updateGame(socket: Socket, gameMatrix: any) {
    // public async updateGame(socket: Socket, gameMatrix: IPlayerMatrix) {
    socket.emit("update_game", { matrix: gameMatrix });
  }

  public async onGameUpdate(
    socket: Socket,
    // listener: (matrix: IPlayerMatrix) => void
    listener: (matrix: any) => void
  ) {
    socket.on("on_game_update", ({ matrix }) => listener(matrix));
  }

  public async onStartGame(
    socket: Socket,
    // listener: (options: IStartGame) => void
    listener: (options: any) => void
  ) {
    socket.on("start_game", listener);
  }

  public async gameWin(socket: Socket, message: string) {
    socket.emit("game_win", { message });
  }

  public async onGameWin(socket: Socket, listener: (message: string) => void) {
    socket.on("on_game_win", ({ message }) => listener(message));
  }
}

export default new GameService();
