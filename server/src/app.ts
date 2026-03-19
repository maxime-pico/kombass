import createError from "http-errors";
import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import "reflect-metadata";
import * as gameService from "./services/gameService";
import * as sessionService from "./services/sessionService";
import { authMiddleware, AuthenticatedRequest } from "./middleware/auth";
import { dbToGameState } from "./engine/stateMapper";
import * as stateMachine from "./engine/gameStateMachine";
import { GamePhase, IUnit } from "../../shared/types";

var indexRouter = require("./routes/index");

var app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');//

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// CORS configuration: allow localhost in dev, restrict to FRONTEND_URL in production
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL || "https://kombass.maximepico.com"]
    : ["http://localhost:3000"];

app.use(cors({ origin: allowedOrigins }));

app.use("/", indexRouter);

// Check if a room is joinable (REST endpoint for non-player gate)
app.get("/api/room/:roomId/status", async (req: Request, res: Response) => {
  try {
    const game = await gameService.getGame(req.params.roomId);
    if (!game) {
      // Room not in DB yet, try join_game
      return res.json({ joinable: true });
    }
    if (game.status === "COMPLETED" || game.status === "ABANDONED") {
      return res.json({ joinable: false, reason: "game_over" });
    }
    // ACTIVE or PLACEMENT with 2 players already means no room for a new player
    if (game.players.length >= 2) {
      return res.json({ joinable: false, reason: "game_in_progress" });
    }
    return res.json({ joinable: true });
  } catch (error) {
    console.error("Error checking room status:", error);
    return res.json({ joinable: true }); // Default to joinable on error
  }
});

// Player 1 creates a room
app.post("/api/room", async (req: Request, res: Response) => {
  try {
    const roomId = Math.random().toString(36).substr(2, 8);
    await gameService.createGame(roomId);
    const game = await gameService.getGame(roomId);
    if (!game) {
      return res.status(500).json({ error: "Failed to create game" });
    }
    const sessionToken = await sessionService.createSession(game.id, 0, null);
    return res.json({ roomId, sessionToken });
  } catch (error) {
    console.error("Error creating room:", error);
    return res.status(500).json({ error: "Failed to create room" });
  }
});

// Player 2 joins a room
app.post("/api/room/:roomId/join", async (req: Request, res: Response) => {
  try {
    const game = await gameService.getGame(req.params.roomId);
    if (!game) {
      return res.status(404).json({ error: "room not found" });
    }
    if (game.status === "COMPLETED" || game.status === "ABANDONED") {
      return res.status(409).json({ reason: "game_over" });
    }
    if (game.players.length >= 2) {
      // If caller provides a valid session token for this game, return it (reconnection)
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const session = await sessionService.validateSession(token);
        if (session && session.gameId === game.id) {
          return res.json({ sessionToken: token });
        }
      }
      return res.status(409).json({ reason: "game_in_progress" });
    }
    // Check if player 1 slot already exists (idempotency guard against race conditions)
    const existingP1 = game.players.find((p: any) => p.playerNumber === 1);
    if (existingP1) {
      return res.json({ sessionToken: existingP1.sessionToken });
    }
    const sessionToken = await sessionService.createSession(game.id, 1, null);
    return res.json({ sessionToken });
  } catch (error) {
    console.error("Error joining room:", error);
    return res.status(500).json({ error: "Failed to join room" });
  }
});

// Admin confirms settings — saves config, advances status, broadcasts settings_confirmed
app.post("/api/room/:roomId/settings", async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { boardWidth, boardLength, placementZone, unitsCount, terrainPercentage, unitConfig, terrain, flagStayInPlace } = req.body;

    const game = await gameService.getGame(roomId);
    if (!game) {
      return res.status(404).json({ error: "room not found" });
    }

    await gameService.updateGameConfig(game.id, { boardWidth, boardLength, placementZone, unitsCount, terrainPercentage, unitConfig, terrain, flagStayInPlace });

    const appVersion = process.env.npm_package_version || null;
    if (appVersion) {
      await gameService.updateGameAppVersion(game.id, appVersion);
    }

    await gameService.updateGameState(game.id, { status: "PLACEMENT" });

    // Broadcast to all sockets in the room (including admin)
    const io = req.app.get("io") as import("socket.io").Server;
    if (io) {
      io.to(roomId).emit("settings_confirmed", { boardWidth, boardLength, placementZone, unitsCount, unitConfig, terrain, flagStayInPlace });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("Error confirming settings:", error);
    return res.status(500).json({ error: "Failed to confirm settings" });
  }
});

