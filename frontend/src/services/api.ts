const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:9000";

function getToken(roomId: string): string | null {
  return localStorage.getItem(`kombass_session_token_${roomId}`);
}

export async function gamePost(roomId: string, path: string, body: any): Promise<Response> {
  const token = getToken(roomId);
  return fetch(`${BASE_URL}/api/game/${roomId}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export async function gameGet(roomId: string, path: string): Promise<Response> {
  const token = getToken(roomId);
  return fetch(`${BASE_URL}/api/game/${roomId}/${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
