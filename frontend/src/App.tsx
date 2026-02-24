// import logo from './logo.svg';
import "./App.css";
import React, { Component } from "react";
import Chat from "./components/Chat";
import Settings from "./components/Settings";
import IntroScreen from "./components/IntroScreen";
import Game from "./components/Game";
import UnitSelection from "./components/UnitSelection";
import UnitPlacement from "./components/UnitPlacement";
import TestHarness from "./components/TestHarness";
import { UNITS, SPRITES, defaultUnitConfig, UnitConfig } from "./utilities/dict";
import socketService from "./services/socketService";
import GameContext, { dispatchCustomEvent, isCustomEvent } from "./gameContext";
import gameService from "./services/gameService";
import { calculateCombatResults } from "./engine";
import { buildAnimationQueue, buildBoomQueue } from "./engine/animationEngine";
import { loadScenario, scenarios } from "./engine/scenarioLoader";

export type IPlayer = 0 | 1;
export type IPlayers = Array<{ name: string; color: string }>;
export type IUnit = {
  strength: number;
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
export type IFlag = { x: number; y: number; inZone: boolean };

export type IGameSettings = {
  boardWidth: number;
  boardLength: number;
  placementZone: number;
  unitsCount: number;
  unitConfig?: UnitConfig;
};

export type IAnimationItem = {
  player: 0 | 1;
  unitIndex: number;
  unit: IUnit;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

export type IBoomEvent = {
  afterAnimationIndex: number;
  x: number;
  y: number;
};

export type IAnimationPhase = {
  isAnimating: boolean;
  currentAnimationIndex: number;
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
    y: number
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
  _setBoardSize: (length: number, width: number) => void;
  _setGameStarted: () => void;
  _setInRoom: () => void;
  _setIsAdmin: (isAdmin: boolean) => void;
  _setIsPlayer: (isPlayer: 0 | 1) => void;
  _setPlacementZone: (zoneSize: number) => void;
  _setUnitConfig: (unitConfig: UnitConfig) => void;
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
  unitConfig: UnitConfig;
  waitingForMoves: Array<boolean>;
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
      _setBoardSize: this._setBoardSize,
      _setGameStarted: this._setGameStarted,
      _setInRoom: this._setInRoom,
      _setIsAdmin: this._setIsAdmin,
      _setIsPlayer: this._setIsPlayer,
      _setPlacementZone: this._setPlacementZone,
      _setUnitConfig: this._setUnitConfig,
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
        { x: 0, y: 10, inZone: true },
        { x: 21, y: 10, inZone: true },
      ],
      futureUnits: [Array(5).fill(null), Array(5).fill(null)],
      futureUnitsHistory: [],
      gameStarted: false,
      isAdmin: true,
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
          speed: 3,
          x: 12,
          y: 6,
          life: 1,
          hasFlag: false,
          unitType: 0,
        })
      ),
      unitsCount: 5,
      unitConfig: defaultUnitConfig(),
      waitingForMoves: [false, false],
      animationPhase: {
        isAnimating: false,
        currentAnimationIndex: 0,
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
          speed: 3,
          x: 12,
          y: 6,
          life: 1,
          hasFlag: false,
          unitType: 0,
        })
      ),
      futureUnits: [Array(count).fill(null), Array(count).fill(null)],
      placedUnits: [Array(count).fill(false), Array(count).fill(false)],
      unitsCount: count,
    });
  };

  _setBoardSize = (length: number, width: number) => {
    this.setState({
      boardLength: length,
      boardWidth: width,
      flags: [
        {
          x: 0,
          y: Math.floor(length / 2),
          inZone: true,
        },
        {
          x: width - 1,
          y: Math.floor(length / 2),
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

  _setUnitConfig = (unitConfig: UnitConfig) => {
    console.log("[_setUnitConfig] Custom unit config set:", unitConfig);
    const unitNames = ["light", "medium", "heavy"] as const;
    const updatedUnits = this.state.units.map((playerUnits) =>
      playerUnits.map((unit) => {
        if (!unit) return unit;
        const unitName = unitNames[unit.unitType ?? 0] as keyof UnitConfig;
        const stats = unitConfig[unitName];
        return { ...unit, strength: stats.strength, speed: stats.speed, life: stats.life };
      })
    );
    this.setState({
      unitConfig: unitConfig,
      units: updatedUnits,
    });
  };

  _setWaitingForMoves = (ready: boolean, player: number) => {
    let waitingForMoves = [...this.state.waitingForMoves];
    waitingForMoves[player] = ready;
    this.setState({
      waitingForMoves: waitingForMoves,
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

    if (unitNumber === this.state.unitsCount - 1) {
      this._startGame();
    }
  };

  _startGame = () => {
    let player = this.state.isPlayer;
    // reset selected Unit
    this._setSelectedUnit(player, 0, 0);

    // set current player as ready and send info
    const ready = [...this.state.ready];
    ready[player] = true;
    if (socketService.socket) {
      gameService.setReady(socketService.socket, player, this.state.units, this.state.flags[player]);
    }
    this.setState({
      step: 0,
      ready: ready,
    });
  };

  _changeStep = (step: number, direction: -1 | 1) => {
    var nextStep = step;
    if (step < 0) {
      nextStep = step + direction;
    } else {
      nextStep = (step + direction) % (this.state.unitsCount + 1);
      let selectedUnit = [];
      if (nextStep !== this.state.unitsCount) {
        selectedUnit = [this.state.isPlayer, nextStep % this.state.unitsCount];
        if (this.state.units[selectedUnit[0]][selectedUnit[1]]?.life > 0) {
          this._setSelectedUnit(selectedUnit[0], selectedUnit[1], nextStep);
        } else {
          nextStep !== 0 &&
            direction !== -1 &&
            this._changeStep(nextStep, direction);
          return true;
        }
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
    y: number
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

    this.setState({
      futureUnits: futureUnitsArray,
      futureUnitsHistory: futureUnitsHistory,
    });
  };

  _buildAnimationQueue = (): Array<IAnimationItem> => {
    return buildAnimationQueue({
      units: this.state.units,
      futureUnits: this.state.futureUnits,
      flags: this.state.flags,
      isPlayer: this.state.isPlayer,
      unitsCount: this.state.unitsCount,
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

  _runAnimationSequence = async () => {
    const { queue, boomQueue } = this.state.animationPhase;

    console.log(`Starting animation sequence with ${queue.length} animations`);

    // Add delay to allow React to re-render and attach event listeners
    await new Promise((resolve) => setTimeout(resolve, 50));

    for (let i = 0; i < queue.length; i++) {
      const animation = queue[i];

      console.log(`Animating unit ${animation.unitIndex} of player ${animation.player} (${i + 1}/${queue.length})`);

      // Dispatch event for this unit to animate
      dispatchCustomEvent("animate_unit", {
        player: animation.player,
        unitIndex: animation.unitIndex,
        fromX: animation.fromX,
        fromY: animation.fromY,
        toX: animation.toX,
        toY: animation.toY,
      });

      // Wait for animation duration (500ms matches CSS transition)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if any booms should trigger after this animation
      const boomsToTrigger = boomQueue.filter(
        (boom) => boom.afterAnimationIndex === i
      );

      if (boomsToTrigger.length > 0) {
        console.log(`Triggering ${boomsToTrigger.length} boom(s) after animation ${i}`);
        for (const boom of boomsToTrigger) {
          dispatchCustomEvent("boom", { x: boom.x, y: boom.y });
        }

        // Wait for boom animations (1000ms)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // After boom, check which units are now dead and mark them
        if (this.combatResultsBuffer) {
          const newDeadUnits = new Set(this.state.animationPhase.deadUnits);
          const { newFutureUnits } = this.combatResultsBuffer;

          // Check all units at boom locations
          for (const boom of boomsToTrigger) {
            for (let player = 0; player < 2; player++) {
              for (let unitIdx = 0; unitIdx < this.state.unitsCount; unitIdx++) {
                const unit = newFutureUnits[player][unitIdx];
                // Check if unit is at boom location and is dead
                if (unit && unit.x === boom.x && unit.y === boom.y && unit.life <= 0) {
                  newDeadUnits.add(`${player}_${unitIdx}`);
                }
              }
            }
          }

          // Update dead units set
          this.setState({
            animationPhase: {
              ...this.state.animationPhase,
              deadUnits: newDeadUnits,
              currentAnimationIndex: i + 1,
            },
          });
        } else {
          // No combat results, just update progress
          this.setState({
            animationPhase: {
              ...this.state.animationPhase,
              currentAnimationIndex: i + 1,
            },
          });
        }
      } else {
        // No booms, just update progress
        this.setState({
          animationPhase: {
            ...this.state.animationPhase,
            currentAnimationIndex: i + 1,
          },
        });
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

    this.setState({
      units: results.newFutureUnits,
      futureUnits: [
        Array(this.state.unitsCount).fill(null),
        Array(this.state.unitsCount).fill(null),
      ],
      futureUnitsHistory: [],
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
        queue: [],
        boomQueue: [],
        deadUnits: new Set(),
      },
    });

    this._updateFlags(results.flags);

    // Persist combat results to database
    // Send both players' units and flags so either player can update both in the database
    if (socketService.socket) {
      gameService.finalizeCombat(
        socketService.socket,
        this.state.isPlayer,
        results.newFutureUnits,
        results.flags,
        this.state.round + 1,
        results.firstLivingUnitIndex
      );
    }

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

  // Upon receiving "player_ready" message, update ready state and opponent's units placement
  _handlePlayerReady = () => {
    if (socketService.socket) {
      gameService.onReady(socketService.socket, (message) => {
        const player = message.player;
        const ready = [...this.state.ready];
        const units = [...this.state.units];
        const opponentUnits = [...message.units[player]];
        units[player] = opponentUnits;
        ready[player] = true;
        this.setState({
          ready: ready,
          units: units,
        });
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

        this._setIsPlayer(options.player);
        this._setIsAdmin(options.admin);

        // Register opponent reconnection listener
        this._handleOpponentReconnected();
      });
    }
  };

  reconnectToGame = async (sessionToken: string) => {
    try {
      // Block UI during reconnection
      this.setState({ isSyncing: true });

      // Connect socket
      const backendUrl = process.env.REACT_APP_BACKEND_URL ?? "http://localhost:9000";
      const socket = await socketService.connect(backendUrl, "test");

      if (socket) {
        // Register listeners BEFORE emitting (prevent race condition)
        // Use socket.once to ensure handlers fire at most once
        socket.once("game_state_restored", this._handleGameStateRestored);
        socket.once("reconnect_error", this._handleReconnectError);

        // Emit reconnection request after listeners are ready
        socket.emit("reconnect_game", { sessionToken });
      }
    } catch (error) {
      console.error("Reconnection failed:", error);
      // Fall back to normal flow
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
      { x: 0, y: Math.floor(game.boardLength / 2), inZone: false },
      { x: game.boardWidth - 1, y: Math.floor(game.boardLength / 2), inZone: false },
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
        round: game.round,
        roomId: game.roomId || this.state.roomId,
        // If player has submitted moves (futureUnits populated), they're at confirmation phase (step = unitsCount)
        // Otherwise use the step from the database
        step: myPlayer.futureUnits !== null ? game.unitsCount : game.step,

        // Navigation state (skip intro/rooms/settings/placement)
        isInRoom: true,
        gameStarted: true,

        // Selected unit
        selectedUnit: {
          playerNumber,
          unitNumber: firstLivingUnitIndex,
        },

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

    if (process.env.REACT_APP_TEST_MODE === "true") {
      (window as any).__KOMBASS_TEST_API__ = {
        loadScenario: (scenarioNameOrIndex: string | number) => {
          const scenario =
            typeof scenarioNameOrIndex === "number"
              ? scenarios[scenarioNameOrIndex]
              : scenarios.find((s) => s.name === scenarioNameOrIndex);
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
          });
        },
        getState: () => ({ ...this.state }),
        triggerCombat: () => this._calculateCombatResults(),
        setStep: (step: number) => this.setState({ step }),
        getScenarios: () => scenarios.map((s, i) => ({ index: i, name: s.name, description: s.description })),
      };

      // Auto-load scenario from sessionStorage if present
      const storedScenario = sessionStorage.getItem("KOMBASS_TEST_SCENARIO");
      if (storedScenario) {
        sessionStorage.removeItem("KOMBASS_TEST_SCENARIO");
        setTimeout(() => {
          (window as any).__KOMBASS_TEST_API__.loadScenario(storedScenario);
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
        this.reconnectToGame(sessionToken);
      } else {
        // New player joining room
        this.checkAndJoinRoom(roomId);
      }
    } else {
      // Fresh start at root (/)
      const sessionToken = localStorage.getItem('kombass_session_token');
      if (sessionToken) {
        this.reconnectToGame(sessionToken);
      } else {
        this.connectSocket();
      }
    }
  }

  render() {
    // Render test harness if in test mode and on /test route
    if (process.env.REACT_APP_TEST_MODE === "true" && window.location.pathname === "/test") {
      return <TestHarness />;
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
            <Settings _selectUnits={this._selectUnits} />
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
