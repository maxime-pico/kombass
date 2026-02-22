"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGame = createGame;
exports.getGame = getGame;
exports.getGameById = getGameById;
exports.updateGameState = updateGameState;
exports.updateGameConfig = updateGameConfig;
exports.savePlayerUnits = savePlayerUnits;
exports.saveFlag = saveFlag;
exports.updatePlayerReady = updatePlayerReady;
exports.clearPendingMoves = clearPendingMoves;
exports.getGameState = getGameState;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Create a new game
 * @param roomId - The room ID
 * @param config - Board configuration
 * @returns The created game
 */
async function createGame(roomId, config = {}) {
    return await prisma.game.create({
        data: {
            roomId,
            boardWidth: config.boardWidth || 22,
            boardLength: config.boardLength || 21,
            placementZone: config.placementZone || 5,
            unitsCount: config.unitsCount || 5,
            currentRound: 0,
            currentStep: -5,
            status: 'LOBBY',
        },
    });
}
/**
 * Get a game by room ID (with all players)
 * @param roomId - The room ID
 * @returns The game with all players, or null if not found
 */
async function getGame(roomId) {
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
async function getGameById(gameId) {
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
async function updateGameState(gameId, update) {
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
async function updateGameConfig(gameId, config) {
    await prisma.game.update({
        where: { id: gameId },
        data: {
            ...(config.boardWidth !== undefined && { boardWidth: config.boardWidth }),
            ...(config.boardLength !== undefined && { boardLength: config.boardLength }),
            ...(config.placementZone !== undefined && { placementZone: config.placementZone }),
            ...(config.unitsCount !== undefined && { unitsCount: config.unitsCount }),
            lastActivity: new Date(),
        },
    });
}
/**
 * Save player units (either current units or future/pending units)
 * @param playerId - The player ID
 * @param units - Current unit positions (optional, pass null to skip)
 * @param futureUnits - Pending unit moves (optional)
 */
async function savePlayerUnits(playerId, units, futureUnits) {
    const updateData = {};
    if (units !== undefined && units !== null) {
        updateData.units = JSON.stringify(units);
    }
    if (futureUnits !== undefined) {
        updateData.futureUnits = futureUnits ? JSON.stringify(futureUnits) : null;
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
async function saveFlag(playerId, flag) {
    await prisma.player.update({
        where: { id: playerId },
        data: {
            flag: JSON.stringify(flag),
        },
    });
}
/**
 * Update player ready status
 * @param playerId - The player ID
 * @param isReady - Ready status
 */
async function updatePlayerReady(playerId, isReady) {
    await prisma.player.update({
        where: { id: playerId },
        data: { isReady },
    });
}
/**
 * Clear pending moves for all players in a game
 * @param gameId - The game ID
 */
async function clearPendingMoves(gameId) {
    await prisma.player.updateMany({
        where: { gameId },
        data: { futureUnits: null },
    });
}
/**
 * Get full game state for restoration after reconnect
 * @param gameId - The game ID
 * @returns Full game state with both players
 */
async function getGameState(gameId) {
    const game = await getGameById(gameId);
    if (!game)
        return null;
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
