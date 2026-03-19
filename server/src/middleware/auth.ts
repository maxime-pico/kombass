import { Request, Response, NextFunction } from "express";
import * as sessionService from "../services/sessionService";

export interface AuthenticatedRequest extends Request {
  player?: {
    gameId: string;
    playerId: string;
    playerNumber: number;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const session = await sessionService.validateSession(token);
  if (!session) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  req.player = session;
  next();
}

export async function gameAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await authMiddleware(req, res, () => {
    if (!req.player) return; // already sent 401

    // Verify player belongs to this game by checking roomId
    const roomId = req.params.roomId;
    // We need to verify the game — delegate to the endpoint handler
    // since we need a DB lookup. Just attach the player info here.
    next();
  });
}
