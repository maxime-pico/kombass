// import logo from './logo.svg';
import "./App.css";
import React, { Component } from "react";
import Chat from "./components/Chat";
import Settings from "./components/Settings";
import { preloadAnimatedSprites } from "./utilities/spriteCache";
import IntroScreen from "./components/IntroScreen";
import Game from "./components/Game";
import UnitSelection from "./components/UnitSelection";
import UnitPlacement from "./components/UnitPlacement";
import { UNITS, SPRITES, defaultUnitConfig, UnitConfig } from "./utilities/dict";
import socketService from "./services/socketService";
import GameContext, { dispatchCustomEvent, isCustomEvent } from "./gameContext";
import gameService from "./services/gameService";
import { calculateCombatResults } from "./engine";
import { gamePost, gameGet } from "./services/api";
import { buildAnimationQueue, buildBoomQueue } from "./engine/animationEngine";
import { findNextAliveStep } from "./engine/stepLogic";

export type IPlayer = 0 | 1;
export type IPlayers = Array<{ name: string; color: string }>;
export type IUnit = {
  strength: number;
  range: number;
  speed: number;
  x: number;
  y: number;
  life: number;
  hasFlag: boolean;
  unitType: number; // 0=light, 1=medium, 2=heavy (sprite/cycling index, decoupled from stats)
};
export type ISelectedUnit = {
  playerNumber: number;
  unitNumber: number;
};
export type IFlag = { x: number; y: number; originX: number; originY: number; inZone: boolean };

export type IGameSettings = {
  boardWidth: number;
  boardLength: number;
  placementZone: number;
  unitsCount: number;
  unitConfig?: UnitConfig;
  terrain?: Array<{ x: number; y: number }>;
  randomTerrain?: boolean;
  flagStayInPlace?: boolean;
};

export type IAnimationItem = {
  player: 0 | 1;
  unitIndex: number;
  unit: IUnit;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  path?: Array<{ x: number; y: number }>;
};

export type IBoomEvent = {
  afterAnimationIndex: number;
  x: number;
  y: number;
};

export type AnimationSubPhase = 'idle' | 'pre-move' | 'moving' | 'post-move' | 'scanning' | 'targeting' | 'combat';

export type IAnimationPhase = {
  isAnimating: boolean;
  currentAnimationIndex: number;
  animationSubPhase: AnimationSubPhase;
  queue: Array<IAnimationItem>;
  boomQueue: Array<IBoomEvent>;
  deadUnits: Set<string>; // Format: "player_unitIndex" (e.g., "0_2" for player 0, unit 2)
};

function preloading(url: string) {
  var img = new Image();
  img.src = url;
}

interface AppProps {}

