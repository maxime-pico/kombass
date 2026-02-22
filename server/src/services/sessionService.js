"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.validateSession = validateSession;
exports.updateSocketId = updateSocketId;
exports.clearSocketId = clearSocketId;
exports.getPlayerBySession = getPlayerBySession;
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma = new client_1.PrismaClient();
/**
 * Create a new session token for a player
 * @param gameId - The game ID
 * @param playerNumber - The player number (0 or 1)
 * @param socketId - The current socket ID
 * @returns The session token
 */
async function createSession(gameId, playerNumber, socketId) {
    const sessionToken = (0, crypto_1.randomUUID)();
    const player = await prisma.player.create({
        data: {
            gameId,
            playerNumber,
            sessionToken,
            socketId,
            isAdmin: playerNumber === 0, // First player is admin
            units: JSON.stringify([]), // Empty array for now
            flag: JSON.stringify({ x: 0, y: 0, inZone: false }),
        },
    });
    return sessionToken;
}
/**
 * Validate a session token and return session info
 * @param sessionToken - The session token to validate
 * @returns Session info if valid, null otherwise
 */
async function validateSession(sessionToken) {
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
async function updateSocketId(sessionToken, newSocketId) {
    await prisma.player.update({
        where: { sessionToken },
        data: { socketId: newSocketId },
    });
}
/**
 * Clear the socket ID for a player (used on disconnect)
 * @param sessionToken - The session token
 */
async function clearSocketId(sessionToken) {
    await prisma.player.update({
        where: { sessionToken },
        data: { socketId: null },
    });
}
/**
 * Get a player by session token
 * @param sessionToken - The session token
 */
async function getPlayerBySession(sessionToken) {
    return await prisma.player.findUnique({
        where: { sessionToken },
        include: { game: true },
    });
}
