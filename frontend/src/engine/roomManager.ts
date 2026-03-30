import socketService from "../services/socketService";

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL ?? "http://localhost:9000";

export function extractRoomIdFromUrl(): string | null {
  const match = window.location.pathname.match(/^\/game\/([a-z0-9]+)$/i);
  return match ? match[1] : null;
}

export async function connectSocket(): Promise<boolean> {
  const socket = await socketService
    .connect(getBackendUrl(), "test")
    .catch((e: string) => console.log("Error on connect: ", e));
  return !!socket;
}

interface JoinRoomSuccess {
  ok: true;
  sessionToken: string;
}

interface JoinRoomError {
  ok: false;
  message: string;
}

export async function checkAndJoinRoom(roomId: string): Promise<JoinRoomSuccess | JoinRoomError> {
  try {
    const resp = await fetch(`${getBackendUrl()}/api/room/${roomId}/join`, { method: "POST" });
    if (!resp.ok) {
      const data = await resp.json();
      const msg =
        data.reason === "game_over"
          ? "This game has ended."
          : "A game is already in progress in this room and you are not a player.";
      return { ok: false, message: msg };
    }
    const { sessionToken } = await resp.json();
    localStorage.setItem(`kombass_session_token_${roomId}`, sessionToken);
    return { ok: true, sessionToken };
  } catch (_) {
    return { ok: false, message: "Could not connect to room." };
  }
}

interface CreateRoomSuccess {
  ok: true;
  roomId: string;
  sessionToken: string;
}

interface CreateRoomError {
  ok: false;
  message: string;
}

export async function createAndJoinRoom(): Promise<CreateRoomSuccess | CreateRoomError> {
  try {
    const resp = await fetch(`${getBackendUrl()}/api/room`, { method: "POST" });
    if (!resp.ok) {
      return { ok: false, message: "Failed to create room" };
    }
    const { roomId, sessionToken } = await resp.json();
    localStorage.setItem(`kombass_session_token_${roomId}`, sessionToken);
    window.history.pushState({}, "", `/game/${roomId}`);
    return { ok: true, roomId, sessionToken };
  } catch (_) {
    return { ok: false, message: "Could not connect to server" };
  }
}
