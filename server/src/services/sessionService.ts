import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

/**
 * Session service for managing player session tokens and reconnection
 */

export interface Session {
  gameId: string;
  playerId: string;
  playerNumber: number;
}

/**
 * Create a new session token for a player
 * @param gameId - The game ID
 * @param playerNumber - The player number (0 or 1)
 * @param socketId - The current socket ID
 * @returns The session token
 */
export async function createSession(
  gameId: string,
  playerNumber: number,
  socketId: string | null
): Promise<string> {
  const sessionToken = randomUUID();

  const player = await prisma.player.create({
    data: {
      gameId,
      playerNumber,
      sessionToken,
      socketId,
      isAdmin: playerNumber === 0, // First player is admin
      units: [], // Empty array for now - Prisma handles JSON serialization
      flag: { x: 0, y: 0, inZone: false }, // Prisma handles JSON serialization
    },
  });

  return sessionToken;
}

/**
 * Validate a session token and return session info
 * @param sessionToken - The session token to validate
 * @returns Session info if valid, null otherwise
 */
export async function validateSession(sessionToken: string): Promise<Session | null> {
  const player = await prisma.player.findUnique({
    where: { sessionToken },
    include: { game: true },
  });

  if (!player || !player.game) {
    return null;
  }

  return {
    gameId: player.gameId,
    playerId: player.id,
    playerNumber: player.playerNumber,
  };
}

/**
 * Update the socket ID for a player (used during reconnection)
 * @param sessionToken - The session token
 * @param newSocketId - The new socket ID
 */
export async function updateSocketId(sessionToken: string, newSocketId: string): Promise<void> {
  await prisma.player.update({
    where: { sessionToken },
    data: { socketId: newSocketId },
  });
}

/**
 * Clear the socket ID for a player (used on disconnect)
 * @param sessionToken - The session token
 */
export async function clearSocketId(sessionToken: string): Promise<void> {
  await prisma.player.update({
    where: { sessionToken },
    data: { socketId: null },
  });
}

/**
 * Get a player by session token
 * @param sessionToken - The session token
 */
export async function getPlayerBySession(sessionToken: string) {
  return await prisma.player.findUnique({
    where: { sessionToken },
    include: { game: true },
  });
}