interface AppState {
  _applyBufferedMoves: () => void;
  _applyMoves: () => Promise<any>;
  _changeStep: (step: number, direction: -1 | 1) => void;
  _changePosition: (
    playerNumber: number,
    unitNumber: number,
    x: number,
    y: number,
    path?: Array<{ x: number; y: number }>
  ) => void;
  _circlePlayer: () => void;
  _circleUnit: (
    playerIndex: number,
    unitIndex: number,
    currentType: number,
    direction: number
  ) => void;
  _createRoom: () => Promise<void>;
  _placeUnit: (unitNumber: number, col: number, row: number) => void;
  _startGame: () => Promise<void>;
  _setBoardSize: (length: number, width: number, customFlags?: Array<IFlag>) => void;
  _setGameStarted: () => void;
  _setInRoom: () => void;
  _setIsAdmin: (isAdmin: boolean) => void;
  _setIsPlayer: (isPlayer: 0 | 1) => void;
  _setPlacementZone: (zoneSize: number) => void;
  _setTerrain: (terrain: Array<{ x: number; y: number }>) => void;
  _setFlags: (flags: Array<IFlag>) => void;
  _setUnitConfig: (unitConfig: UnitConfig) => void;
  _setFlagStayInPlace: (flagStayInPlace: boolean) => void;
  _setSelectedUnit: (
    playerNumber: number,
    unitNumber: number,
    step: number
  ) => void;
  _setUnitCount: (unitCount: number) => void;
  _setWaitingForMoves: (ready: boolean, player: number) => void;
  _undoMove: () => void;
  _updateBufferOpponentUnits: (bufferOpponentUnits: Array<IUnit>) => void;
  _updateMovesListener: (update: {
    units: Array<IUnit>;
    round: number;
  }) => void;
  _updateOpponentUnits: (opponentsFutureunits: Array<IUnit>) => void;
  _waitingForMoves: (e: Event) => void;
  boardLength: number;
  boardWidth: number;
  bufferOpponentUnits: Array<IUnit>;
  flags: Array<IFlag>;
  futureUnits: Array<Array<IUnit>>;
  futureUnitsHistory: Array<Array<IUnit>>;
  gameStarted: boolean;
  isAdmin: boolean;
  isInRoom: boolean;
  isPlayer: 0 | 1;
  placedUnits: Array<Array<boolean>>;
  placementZone: number;
  player: 0 | 1;
  players: IPlayers;
  ready: Array<boolean>;
  round: number;
  roomId: string;
  roomMessage: string;
  selectedUnit: ISelectedUnit;
  step: number;
  units: Array<Array<IUnit>>;
  unitsCount: number;
  terrain: Array<{ x: number; y: number }>;
  unitConfig: UnitConfig;
  flagStayInPlace: boolean;
  waitingForMoves: Array<boolean>;
  movementPaths: Array<Array<{ x: number; y: number }> | null>;
  animationPhase: IAnimationPhase;
  isSyncing: boolean;
  isTestScenario: boolean;
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      _applyBufferedMoves: this._applyBufferedMoves,
      _changeStep: this._changeStep,
      _changePosition: this._changePosition,
      _circlePlayer: this._circlePlayer,
      _circleUnit: this._circleUnit,
      _createRoom: this.createAndJoinRoom,
      _placeUnit: this._placeUnit,
      _startGame: this._startGame,
      _setBoardSize: this._setBoardSize,
      _setGameStarted: this._setGameStarted,
      _setInRoom: this._setInRoom,
      _setIsAdmin: this._setIsAdmin,
      _setIsPlayer: this._setIsPlayer,
      _setPlacementZone: this._setPlacementZone,
      _setTerrain: this._setTerrain,
      _setFlags: this._setFlags,
      _setUnitConfig: this._setUnitConfig,
      _setFlagStayInPlace: this._setFlagStayInPlace,
      _setSelectedUnit: this._setSelectedUnit,
      _setUnitCount: this._setUnitCount,
      _setWaitingForMoves: this._setWaitingForMoves,
      _undoMove: this._undoMove,
      _applyMoves: this._applyMoves,
      _updateBufferOpponentUnits: this._updateBufferOpponentUnits,
      _updateMovesListener: this._updateMovesListener,
      _updateOpponentUnits: this._updateOpponentUnits,
      _waitingForMoves: this._waitingForMoves,
      boardLength: 21,
      boardWidth: 22,
      bufferOpponentUnits: Array(5).fill(null),
      flags: [
        { x: 0, y: 10, originX: 0, originY: 10, inZone: true },
        { x: 21, y: 10, originX: 21, originY: 10, inZone: true },
      ],
      flagStayInPlace: false,
      futureUnits: [Array(5).fill(null), Array(5).fill(null)],
      futureUnitsHistory: [],
      movementPaths: Array(5).fill(null),
      gameStarted: false,
      isAdmin: false,
      isInRoom: false,
      isPlayer: 0,
      placedUnits: [Array(5).fill(false), Array(5).fill(false)],
      placementZone: 5,
      player: 0,
      players: [
        { name: "P1", color: "blue" },
        { name: "P2", color: "red" },
      ],
      ready: [false, false],
      round: 0,
      roomId: "",
      roomMessage: "",
      selectedUnit: { playerNumber: 0, unitNumber: 0 },
      step: -5,
      units: Array(2).fill(
        Array(5).fill({
          strength: 1,
          range: 1,
          speed: 3,
          x: 12,
          y: 6,
          life: 1,
          hasFlag: false,
          unitType: 0,
        })
      ),
      terrain: [],
      unitsCount: 5,
      unitConfig: defaultUnitConfig(),
      waitingForMoves: [false, false],
      animationPhase: {
        isAnimating: false,
        currentAnimationIndex: 0,
        animationSubPhase: 'idle',
        queue: [],
        boomQueue: [],
        deadUnits: new Set(),
      },
      isSyncing: false,
      isTestScenario: false,
    };

    this._applyBufferedMoves = this._applyBufferedMoves.bind(this);
    this._applyMoves = this._applyMoves.bind(this);
    this._changePosition = this._changePosition.bind(this);
    this._changeStep = this._changeStep.bind(this);
    this._circlePlayer = this._circlePlayer.bind(this);
    this._circleUnit = this._circleUnit.bind(this);
    this._defineSettings = this._defineSettings.bind(this);
    this._joinRoom = this._joinRoom.bind(this);
    this._placeUnit = this._placeUnit.bind(this);
    this._placeUnits = this._placeUnits.bind(this);
    this._selectUnits = this._selectUnits.bind(this);
    this._setBoardSize = this._setBoardSize.bind(this);
    this._setGameStarted = this._setGameStarted.bind(this);
    this._setInRoom = this._setInRoom.bind(this);
    this._setIsAdmin = this._setIsAdmin.bind(this);
    this._setIsPlayer = this._setIsPlayer.bind(this);
    this._setPlacementZone = this._setPlacementZone.bind(this);
    this._setTerrain = this._setTerrain.bind(this);
    this._setFlags = this._setFlags.bind(this);
    this._setUnitConfig = this._setUnitConfig.bind(this);
    this._setSelectedUnit = this._setSelectedUnit.bind(this);
    this._setUnitCount = this._setUnitCount.bind(this);
    this._startGame = this._startGame.bind(this);
    this._undoMove = this._undoMove.bind(this);
    this._updateBufferOpponentUnits =
      this._updateBufferOpponentUnits.bind(this);
    this._updateMovesListener = this._updateMovesListener.bind(this);
    this._updateFlags = this._updateFlags.bind(this);
    this._setWaitingForMoves = this._setWaitingForMoves.bind(this);
    this._updateOpponentUnits = this._updateOpponentUnits.bind(this);
    this._waitingForMoves = this._waitingForMoves.bind(this);
    this.reconnectToGame = this.reconnectToGame.bind(this);
    this._handleGameStateRestored = this._handleGameStateRestored.bind(this);
    this._handleReconnectError = this._handleReconnectError.bind(this);
    this.createAndJoinRoom = this.createAndJoinRoom.bind(this);
    this.checkAndJoinRoom = this.checkAndJoinRoom.bind(this);
    this.extractRoomIdFromUrl = this.extractRoomIdFromUrl.bind(this);
  }

  connectSocket = async () => {
    const socket = await socketService
      // .connect("https://kombass-server.herokuapp.com/")
      .connect(process.env.REACT_APP_BACKEND_URL ?? "http://localhost:9000", "test")
      .catch((e: string) => console.log("Error on connect: ", e));

    if (socket) {
      this._handlePlayerReady();
      this._handleGameStart();
    }
  };

  extractRoomIdFromUrl = (): string | null => {
    const match = window.location.pathname.match(/^\/game\/([a-z0-9]+)$/i);
    return match ? match[1] : null;
  };

  checkAndJoinRoom = async (roomId: string) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL ?? "http://localhost:9000";
      const resp = await fetch(`${backendUrl}/api/room/${roomId}/join`, { method: "POST" });
      if (!resp.ok) {
        const data = await resp.json();
        const msg =
          data.reason === "game_over"
            ? "This game has ended."
            : "A game is already in progress in this room and you are not a player.";
        this.setState({ roomMessage: msg });
        return;
      }
      const { sessionToken } = await resp.json();
      localStorage.setItem(`kombass_session_token_${roomId}`, sessionToken);
      await this.connectSocket();
      if (socketService.socket) {
        socketService.socket.emit("authenticate", { sessionToken });
        this._setInRoom();
        this._setIsAdmin(false);
        this._setIsPlayer(1);
        this.setState({ step: -3, roomMessage: "" });
      }
    } catch (_) {
      this.setState({ roomMessage: "Could not connect to room." });
    }
  };

  createAndJoinRoom = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL ?? "http://localhost:9000";
      const resp = await fetch(`${backendUrl}/api/room`, { method: "POST" });
      if (!resp.ok) {
        alert("Failed to create room");
        return;
      }
      const { roomId, sessionToken } = await resp.json();
      localStorage.setItem(`kombass_session_token_${roomId}`, sessionToken);
      window.history.pushState({}, "", `/game/${roomId}`);
      this.setState({ roomId });
      await this.connectSocket();
      if (socketService.socket) {
        socketService.socket.emit("authenticate", { sessionToken });
        this._setInRoom();
        this._setIsAdmin(true);
        this._setIsPlayer(0);
        this.setState({ step: -3, roomMessage: "" });
      }
    } catch (_) {
      alert("Could not connect to server");
    }
  };

  _setInRoom = () => {
    this.setState({
      isInRoom: true,
    });
  };

  _setIsAdmin = (isAdmin: boolean) => {
    this.setState({
      isAdmin: isAdmin,
    });
  };

  _setIsPlayer = (isPlayer: 0 | 1) => {
    this.setState({
      isPlayer: isPlayer,
      selectedUnit: {
        playerNumber: isPlayer,
        unitNumber: 0,
      },
    });
  };

  _setGameStarted = () => {
    this.setState({
      gameStarted: true,
    });
  };

  _setUnitCount = (count: number) => {
    this.setState({
      units: Array(2).fill(
        Array(count).fill({
          strength: 1,
          range: 1,
          speed: 3,
          x: 12,
          y: 6,
          life: 1,
          hasFlag: false,
          unitType: 0,
        })
      ),
      futureUnits: [Array(count).fill(null), Array(count).fill(null)],
      movementPaths: Array(count).fill(null),
      placedUnits: [Array(count).fill(false), Array(count).fill(false)],
      unitsCount: count,
    });
  };

  _setBoardSize = (length: number, width: number, customFlags?: Array<IFlag>) => {
    this.setState({
      boardLength: length,
      boardWidth: width,
      flags: customFlags || [
        {
          x: 0,
          y: Math.floor(length / 2),
          originX: 0,
          originY: Math.floor(length / 2),
          inZone: true,
        },
        {
          x: width - 1,
          y: Math.floor(length / 2),
          originX: width - 1,
          originY: Math.floor(length / 2),
          inZone: true,
        },
      ],
    });
  };

  _setPlacementZone = (width: number) => {
    this.setState({
      placementZone: width,
    });
  };

  _setTerrain = (terrain: Array<{ x: number; y: number }>) => {
    this.setState({ terrain });
  };

  _setFlags = (flags: Array<IFlag>) => {
    this.setState({ flags });
  };

  _setUnitConfig = (unitConfig: UnitConfig) => {
    console.log("[_setUnitConfig] Custom unit config set:", unitConfig);
    const unitNames = ["light", "medium", "heavy"] as const;
    this.setState((prevState) => {
      const updatedUnits = prevState.units.map((playerUnits) =>
        playerUnits.map((unit) => {
          if (!unit) return unit;
          const unitName = unitNames[unit.unitType ?? 0] as keyof UnitConfig;
          const stats = unitConfig[unitName];
          return { ...unit, strength: stats.strength, speed: stats.speed, life: stats.life };
        })
      );
      return { unitConfig, units: updatedUnits };
    });
  };

  _setFlagStayInPlace = (flagStayInPlace: boolean) => {
    this.setState({ flagStayInPlace });
  };

  _setWaitingForMoves = (ready: boolean, player: number) => {
    this.setState((prevState) => {
      const waitingForMoves = [...prevState.waitingForMoves];
      waitingForMoves[player] = ready;
      return { waitingForMoves };
    });
  };

  _updateOpponentUnits = (opponentsFutureunits: Array<IUnit>) => {
    let futureUnits = [...this.state.futureUnits];
    futureUnits[(this.state.isPlayer + 1) % 2] = opponentsFutureunits;
    this.setState({
      futureUnits: futureUnits,
      bufferOpponentUnits: Array(5).fill(null),
    });
  };

  _updateBufferOpponentUnits = (bufferOpponentUnits: Array<IUnit>) => {
    this.setState({
      bufferOpponentUnits: [...bufferOpponentUnits],
    });
  };

  _waitingForMoves = (e: Event) => {
    if (!isCustomEvent(e)) throw new Error("not a custom event");
    // e is now narrowed to CustomEvent ...
    this._updateOpponentUnits(e.detail.units);
    this._setWaitingForMoves(true, (this.state.isPlayer + 1) % 2);
  };

  _applyBufferedMoves = () => {
    if (this.state.bufferOpponentUnits.filter((unit) => unit !== null).length) {
      dispatchCustomEvent("ready_for_moves", {
        units: this.state.bufferOpponentUnits,
      });
    }
  };

  _updateMovesListener = (update: { units: Array<IUnit>; round: number }) => {
    if (this.state.round + 1 > update.round) {
      this._updateOpponentUnits(update.units);
      this._setWaitingForMoves(true, (this.state.isPlayer + 1) % 2);
    } else {
      this._updateBufferOpponentUnits(update.units);
      document.addEventListener("ready_for_moves", this._waitingForMoves);
    }
  };

  _circleUnit = (
    playerIndex: number,
    unitIndex: number,
    currentType: number,
    direction: number
  ) => {
    let units = this.state.units;
    let currentPlayerUnits = [...units[playerIndex]];
    let currentPlayerUnit = currentPlayerUnits[unitIndex];
    let newIndex =
      currentType === 0 && direction === -1 ? 2 : (currentType + direction) % 3;
    const unitNames = ["light", "medium", "heavy"] as const;
    const unitName = unitNames[newIndex] as keyof UnitConfig;
    const unitStats = this.state.unitConfig[unitName];
    console.log(`[_circleUnit] Player ${playerIndex}, Unit ${unitIndex}: changing to ${unitName}`, unitStats);
    currentPlayerUnit = {
      ...currentPlayerUnit,
      unitType: newIndex,
      strength: unitStats.strength,
      range: unitStats.range,
      speed: unitStats.speed,
      life: unitStats.life,
    };
    currentPlayerUnits[unitIndex] = currentPlayerUnit;
    units[playerIndex] = currentPlayerUnits;
    this.setState({
      units: units,
    });
  };

  _circlePlayer = () => {
    this.setState({
      player: this.state.player === 0 ? 1 : 0,
    });
  };

  _joinRoom = () => {
    this.setState({
      step: -4,
    });
  };

  _defineSettings = () => {
    this.setState({
      step: -3,
    });
  };

  _selectUnits = () => {
    this.setState({
      step: -2,
    });
  };

  _setSelectedUnit = (
    playerNumber: number,
    unitNumber: number,
    step: number
  ) => {
    this.setState({
      selectedUnit: {
        playerNumber: playerNumber,
        unitNumber: unitNumber,
      },
    });
  };

  _placeUnits = () => {
    this.setState({
      step: -1,
      player: 0,
    });
  };

  // Used when placing the units on the board before the start of the game
  _placeUnit = (unitNumber: number, col: number, row: number) => {
    let units = this.state.units;
    let playerNumber = this.state.isPlayer;
    let currentPlayerUnits = [...units[playerNumber]];

    // replacing x and y coordinates for the unit currently placed
    let currentPlayerUnit = { ...currentPlayerUnits[unitNumber] };
    currentPlayerUnit = { ...currentPlayerUnit, x: col, y: row };
    currentPlayerUnits[unitNumber] = currentPlayerUnit;
    units[playerNumber] = currentPlayerUnits; // preparing reinsertion in state

    // updating placedUnits Matrix
    let placedUnits = this.state.placedUnits;
    let currentPlayerPlacedUnits = [...placedUnits[playerNumber]];
    let playerPlacedUnits = currentPlayerPlacedUnits[unitNumber];
    playerPlacedUnits = true;
    currentPlayerPlacedUnits[unitNumber] = playerPlacedUnits;
    placedUnits[playerNumber] = currentPlayerPlacedUnits; // preparing reinsertion in state

    // deciding which is the next unit to place
    let nextUnitNumber = (unitNumber + 1) % this.state.unitsCount;

    this._setSelectedUnit(playerNumber, nextUnitNumber, 0); // select next unit of player

    this.setState({
      units: units,
      placedUnits: placedUnits,
    });

    // No auto-start — player must click CONFIRM PLACEMENT button
  };

  _startGame = async () => {
    const player = this.state.isPlayer;
    this._setSelectedUnit(player, 0, 0);

    try {
      const res = await gamePost(this.state.roomId, "place", {
        units: this.state.units[player],
        flag: this.state.flags[player],
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("Placement failed:", data.error);
        return;
      }
    } catch (error) {
      console.error("Placement request failed:", error);
      return;
    }

    // Mark self as ready — stay on placement screen showing "Waiting..."
    // Transition to movement happens in _handlePlayerReady when /state shows ACTIVE
    const ready = [...this.state.ready];
    ready[player] = true;
    this.setState({ ready });
  };

  _changeStep = (step: number, direction: -1 | 1) => {
    var nextStep = step;
    if (step < 0) {
      nextStep = step + direction;
    } else {
      const unitLives = this.state.units[this.state.isPlayer].map(u => u?.life ?? 0);
      nextStep = findNextAliveStep(step, direction, unitLives, this.state.unitsCount);
      if (nextStep !== this.state.unitsCount) {
        this._setSelectedUnit(this.state.isPlayer, nextStep, nextStep);
      } else {
        let selectedUnit = { playerNumber: -1, unitNumber: -1 };
        this.setState({
          selectedUnit: selectedUnit,
        });
      }
    }
    this.setState({
      step: nextStep,
    });
    return true;
  };

  _undoMove = () => {
    let futureUnits = [...this.state.futureUnits];
    let myFutureUnits = [...futureUnits[this.state.isPlayer]];
    let futureUnitsHistory = [...this.state.futureUnitsHistory];
    futureUnitsHistory.pop();
    myFutureUnits = futureUnitsHistory.length
      ? futureUnitsHistory[futureUnitsHistory.length - 1]
      : Array(this.state.unitsCount).fill(null);
    futureUnits[this.state.isPlayer] = [...myFutureUnits];
    this.setState({
      futureUnits: futureUnits,
      futureUnitsHistory: futureUnitsHistory,
      movementPaths: Array(this.state.unitsCount).fill(null),
    });
    this._changeStep(this.state.step, -1);
  };

  _updateFlags = (newFlags: Array<IFlag>) => {
    this.setState({
      flags: newFlags,
    });
  };

  // Registers where the user has decided to move its unit
  _changePosition = (
    playerNumber: number,
    unitNumber: number,
    x: number,
    y: number,
    path?: Array<{ x: number; y: number }>
  ) => {
    // initialise vars..
    const life = this.state.units[playerNumber][unitNumber]?.life;
    let currentPlayerUnit = this.state.units[playerNumber][unitNumber];
    let futureUnits = [...this.state.futureUnits];
    let futurePlayerUnits = [...futureUnits[playerNumber]];
    let futurePlayerUnit = futurePlayerUnits[unitNumber];
    let opponentNumber = (playerNumber + 1) % 2;
    let futureOpponentUnits = [...futureUnits[opponentNumber]];

    // Build the updated information to send it to the state
    futurePlayerUnit = {
      ...currentPlayerUnit,
      x: x,
      y: y,
      life: life,
    };

    // Also check if the unit should have the flag
    if (
      this.state.flags[opponentNumber].x === x &&
      this.state.flags[opponentNumber].y === y &&
      this.state.flags[opponentNumber].inZone &&
      life > 0
    ) {
      futurePlayerUnit = { ...futurePlayerUnit, hasFlag: true };
    }

    // Update the state with new information
    let futureUnitsArray = [];
    futurePlayerUnits[unitNumber] = futurePlayerUnit;
    futureUnitsArray[opponentNumber] = futureOpponentUnits;
    futureUnitsArray[playerNumber] = futurePlayerUnits;

    let futureUnitsHistory = [...this.state.futureUnitsHistory];
    futureUnitsHistory.push(futurePlayerUnits);

    // Store the movement path for animation
    // If the unit stays in place, clear any stale path from hovering
    const movementPaths = [...this.state.movementPaths];
    const originX = currentPlayerUnit.x;
    const originY = currentPlayerUnit.y;
    movementPaths[unitNumber] = (x === originX && y === originY) ? null : (path || null);

    this.setState({
      futureUnits: futureUnitsArray,
      futureUnitsHistory: futureUnitsHistory,
      movementPaths: movementPaths,
    });
  };

  _buildAnimationQueue = (): Array<IAnimationItem> => {
    return buildAnimationQueue({
      units: this.state.units,
      futureUnits: this.state.futureUnits,
      flags: this.state.flags,
      isPlayer: this.state.isPlayer,
      unitsCount: this.state.unitsCount,
    }, {
      movementPaths: this.state.movementPaths,
      terrain: this.state.terrain,
      boardWidth: this.state.boardWidth,
      boardLength: this.state.boardLength,
    });
  };

  _calculateCombatResults = () => {
    console.log(`=== COMBAT CALC END (Player ${this.state.isPlayer}, Round ${this.state.round}) ===`);
    const result = calculateCombatResults({
      units: this.state.units,
      futureUnits: this.state.futureUnits,
      flags: this.state.flags,
      isPlayer: this.state.isPlayer,
      unitsCount: this.state.unitsCount,
      flagStayInPlace: this.state.flagStayInPlace,
    });
    console.log("newFutureUnits (result):", JSON.stringify(result.newFutureUnits));
    return result;
  };

  _buildBoomQueue = (animationQueue: Array<IAnimationItem>): Array<IBoomEvent> => {
    return buildBoomQueue(
      {
        units: this.state.units,
        futureUnits: this.state.futureUnits,
        flags: this.state.flags,
        isPlayer: this.state.isPlayer,
        unitsCount: this.state.unitsCount,
      },
      animationQueue
    );
  };

  _setAnimationSubPhase = (subPhase: AnimationSubPhase) => {
    this.setState(prevState => ({
      animationPhase: {
        ...prevState.animationPhase,
        animationSubPhase: subPhase,
      },
    }));
  };

  _runAnimationSequence = async () => {
    const { queue, boomQueue } = this.state.animationPhase;

    console.log(`Starting animation sequence with ${queue.length} animations`);

    // Add delay to allow React to re-render and attach event listeners
    await new Promise((resolve) => setTimeout(resolve, 50));

    for (let i = 0; i < queue.length; i++) {
      const animation = queue[i];

      console.log(`Animating unit ${animation.unitIndex} of player ${animation.player} (${i + 1}/${queue.length})`);

      // Pre-move: brief flash of danger zone at origin position
      this._setAnimationSubPhase('pre-move');
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Moving: hide danger zone during slide
      this._setAnimationSubPhase('moving');

      // Dispatch event for this unit to animate
      dispatchCustomEvent("animate_unit", {
        player: animation.player,
        unitIndex: animation.unitIndex,
        fromX: animation.fromX,
        fromY: animation.fromY,
        toX: animation.toX,
        toY: animation.toY,
        path: animation.path,
      });

      // Wait for animation duration: light/medium units need extra time for phase animations (800ms + 800ms)
      const unitType = animation.unit ? (animation.unit.unitType ?? 0) : -1;
      const hasPhaseAnim = unitType === 0 || unitType === 1 || unitType === 2;
      const animDuration = hasPhaseAnim ? 1000 : 500;
      await new Promise((resolve) => setTimeout(resolve, animDuration));

      // Post-move: show danger zone at destination + scan animation
      this._setAnimationSubPhase('scanning');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if any booms should trigger after this animation
      const boomsToTrigger = boomQueue.filter(
        (boom) => boom.afterAnimationIndex === i
      );

      if (boomsToTrigger.length > 0) {
        // Targeting: flash enemy squares in range
        this._setAnimationSubPhase('targeting');
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Raise animation on units at boom locations before combat
        const boomLocations = boomsToTrigger.map(b => ({ x: b.x, y: b.y }));
        // Build list of units at boom locations so both origin and destination squares can match
        const unitsAtBooms: Array<{ player: number; unitIndex: number; unitType: number; x: number; y: number }> = [];
        for (const boom of boomsToTrigger) {
          for (let player = 0; player < 2; player++) {
            for (let unitIdx = 0; unitIdx < this.state.unitsCount; unitIdx++) {
              const u = this.state.futureUnits[player]?.[unitIdx];
              if (u && u.x === boom.x && u.y === boom.y && u.life > 0) {
                unitsAtBooms.push({ player, unitIndex: unitIdx, unitType: u.unitType ?? 0, x: boom.x, y: boom.y });
              }
            }
          }
        }
        // Combat: embuscade + booms
        this._setAnimationSubPhase('combat');

        // Show "EMBUSCADE!" text first
        dispatchCustomEvent("embuscade", {});
        await new Promise((resolve) => setTimeout(resolve, 1600));

        // Raise animation on units at boom locations after embuscade message
        dispatchCustomEvent("embuscade_raise", { locations: boomLocations, units: unitsAtBooms });
        await new Promise((resolve) => setTimeout(resolve, 800));

        console.log(`Triggering ${boomsToTrigger.length} boom(s) after animation ${i}`);
        for (const boom of boomsToTrigger) {
          // Calculate damage at this location by comparing pre/post combat life
          let damage = 0;
          if (this.combatResultsBuffer) {
            for (let player = 0; player < 2; player++) {
              for (let unitIdx = 0; unitIdx < this.state.unitsCount; unitIdx++) {
                const preUnit = this.state.futureUnits[player]?.[unitIdx];
                const postUnit = this.combatResultsBuffer.newFutureUnits[player][unitIdx];
                if (preUnit && postUnit && preUnit.x === boom.x && preUnit.y === boom.y && postUnit.life > 0) {
                  const unitDamage = preUnit.life - postUnit.life;
                  if (unitDamage > 0) damage = Math.max(damage, unitDamage);
                }
              }
            }
          }
          dispatchCustomEvent("boom", { x: boom.x, y: boom.y, damage });
        }

        // Wait for boom animations (1000ms)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // After boom, check which units are now dead and mark them
        if (this.combatResultsBuffer) {
          const { newFutureUnits } = this.combatResultsBuffer;
          const unitsCount = this.state.unitsCount;

          // Update dead units set
          this.setState(prevState => {
            const newDeadUnits = new Set(prevState.animationPhase.deadUnits);

            // Check all units at boom locations
            for (const boom of boomsToTrigger) {
              for (let player = 0; player < 2; player++) {
                for (let unitIdx = 0; unitIdx < unitsCount; unitIdx++) {
                  const unit = newFutureUnits[player][unitIdx];
                  if (unit && unit.x === boom.x && unit.y === boom.y && unit.life <= 0) {
                    newDeadUnits.add(`${player}_${unitIdx}`);
                  }
                }
              }
            }

            return {
              animationPhase: {
                ...prevState.animationPhase,
                deadUnits: newDeadUnits,
                currentAnimationIndex: i + 1,
                animationSubPhase: 'idle' as const,
              },
            };
          });
        } else {
          // No combat results, just update progress
          this.setState(prevState => ({
            animationPhase: {
              ...prevState.animationPhase,
              currentAnimationIndex: i + 1,
              animationSubPhase: 'idle' as const,
            },
          }));
        }
      } else {
        // No booms, just update progress
        this.setState(prevState => ({
          animationPhase: {
            ...prevState.animationPhase,
            currentAnimationIndex: i + 1,
            animationSubPhase: 'idle' as const,
          },
        }));
      }
    }

    console.log("Animation sequence complete");
    // All animations done - apply final results
    this._finalizeCombat();
  };

  // Store combat results temporarily (instance variable)
  combatResultsBuffer: {
    newFutureUnits: Array<Array<IUnit>>;
    flags: Array<IFlag>;
    firstLivingUnitIndex: number;
  } | null = null;

  _finalizeCombat = () => {
    if (!this.combatResultsBuffer) {
      console.error("No combat results to finalize!");
      return;
    }

    const results = this.combatResultsBuffer;

    console.log(`=== FINALIZING COMBAT (Player ${this.state.isPlayer}, Round ${this.state.round}) ===`);
    console.log("Combat result flags:", JSON.stringify(results.flags));
    console.log("Combat result units hasFlag:", results.newFutureUnits.map((pu: any[], pi: number) =>
      pu.map((u: any, ui: number) => `P${pi}U${ui}: hasFlag=${u?.hasFlag}, life=${u?.life}`)
    ));

    this.setState({
      units: results.newFutureUnits,
      futureUnits: [
        Array(this.state.unitsCount).fill(null),
        Array(this.state.unitsCount).fill(null),
      ],
      futureUnitsHistory: [],
      movementPaths: Array(this.state.unitsCount).fill(null),
      waitingForMoves: [false, false],
      round: this.state.round + 1,
      step: results.firstLivingUnitIndex,
      selectedUnit: {
        playerNumber: this.state.isPlayer,
        unitNumber: results.firstLivingUnitIndex,
      },
      animationPhase: {
        isAnimating: false,
        currentAnimationIndex: 0,
        animationSubPhase: 'idle',
        queue: [],
        boomQueue: [],
        deadUnits: new Set(),
      },
      flags: results.flags,
    });

    // Server already persisted combat results in /moves endpoint
    this.combatResultsBuffer = null;

    console.log(`=== COMBAT FINALIZED (Player ${this.state.isPlayer}, Round ${this.state.round + 1}) ===`);
  };

  _applyMoves = async () => {
    // first check the results of the fights
    if (this.state.step === this.state.unitsCount) {
      console.log(`=== COMBAT START (Player ${this.state.isPlayer}, Round ${this.state.round}) ===`);

      // Build animation queue
      const animationQueue = this._buildAnimationQueue();
      const boomQueue = this._buildBoomQueue(animationQueue);

      // [LOCATION D] Log queue sizes (test mode only)
      if (process.env.REACT_APP_TEST_MODE === "true") {
        console.log(`[APPLY] animationQueue size: ${animationQueue.length}, boomQueue size: ${boomQueue.length}`);
        if (boomQueue.length === 0) {
          console.warn(
            "[APPLY] ⚠ Boom queue is EMPTY — no combat animations will fire"
          );
        }
      }

      // Calculate combat results (but don't apply yet)
      const combatResults = this._calculateCombatResults();

      // Store results for later
      this.combatResultsBuffer = combatResults;

      // Enter animation phase and return the animation promise
      return new Promise<void>((resolve) => {
        this.setState(
          {
            animationPhase: {
              isAnimating: true,
              currentAnimationIndex: 0,
              animationSubPhase: 'pre-move',
              queue: animationQueue,
              boomQueue: boomQueue,
              deadUnits: new Set(),
            },
          },
          () => {
            // After state update, run animation sequence and resolve when complete
            this._runAnimationSequence().then(() => {
              resolve();
            });
          }
        );
      });
    }
  };

  // Upon receiving "player_ready" socket notification, fetch authoritative state via REST
  _handlePlayerReady = () => {
    if (socketService.socket) {
      gameService.onReady(socketService.socket, async () => {
        try {
          const res = await gameGet(this.state.roomId, "state");
          if (!res.ok) return;
          const data = await res.json();

          if (data.phase === "ACTIVE" && data.units?.[0] && data.units?.[1]) {
            // Both ready — load units and transition to movement
            this.setState({
              units: data.units,
              flags: data.flags ?? this.state.flags,
              ready: [true, true],
              step: 0,
            });
            this._handleOpponentReconnected();
          } else {
            // Opponent placed but we haven't yet — just note they're ready
            const opponent = ((this.state.isPlayer + 1) % 2) as 0 | 1;
            const ready = [...this.state.ready];
            ready[opponent] = true;
            this.setState({ ready });
          }
        } catch (error) {
          console.error("Failed to fetch state after player_ready:", error);
        }
      });
    }
  };

  _handleGameStart = () => {
    if (socketService.socket) {
      gameService.onJoinedGame(socketService.socket, (options) => {
        // Store sessionToken for reconnection
        if (options.sessionToken) {
          localStorage.setItem(
            `kombass_session_token_${this.state.roomId}`,
            options.sessionToken
          );
        }

        console.log("[start_game] received:", options);
        this._setIsPlayer(options.player);
        this._setIsAdmin(options.admin);

        // Register opponent reconnection listener
        this._handleOpponentReconnected();
      });
    }
  };


  reconnectToGame = async (sessionToken: string, roomIdOverride?: string) => {
    try {
      const roomId = roomIdOverride || this.state.roomId;
      this.setState({ isSyncing: true, roomId });

      const res = await gameGet(roomId, "state?full=true");
      if (!res.ok) {
        throw new Error("Failed to fetch game state");
      }
      const data = await res.json();

      // Connect socket for live notifications
      const backendUrl = process.env.REACT_APP_BACKEND_URL ?? "http://localhost:9000";
      await socketService.connect(backendUrl, "test");
      if (socketService.socket) {
        socketService.socket.emit("authenticate", { sessionToken });
      }

      const playerNumber = data.playerNumber as 0 | 1;
      const opponentNumber = (playerNumber === 0 ? 1 : 0) as 0 | 1;

      // Reconstruct futureUnits
      const futureUnits: Array<Array<IUnit>> = [
        Array(data.unitsCount).fill(null),
        Array(data.unitsCount).fill(null),
      ];
      if (data.futureUnits?.[playerNumber]) {
        futureUnits[playerNumber] = data.futureUnits[playerNumber];
      }
      if (data.futureUnits?.[opponentNumber]) {
        futureUnits[opponentNumber] = data.futureUnits[opponentNumber];
      }

      // Find first living unit
      const myUnits = data.units?.[playerNumber] || [];
      let firstLivingUnitIndex = 0;
      for (let i = 0; i < data.unitsCount; i++) {
        if (myUnits[i]?.life > 0) {
          firstLivingUnitIndex = i;
          break;
        }
      }

      this.setState(
        {
          isPlayer: playerNumber,
          isAdmin: data.isAdmin,
          boardWidth: data.boardWidth,
          boardLength: data.boardLength,
          placementZone: data.placementZone,
          unitsCount: data.unitsCount,
          units: data.units,
          futureUnits,
          flags: data.flags,
          ready: [true, true],
          terrain: data.terrain || [],
          flagStayInPlace: data.flagStayInPlace ?? false,
          unitConfig: data.unitConfig || undefined,
          round: data.round,
          step: data.futureUnits?.[playerNumber] ? data.unitsCount : data.step,
          isInRoom: true,
          gameStarted: true,
          selectedUnit: data.futureUnits?.[playerNumber]
            ? { playerNumber: -1, unitNumber: -1 }
            : { playerNumber, unitNumber: firstLivingUnitIndex },
          waitingForMoves: (() => {
            const wfm = [false, false];
            wfm[playerNumber] = data.futureUnits?.[playerNumber] != null;
            wfm[opponentNumber] = data.futureUnits?.[opponentNumber] != null;
            return wfm;
          })(),
          bufferOpponentUnits: Array(data.unitsCount).fill(null),
          futureUnitsHistory: [],
          placedUnits: [
            Array(data.unitsCount).fill(true),
            Array(data.unitsCount).fill(true),
          ],
          isSyncing: false,
        },
        () => {
          console.log(
            `Reconnected to game at step ${this.state.step}, round ${this.state.round}`
          );
          // Register socket listeners for live events
          this._handlePlayerReady();
          this._handleOpponentReconnected();
        }
      );
    } catch (error) {
      console.error("Reconnection failed:", error);
      if (this.state.roomId) {
        localStorage.removeItem(`kombass_session_token_${this.state.roomId}`);
      }
      window.history.pushState({}, "", "/");
      this.setState({ isSyncing: false, step: -5 });
      this.connectSocket();
    }
  };

  _handleGameStateRestored = (message: {
    gameState: any;
    playerNumber: number;
    isAdmin: boolean;
  }) => {
    console.log("Game state restored:", message);

    const { gameState, playerNumber, isAdmin } = message;
    const { game, players } = gameState;

    // Find my player and opponent player
    const myPlayer = players.find((p: any) => p.playerNumber === playerNumber);
    const opponentPlayer = players.find((p: any) => p.playerNumber !== playerNumber);

    // Reconstruct units array [player0Units, player1Units]
    const units: Array<Array<IUnit>> = [[], []];
    units[playerNumber] = myPlayer.units;
    units[(playerNumber + 1) % 2] = opponentPlayer.units;

    // Reconstruct futureUnits array
    const futureUnits: Array<Array<IUnit>> = [
      Array(game.unitsCount).fill(null),
      Array(game.unitsCount).fill(null),
    ];
    if (myPlayer.futureUnits) {
      futureUnits[playerNumber] = myPlayer.futureUnits;
    }
    if (opponentPlayer.futureUnits) {
      futureUnits[(playerNumber + 1) % 2] = opponentPlayer.futureUnits;
    }

    // Reconstruct flags array
    const flags: Array<IFlag> = [
      { x: 0, y: Math.floor(game.boardLength / 2), originX: 0, originY: Math.floor(game.boardLength / 2), inZone: false },
      { x: game.boardWidth - 1, y: Math.floor(game.boardLength / 2), originX: game.boardWidth - 1, originY: Math.floor(game.boardLength / 2), inZone: false },
    ];
    flags[playerNumber] = myPlayer.flag;
    flags[(playerNumber + 1) % 2] = opponentPlayer.flag;

    // Reconstruct ready array
    const ready = [true, true]; // Both always ready in active game

    // Find first living unit for selectedUnit
    let firstLivingUnitIndex = 0;
    for (let i = 0; i < game.unitsCount; i++) {
      if (myPlayer.units[i]?.life > 0) {
        firstLivingUnitIndex = i;
        break;
      }
    }

    // Restore state (skips all setup phases)
    this.setState(
      {
        // Identity
        isPlayer: playerNumber as 0 | 1,
        isAdmin,

        // Board config
        boardWidth: game.boardWidth,
        boardLength: game.boardLength,
        placementZone: game.placementZone,
        unitsCount: game.unitsCount,

        // Game state
        units,
        futureUnits,
        flags,
        ready,
        terrain: game.terrain || [],
        flagStayInPlace: game.flagStayInPlace ?? false,
        unitConfig: game.unitConfig || undefined,
        round: game.round,
        roomId: game.roomId || this.state.roomId,
        // If player has submitted moves (futureUnits populated), they're at confirmation phase (step = unitsCount)
        // Otherwise use the step from the database
        step: myPlayer.futureUnits !== null ? game.unitsCount : game.step,

        // Navigation state (skip intro/rooms/settings/placement)
        isInRoom: true,
        gameStarted: true,

        // Selected unit — deselect if player already submitted moves
        selectedUnit: myPlayer.futureUnits !== null
          ? { playerNumber: -1, unitNumber: -1 }
          : { playerNumber, unitNumber: firstLivingUnitIndex },

        // Restore transient state based on futureUnits presence
        // If a player has futureUnits, they've submitted moves and are waiting
        waitingForMoves: [
          myPlayer.futureUnits !== null,
          opponentPlayer.futureUnits !== null,
        ],
        bufferOpponentUnits: Array(game.unitsCount).fill(null),
        futureUnitsHistory: [],
        placedUnits: [
          Array(game.unitsCount).fill(true),
          Array(game.unitsCount).fill(true),
        ],

        // Clear syncing overlay
        isSyncing: false,
      },
      () => {
        console.log(
          `Reconnected to game at step ${this.state.step}, round ${this.state.round}`
        );
      }
    );
  };

  _handleReconnectError = (message: { error: string }) => {
    console.error("Reconnection failed:", message.error);

    // Clear invalid session token
    if (this.state.roomId) {
      localStorage.removeItem(`kombass_session_token_${this.state.roomId}`);
    }

    // Clear stale URL
    window.history.pushState({}, "", "/");

    // Reset to initial state
    this.setState({
      isSyncing: false,
      step: -5, // Back to intro screen
      isInRoom: false,
      gameStarted: false,
    });

    // Show error to user
    alert(`Reconnection failed: ${message.error}\n\nStarting a new game.`);
  };

  _handleOpponentReconnected = () => {
    if (socketService.socket) {
      gameService.onOpponentReconnected(socketService.socket, () => {
        console.log("Opponent reconnected to game");
      });
    }
  };

  componentDidMount() {
    UNITS.forEach((unit) => {
      unit.svg.forEach((url) => preloading(url));
    });
    Object.values(SPRITES).forEach((sprite) => {
      sprite.forEach((url) => preloading(url));
    });
    preloadAnimatedSprites();

    if (process.env.REACT_APP_TEST_MODE === "true") {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { loadScenario, scenarios } = require("./engine/scenarioLoader");
      (window as any).__KOMBASS_TEST_API__ = {
        loadScenario: (scenarioNameOrIndex: string | number) => {
          const scenario =
            typeof scenarioNameOrIndex === "number"
              ? scenarios[scenarioNameOrIndex]
              : scenarios.find((s: any) => s.name === scenarioNameOrIndex);
          if (!scenario) {
            console.error("Unknown scenario:", scenarioNameOrIndex);
            return;
          }
          const loaded = loadScenario(scenario);
          this.setState({
            units: loaded.units,
            futureUnits: loaded.futureUnits,
            flags: loaded.flags,
            unitsCount: loaded.unitsCount,
            isPlayer: loaded.isPlayer,
            step: loaded.step,
            gameStarted: true,
            ready: [true, true],
            isTestScenario: loaded.isTestScenario || false,
            flagStayInPlace: loaded.flagStayInPlace ?? false,
            terrain: loaded.terrain || [],
          });
        },
        getState: () => ({ ...this.state }),
        triggerCombat: () => this._calculateCombatResults(),
        setStep: (step: number) => this.setState({ step }),
        getScenarios: () => scenarios.map((s: any, i: number) => ({ index: i, name: s.name, description: s.description })),
        /**
         * Load a confirm-step scenario for testing undo/step-skip with dead units.
         * Sets up 3 units where unit 1 is dead. Starts at confirm step (step=unitsCount=3).
         * Units 0 and 2 have already "moved" (futureUnits populated).
         * Test: undo twice — second undo should skip dead unit 1 and go to unit 0.
         */
        loadUndoScenario: () => {
          const aliveUnit = (x: number, y: number) => ({
            x, y, strength: 2, range: 2, speed: 2, life: 2,
            hasFlag: false, unitType: 1,
          });
          const dead = {
            x: 5, y: 5, strength: 0, range: 0, speed: 0, life: -1,
            hasFlag: false, unitType: 1,
          };
          const units: IUnit[][] = [
            [aliveUnit(2, 2), dead, aliveUnit(8, 8)],
            [aliveUnit(18, 18), aliveUnit(17, 17), aliveUnit(16, 16)],
          ];
          // Units 0 and 2 have "moved" — unit 0 moved to (3,3), unit 2 moved to (9,9)
          const movedUnit0 = { ...aliveUnit(3, 3) };
          const movedUnit2 = { ...aliveUnit(9, 9) };
          const futureUnits: Array<Array<IUnit>> = [
            [movedUnit0, null as any, movedUnit2],
            Array(3).fill(null),
          ];
          // History: player's units snapshot after each move (unit 0, then unit 2)
          const futureUnitsHistory: Array<Array<IUnit>> = [
            [movedUnit0, null as any, null as any],  // after unit 0 moved
            [movedUnit0, null as any, movedUnit2],    // after unit 2 moved
          ];
          this.setState({
            units,
            futureUnits,
            futureUnitsHistory,
            flags: [
              { x: 0, y: 10, originX: 0, originY: 10, inZone: true },
              { x: 20, y: 10, originX: 20, originY: 10, inZone: true },
            ],
            unitsCount: 3,
            isPlayer: 0,
            step: 3,
            gameStarted: true,
            ready: [true, true],
            isTestScenario: true,
            boardLength: 21,
            boardWidth: 21,
            selectedUnit: { playerNumber: -1, unitNumber: -1 },
            round: 2,
          });
        },
      };

      // Auto-load scenario from sessionStorage if present
      const storedScenario = sessionStorage.getItem("KOMBASS_TEST_SCENARIO");
      if (storedScenario) {
        sessionStorage.removeItem("KOMBASS_TEST_SCENARIO");
        setTimeout(() => {
          (window as any).__KOMBASS_TEST_API__.loadScenario(storedScenario);
        }, 0);
      }

      const undoScenario = sessionStorage.getItem("KOMBASS_UNDO_SCENARIO");
      if (undoScenario) {
        sessionStorage.removeItem("KOMBASS_UNDO_SCENARIO");
        setTimeout(() => {
          (window as any).__KOMBASS_TEST_API__.loadUndoScenario();
        }, 0);
      }
    }

    // Check for room ID in URL
    const roomId = this.extractRoomIdFromUrl();
    if (roomId) {
      this.setState({ roomId });
      const sessionToken = localStorage.getItem(`kombass_session_token_${roomId}`);
      if (sessionToken) {
        // Reconnect to existing game
        this.reconnectToGame(sessionToken, roomId);
      } else {
        // New player joining room
        this.checkAndJoinRoom(roomId);
      }
    } else {
      // Fresh start at root (/) — no roomId means no game to reconnect to
      localStorage.removeItem('kombass_session_token'); // clear stale legacy token
      this.connectSocket();
    }
  }

  render() {
    // Render test harness if in test mode and on /test route
    if (process.env.REACT_APP_TEST_MODE === "true" && window.location.pathname === "/test") {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const TestHarness = require("./components/TestHarness").default;
      return <TestHarness />;
    }

    if (window.location.pathname === "/map-designer") {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const MapDesigner = require("./components/MapDesigner").default;
      return <MapDesigner />;
    }

    return (
      <GameContext.Provider value={this.state}>
        <div className="App">
          {/* Room message screen - blocks access when room is full or game has ended */}
          {this.state.roomMessage && (
            <div className="room-message-screen">
              <div className="room-message-content">
                <p>{this.state.roomMessage}</p>
                <button
                  className="button active"
                  onClick={() => window.location.assign("/")}
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}

          {/* Syncing overlay - blocks UI during reconnection */}
          {this.state.isSyncing && (
            <div className="syncing-overlay">
              <div className="syncing-modal">
                <h2>Reconnecting...</h2>
                <p>Restoring game state</p>
                <div className="spinner"></div>
              </div>
            </div>
          )}

          {/* Test scenario play button */}
          {this.state.isTestScenario && this.state.step === this.state.unitsCount && (
            <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 1000 }}>
              <button
                className="button active"
                onClick={() => this._applyMoves()}
                style={{ padding: "10px 20px", fontSize: "16px" }}
              >
                ▶ Play Combat
              </button>
            </div>
          )}

          {this.state.step === -5 ? (
            <IntroScreen />
          ) : this.state.step === -3 ? (
            <Settings _selectUnits={this._selectUnits} roomId={this.state.roomId} />
          ) : this.state.step === -2 ? (
            <UnitSelection _placeUnits={this._placeUnits} />
          ) : this.state.step === -1 ? (
            <UnitPlacement placedUnits={this.state.placedUnits} />
          ) : (
            <Game
              _changeStep={this._changeStep}
              flags={this.state.flags}
              players={this.state.players}
              ready={this.state.ready}
              selectedUnit={this.state.selectedUnit}
              step={this.state.step}
              units={this.state.units}
              unitsCount={this.state.unitsCount}
              round={this.state.round}
              playerNumber={this.state.isPlayer}
            />
          )}
          {this.state.step > -3 && <Chat />}
        </div>
      </GameContext.Provider>
    );
  }
}

export default App;