// GET /api/game/:roomId/state — returns game state with info hiding
app.get("/api/game/:roomId/state", authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const player = req.player!;

    const game = await gameService.getGame(roomId);
    if (!game) {
      return res.status(404).json({ error: "game not found" });
    }

    // Verify player belongs to this game
    const gamePlayer = game.players.find((p: any) => p.id === player.playerId);
    if (!gamePlayer) {
      return res.status(403).json({ error: "forbidden" });
    }

    const gameState = dbToGameState(game);
    const playerNumber = player.playerNumber;
    const opponentNumber = playerNumber === 0 ? 1 : 0;
    const full = req.query.full === "true";

    // Find player DB records for admin/futureUnits info
    const myDbPlayer = game.players.find((p: any) => p.playerNumber === playerNumber);
    const opponentDbPlayer = game.players.find((p: any) => p.playerNumber === opponentNumber);

    // Build lean response (default)
    const response: any = {
      phase: gameState.phase,
      round: gameState.round,
      boardWidth: gameState.boardWidth,
      boardLength: gameState.boardLength,
      placementZone: gameState.placementZone,
      unitsCount: gameState.unitsCount,
      flags: gameState.flags,
    };

    if (gameState.phase === GamePhase.PLACEMENT) {
      const units: any[] = [];
      units[playerNumber] = gameState.units[playerNumber];
      if (gameState.isReady[opponentNumber]) {
        units[opponentNumber] = gameState.units[opponentNumber];
      }
      response.units = units;
    } else {
      response.units = gameState.units;
    }

    // Full response for reconnection (?full=true)
    if (full) {
      response.terrain = game.terrain || [];
      response.flagStayInPlace = gameState.flagStayInPlace ?? false;
      response.unitConfig = game.unitConfig || undefined;
      response.playerNumber = playerNumber;
      response.isAdmin = myDbPlayer?.isAdmin ?? false;
      // Derive step from phase (DB currentStep is not kept in sync)
      let step = 0;
      if (gameState.phase === GamePhase.PLACEMENT) {
        step = -1; // unit placement
      } else if (gameState.phase === GamePhase.ACTIVE) {
        // If player already submitted moves, they're at confirm (step = unitsCount)
        step = myDbPlayer?.futureUnits ? gameState.unitsCount : 0;
      } else if (gameState.phase === GamePhase.COMPLETED) {
        step = gameState.unitsCount;
      }
      response.step = step;
      const futureUnits: any[] = [null, null];
      if (myDbPlayer?.futureUnits) futureUnits[playerNumber] = myDbPlayer.futureUnits;
      if (opponentDbPlayer?.futureUnits) futureUnits[opponentNumber] = opponentDbPlayer.futureUnits;
      response.futureUnits = futureUnits;
    }

    return res.json(response);
  } catch (error) {
    console.error("Error getting game state:", error);
    return res.status(500).json({ error: "Failed to get game state" });
  }
});

