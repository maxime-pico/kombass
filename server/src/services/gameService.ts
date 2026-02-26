import { PrismaClient, GameStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Game service for managing game state and persistence
 */

export interface BoardConfig {
  boardWidth?: number;
  boardLength?: number;
  placementZone?: number;
  unitsCount?: number;
  terrainPercentage?: number;
  unitConfig?: any;
  terrain?: Array<{ x: number; y: number }>;
}

export interface GameStateUpdate {
  round?: number;
  step?: number;
  status?: GameStatus;
}

/**
 * Create a new game
 * @param roomId - The room ID
 * @param config - Board configuration
 * @returns The created game
 */
export async function createGame(roomId: string, config: BoardConfig = {}) {
  return await prisma.game.create({
    data: {
      roomId,
      boardWidth: config.boardWidth || 22,
      boardLength: config.boardLength || 21,
      placementZone: config.placementZone || 5,
      unitsCount: config.unitsCount || 5,
      currentRound: 0,
      currentStep: -5,
      status: 'LOBBY' as GameStatus,
    },
  });
}

/**
 * Get a game by room ID (with all players)
 * @param roomId - The room ID
 * @returns The game with all players, or null if not found
 */
export async function getGame(roomId: string) {
  return await prisma.game.findUnique({
    where: { roomId },
    include: { players: true },
  });
}

/**
 * Get a game by ID (with all players)
 * @param gameId - The game ID
 * @returns The game with all players, or null if not found
 */
export async function getGameById(gameId: string) {
  return await prisma.game.findUnique({
    where: { id: gameId },
    include: { players: true },
  });
}

/**
 * Update game state (round, step, status)
 * @param gameId - The game ID
 * @param update - State updates
 */
export async function updateGameState(gameId: string, update: GameStateUpdate): Promise<void> {
  await prisma.game.update({
    where: { id: gameId },
    data: {
      ...(update.round !== undefined && { currentRound: update.round }),
      ...(update.step !== undefined && { currentStep: update.step }),
      ...(update.status !== undefined && { status: update.status }),
      lastActivity: new Date(),
    },
  });
}

/**
 * Update game configuration
 * @param gameId - The game ID
 * @param config - Configuration to update
 */
export async function updateGameConfig(gameId: string, config: BoardConfig): Promise<void> {
  await prisma.game.update({
    where: { id: gameId },
    data: {
      ...(config.boardWidth !== undefined && { boardWidth: config.boardWidth }),
      ...(config.boardLength !== undefined && { boardLength: config.boardLength }),
      ...(config.placementZone !== undefined && { placementZone: config.placementZone }),
      ...(config.unitsCount !== undefined && { unitsCount: config.unitsCount }),
      ...(config.terrainPercentage !== undefined && { terrainPercentage: config.terrainPercentage }),
      ...(config.unitConfig !== undefined && { unitConfig: config.unitConfig }),
      lastActivity: new Date(),
    },
  });
}

/**
 * Stamp the app version on the game record
 * @param gameId - The game ID
 * @param appVersion - Version string from package.json
 */
export async function updateGameAppVersion(gameId: string, appVersion: string): Promise<void> {
  await prisma.game.update({
    where: { id: gameId },
    data: { appVersion },
  });
}

/**
 * Submit a player's fun rating (1–10) for the game
 * @param playerId - The player ID
 * @param rating - Integer 1–10
 */
export async function submitPlayerRating(playerId: string, rating: number): Promise<void> {
  await prisma.player.update({
    where: { id: playerId },
    data: { rating },
  });
}

/**
 * Save player units (either current units or future/pending units)
 * @param playerId - The player ID
 * @param units - Current unit positions (optional, pass null to skip)
 * @param futureUnits - Pending unit moves (optional)
 */
export async function savePlayerUnits(
  playerId: string,
  units?: any,
  futureUnits?: any
): Promise<void> {
  const updateData: any = {};

  if (units !== undefined && units !== null) {
    updateData.units = units; // Prisma handles JSON serialization
  }

  if (futureUnits !== undefined) {
    // Use null check, not || because empty arrays are falsy
    updateData.futureUnits = futureUnits === null ? Prisma.DbNull : futureUnits;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.player.update({
      where: { id: playerId },
      data: updateData,
    });
  }
}

/**
 * Save player flag position
 * @param playerId - The player ID
 * @param flag - Flag position { x, y, inZone }
 */
export async function saveFlag(playerId: string, flag: any): Promise<void> {
  await prisma.player.update({
    where: { id: playerId },
    data: {
      flag, // Prisma handles JSON serialization
    },
  });
}

/**
 * Update player ready status
 * @param playerId - The player ID
 * @param isReady - Ready status
 */
export async function updatePlayerReady(playerId: string, isReady: boolean): Promise<void> {
  await prisma.player.update({
    where: { id: playerId },
    data: { isReady },
  });
}

/**
 * Clear pending moves for all players in a game
 * @param gameId - The game ID
 */
export async function clearPendingMoves(gameId: string): Promise<void> {
  await prisma.player.updateMany({
    where: { gameId },
    data: { futureUnits: Prisma.DbNull },
  });
}

/**
 * Get full game state for restoration after reconnect
 * @param gameId - The game ID
 * @returns Full game state with both players
 */
export async function getGameState(gameId: string) {
  const game = await getGameById(gameId);
  if (!game) return null;

  return {
    game: {
      id: game.id,
      roomId: game.roomId,
      boardWidth: game.boardWidth,
      boardLength: game.boardLength,
      placementZone: game.placementZone,
      unitsCount: game.unitsCount,
      round: game.currentRound,
      step: game.currentStep,
      status: game.status,
    },
    players: game.players.map((p) => ({
      id: p.id,
      playerNumber: p.playerNumber,
      isAdmin: p.isAdmin,
      isReady: p.isReady,
      units: p.units,
      futureUnits: p.futureUnits,
      flag: p.flag,
    })),
  };
}

/**
 * Update player state after combat (units, flag, and clear pending moves)
 * @param playerId - The player ID
 * @param units - The updated units array (post-combat)
 * @param flag - The updated flag state
 */
export async function updatePlayerAfterCombat(playerId: string, units: any, flag: any): Promise<void> {
  if (!Array.isArray(units) || !flag) {
    throw new Error(`updatePlayerAfterCombat called with invalid data for player ${playerId}: units=${JSON.stringify(units)}, flag=${JSON.stringify(flag)}`);
  }
  await prisma.player.update({
    where: { id: playerId },
    data: {
      units,
      flag,
      futureUnits: Prisma.DbNull,
      isReady: false, // Ready for next round
    },
  });
}
