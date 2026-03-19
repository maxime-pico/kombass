import { io, Socket } from "socket.io-client";

class SocketService {
  public socket: Socket | null = null;
  private _connectingPromise: Promise<Socket> | null = null;

  public connect(url: string, ns: string): Promise<Socket> {
    // If socket is already connected, return it immediately
    if (this.socket?.connected) {
      return Promise.resolve(this.socket);
    }

    // If we're already in the process of connecting, return the existing promise
    if (this._connectingPromise) {
      return this._connectingPromise;
    }

    this._connectingPromise = new Promise((rs, rj) => {
      this.socket = io(url);

      if (!this.socket) {
        this._connectingPromise = null;
        return rj();
      }

      this.socket.on("connect", () => {
        // On reconnect (not first connect), re-authenticate to rejoin server-side room
        if (!this._connectingPromise) {
          const roomId = window.location.pathname.split("/game/")[1];
          const token = roomId
            ? localStorage.getItem(`kombass_session_token_${roomId}`)
            : null;
          if (token && this.socket) {
            this.socket.emit("authenticate", { sessionToken: token });
          }
          return;
        }
        this._connectingPromise = null;
        rs(this.socket as Socket);
      });

      this.socket.on("connect_error", (err) => {
        this._connectingPromise = null;
        console.log("connection error: ", err);
        return rj(err);
      });
    });

    return this._connectingPromise;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const socketService = new SocketService();
export default socketService;
