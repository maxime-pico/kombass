import createError from "http-errors";
import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import "reflect-metadata";
import * as gameService from "./services/gameService";
import * as sessionService from "./services/sessionService";

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
      return res.status(409).json({ reason: "game_in_progress" });
    }
    const sessionToken = await sessionService.createSession(game.id, 1, null);
    return res.json({ sessionToken });
  } catch (error) {
    console.error("Error joining room:", error);
    return res.status(500).json({ error: "Failed to join room" });
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

  // render the error page
  res.status(err.status || 500);
  res.render("error");
} as ErrorRequestHandler);

export default app;