// POST /api/game/:roomId/place — place units during PLACEMENT phase
app.post("/api/game/:roomId/place", authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const player = req.player!;
    const { units, flag } = req.body;

    if (!units || !flag) {
      return res.status(400).json({ error: "Missing units or flag" });
    }

    const game = await gameService.getGame(roomId);
    if (!game) {
      return res.status(404).json({ error: "game not found" });
    }

    // Verify player belongs to this game
    const gamePlayer = game.players.find((p: any) => p.id === player.playerId);
    if (!gamePlayer) {
      return res.status(403).json({ error: "forbidden" });
    }

    const gameState = dbToGameState(game);
    const result = stateMachine.placeUnits(gameState, {
      playerNumber: player.playerNumber as 0 | 1,
      units,
      flag,
    });

    if (result.error) {
      // Phase errors → 409, validation errors → 400
      const status = result.error.includes("phase") ? 409 : 400;
      return res.status(status).json({ error: result.error });
    }

    // Persist
    await gameService.savePlayerUnits(player.playerId, units);
    await gameService.saveFlag(player.playerId, flag);
    await gameService.updatePlayerReady(player.playerId, true);

    const io = req.app.get("io") as import("socket.io").Server;

    // Check if both ready (auto-transition to ACTIVE)
    if (result.state.phase === GamePhase.ACTIVE) {
      await gameService.updateGameState(game.id, { status: "ACTIVE" });
      if (io) {
        io.to(roomId).emit("game_start", {});
      }
    }

    if (io) {
      io.to(roomId).emit("player_ready", { playerNumber: player.playerNumber });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("Error placing units:", error);
    return res.status(500).json({ error: "Failed to place units" });
  }
});

// POST /api/game/:roomId/moves — submit moves during ACTIVE phase
app.post("/api/game/:roomId/moves", authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const player = req.player!;
    const { futureUnits, round } = req.body;

    if (!futureUnits || round === undefined) {
      return res.status(400).json({ error: "Missing futureUnits or round" });
    }

    const game = await gameService.getGame(roomId);
    if (!game) {
      return res.status(404).json({ error: "game not found" });
    }

    // Verify player belongs to this game
    const gamePlayer = game.players.find((p: any) => p.id === player.playerId);
    if (!gamePlayer) {
      return res.status(403).json({ error: "forbidden" });
    }

    const gameState = dbToGameState(game);
    const result = stateMachine.submitMoves(gameState, {
      playerNumber: player.playerNumber as 0 | 1,
      futureUnits,
      round,
    });

    if (result.error) {
      // Phase/duplicate errors → 409, validation errors → 400
      const isPhaseOrDuplicate = result.error.includes("phase") || result.error.includes("already submitted");
      const status = isPhaseOrDuplicate ? 409 : 400;
      return res.status(status).json({ error: result.error });
    }

    const io = req.app.get("io") as import("socket.io").Server;

    // Save pending moves
    await gameService.savePlayerUnits(player.playerId, undefined, futureUnits);

    if (!result.combatResult) {
      // Only one player submitted
      if (io) {
        io.to(roomId).emit("moves_submitted", { playerNumber: player.playerNumber });
      }
      return res.json({ waiting: true });
    }

    // Combat happened — persist results
    const combatUnits = result.state.units;
    const combatFlags = result.state.flags;

    for (const p of game.players) {
      const pn = p.playerNumber;
      await gameService.updatePlayerAfterCombat(p.id, combatUnits[pn], combatFlags[pn]);
    }

    await gameService.clearPendingMoves(game.id);
    await gameService.updateGameState(game.id, { round: result.state.round });

    let winner: number | undefined;
    if (result.state.phase === GamePhase.COMPLETED) {
      await gameService.updateGameState(game.id, { status: "COMPLETED" });
      winner = result.state.winner ?? undefined;
    }

    // Pre-combat futureUnits: current player's from request, opponent's from DB
    const opponentNumber = player.playerNumber === 0 ? 1 : 0;
    const preCombatFutureUnits: IUnit[][] = [[], []];
    preCombatFutureUnits[player.playerNumber as number] = futureUnits;
    preCombatFutureUnits[opponentNumber] = gameState.futureUnits[opponentNumber] as IUnit[];

    if (io) {
      io.to(roomId).emit("combat_results", {
        futureUnits: preCombatFutureUnits,
        combatResult: result.combatResult,
        winner,
      });
    }

    return res.json({
      waiting: false,
      futureUnits: preCombatFutureUnits,
      combatResult: result.combatResult,
      winner,
    });
  } catch (error) {
    console.error("Error submitting moves:", error);
    return res.status(500).json({ error: "Failed to submit moves" });
  }
});

// catch 404 and forward to error handler
app.use(function (req: Request, res: Response, next: NextFunction) {
  next(createError(404));
});

// error handler
app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // return JSON error response
  res.status(err.status || 500).json({ error: res.locals.message });
} as ErrorRequestHandler);

export default app;
