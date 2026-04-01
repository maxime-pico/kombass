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
import TestHarness from "./components/TestHarness";
import MapDesigner from "./components/MapDesigner";
import { UNITS, SPRITES, defaultUnitConfig } from "./utilities/dict";
import socketService from "./services/socketService";
import GameContext, { dispatchCustomEvent, isCustomEvent } from "./gameContext";
import gameService from "./services/gameService";
import { calculateCombatResults } from "./engine";
import { gamePost, gameGet } from "./services/api";
import { extractRoomIdFromUrl, connectSocket as connectSocketAsync, checkAndJoinRoom as checkAndJoinRoomAsync, createAndJoinRoom as createAndJoinRoomAsync } from "./engine/roomManager";
import { buildReconnectionState, buildRestoredState } from "./engine/reconnectionManager";
import { buildFinalCombatState } from "./engine/combatOrchestrator";
import { buildUnitCountState, buildBoardSizeState } from "./engine/gameSetup";
// testApi is dynamically imported in componentDidMount when VITE_TEST_MODE is set
import { buildAnimationQueue, buildBoomQueue } from "./engine/animationEngine";
import { findNextAliveStep } from "./engine/stepLogic";
import { changePosition as computeChangePosition, undoMove as computeUndoMove } from "./engine/movementEngine";
import { placeUnit as computePlaceUnit } from "./engine/placementEngine";
import type { IUnit, IFlag, IGameSettings, IPlayer, IPlayers, ISelectedUnit, IAnimationItem, IBoomEvent, AnimationSubPhase, IAnimationPhase, UnitConfig } from "./types";

function preloading(url: string) {
  var img = new Image();
  img.src = url;
}

interface AppProps {}

interface AppState {
  applyBufferedMoves: () => void;
  applyMoves: () => Promise<any>;
  changeStep: (step: number, direction: -1 | 1) => void;
  changePosition: (
    playerNumber: number,
    unitNumber: number,
    x: number,
    y: number,
    path?: Array<{ x: number; y: number }>
  ) => void;
  circlePlayer: () => void;
  circleUnit: (
    playerIndex: number,
    unitIndex: number,
    currentType: number,
    direction: number
  ) => void;
  createRoom: () => Promise<void>;
  placeUnit: (unitNumber: number, col: number, row: number) => void;
  startGame: () => Promise<void>;
  setBoardSize: (length: number, width: number, customFlags?: Array<IFlag>) => void;
  setGameStarted: () => void;
  setInRoom: () => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setPlayerIndex: (playerIndex: 0 | 1) => void;
  setPlacementZone: (zoneSize: number) => void;
  setTerrain: (terrain: Array<{ x: number; y: number }>) => void;
  setFlags: (flags: Array<IFlag>) => void;
  setUnitConfig: (unitConfig: UnitConfig) => void;
  setFlagStayInPlace: (flagStayInPlace: boolean) => void;
  setSelectedUnit: (
    playerNumber: number,
    unitNumber: number,
    step: number
  ) => void;
  setUnitCount: (unitCount: number) => void;
  setWaitingForMoves: (ready: boolean, player: number) => void;
  undoMove: () => void;
  updateBufferOpponentUnits: (bufferOpponentUnits: Array<IUnit>) => void;
  updateMovesListener: (update: {
    units: Array<IUnit>;
    round: number;
  }) => void;
  updateOpponentUnits: (opponentsFutureunits: Array<IUnit>) => void;
  onWaitingForMoves: (e: Event) => void;
  boardLength: number;
  boardWidth: number;
  bufferOpponentUnits: Array<IUnit>;
  flags: Array<IFlag>;
  futureUnits: Array<Array<IUnit>>;
  futureUnitsHistory: Array<Array<IUnit>>;
  gameStarted: boolean;
  isAdmin: boolean;
  isInRoom: boolean;
  playerIndex: 0 | 1;
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
  animSpeed: number;
  toggleAnimSpeed: () => void;
  isSyncing: boolean;
  isTestScenario: boolean;
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      applyBufferedMoves: this.applyBufferedMoves,
      changeStep: this.changeStep,
      changePosition: this.changePosition,
      circlePlayer: this.circlePlayer,
      circleUnit: this.circleUnit,
      createRoom: this.createAndJoinRoom,
      placeUnit: this.placeUnit,
      startGame: this.startGame,
      setBoardSize: this.setBoardSize,
      setGameStarted: this.setGameStarted,
      setInRoom: this.setInRoom,
      setIsAdmin: this.setIsAdmin,
      setPlayerIndex: this.setPlayerIndex,
      setPlacementZone: this.setPlacementZone,
      setTerrain: this.setTerrain,
      setFlags: this.setFlags,
      setUnitConfig: this.setUnitConfig,
      setFlagStayInPlace: this.setFlagStayInPlace,
      setSelectedUnit: this.setSelectedUnit,
      setUnitCount: this.setUnitCount,
      setWaitingForMoves: this.setWaitingForMoves,
      undoMove: this.undoMove,
      applyMoves: this.applyMoves,
      updateBufferOpponentUnits: this.updateBufferOpponentUnits,
      updateMovesListener: this.updateMovesListener,
      updateOpponentUnits: this.updateOpponentUnits,
      onWaitingForMoves: this.waitingForMoves,
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
      playerIndex: 0,
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
      animSpeed: 1,
      toggleAnimSpeed: this._toggleAnimSpeed,
      isSyncing: false,
      isTestScenario: false,
    };

    this.applyBufferedMoves = this.applyBufferedMoves.bind(this);
    this.applyMoves = this.applyMoves.bind(this);
    this.changePosition = this.changePosition.bind(this);
    this.changeStep = this.changeStep.bind(this);
    this.circlePlayer = this.circlePlayer.bind(this);
    this.circleUnit = this.circleUnit.bind(this);
    this._defineSettings = this._defineSettings.bind(this);
    this._joinRoom = this._joinRoom.bind(this);
    this.placeUnit = this.placeUnit.bind(this);
    this._placeUnits = this._placeUnits.bind(this);
    this.selectUnits = this.selectUnits.bind(this);
    this.setBoardSize = this.setBoardSize.bind(this);
    this.setGameStarted = this.setGameStarted.bind(this);
    this.setInRoom = this.setInRoom.bind(this);
    this.setIsAdmin = this.setIsAdmin.bind(this);
    this.setPlayerIndex = this.setPlayerIndex.bind(this);
    this.setPlacementZone = this.setPlacementZone.bind(this);
    this.setTerrain = this.setTerrain.bind(this);
    this.setFlags = this.setFlags.bind(this);
    this.setUnitConfig = this.setUnitConfig.bind(this);
    this.setSelectedUnit = this.setSelectedUnit.bind(this);
    this.setUnitCount = this.setUnitCount.bind(this);
    this.startGame = this.startGame.bind(this);
    this.undoMove = this.undoMove.bind(this);
    this.updateBufferOpponentUnits =
      this.updateBufferOpponentUnits.bind(this);
    this.updateMovesListener = this.updateMovesListener.bind(this);
    this._updateFlags = this._updateFlags.bind(this);
    this.setWaitingForMoves = this.setWaitingForMoves.bind(this);
    this.updateOpponentUnits = this.updateOpponentUnits.bind(this);
    this.waitingForMoves = this.waitingForMoves.bind(this);
    this.reconnectToGame = this.reconnectToGame.bind(this);
    this._handleGameStateRestored = this._handleGameStateRestored.bind(this);
    this._handleReconnectError = this._handleReconnectError.bind(this);
    this.createAndJoinRoom = this.createAndJoinRoom.bind(this);
    this.checkAndJoinRoom = this.checkAndJoinRoom.bind(this);
    this.extractRoomIdFromUrl = this.extractRoomIdFromUrl.bind(this);
  }

  connectSocket = async () => {
    const connected = await connectSocketAsync();
    if (connected) {
      this._handlePlayerReady();
      this._handleGameStart();
    }
  };

  extractRoomIdFromUrl = (): string | null => {
    return extractRoomIdFromUrl();
  };

  checkAndJoinRoom = async (roomId: string) => {
    const result = await checkAndJoinRoomAsync(roomId);
    if (!result.ok) {
      this.setState({ roomMessage: result.message });
      return;
    }
    await this.connectSocket();
    if (socketService.socket) {
      socketService.socket.emit("authenticate", { sessionToken: result.sessionToken });
      this.setInRoom();
      this.setIsAdmin(false);
      this.setPlayerIndex(1);
      this.setState({ step: -3, roomMessage: "" });
    }
  };

  createAndJoinRoom = async () => {
    const result = await createAndJoinRoomAsync();
    if (!result.ok) {
      alert(result.message);
      return;
    }
    this.setState({ roomId: result.roomId });
    await this.connectSocket();
    if (socketService.socket) {
      socketService.socket.emit("authenticate", { sessionToken: result.sessionToken });
      this.setInRoom();
      this.setIsAdmin(true);
      this.setPlayerIndex(0);
      this.setState({ step: -3, roomMessage: "" });
    }
  };

  setInRoom = () => {
    this.setState({
      isInRoom: true,
    });
  };

  setIsAdmin = (isAdmin: boolean) => {
    this.setState({
      isAdmin: isAdmin,
    });
  };

  setPlayerIndex = (playerIndex: 0 | 1) => {
    this.setState({
      playerIndex: playerIndex,
      selectedUnit: {
        playerNumber: playerIndex,
        unitNumber: 0,
      },
    });
  };

  setGameStarted = () => {
    this.setState({
      gameStarted: true,
    });
  };

  setUnitCount = (count: number) => {
    this.setState(buildUnitCountState(count));
  };

  setBoardSize = (length: number, width: number, customFlags?: Array<IFlag>) => {
    this.setState(buildBoardSizeState(length, width, customFlags));
  };

  setPlacementZone = (width: number) => {
    this.setState({
      placementZone: width,
    });
  };

  setTerrain = (terrain: Array<{ x: number; y: number }>) => {
    this.setState({ terrain });
  };

  setFlags = (flags: Array<IFlag>) => {
    this.setState({ flags });
  };

  setUnitConfig = (unitConfig: UnitConfig) => {
    console.log("[setUnitConfig] Custom unit config set:", unitConfig);
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

  setFlagStayInPlace = (flagStayInPlace: boolean) => {
    this.setState({ flagStayInPlace });
  };

  setWaitingForMoves = (ready: boolean, player: number) => {
    this.setState((prevState) => {
      const waitingForMoves = [...prevState.waitingForMoves];
      waitingForMoves[player] = ready;
      return { waitingForMoves };
    });
  };

  updateOpponentUnits = (opponentsFutureunits: Array<IUnit>) => {
    let futureUnits = [...this.state.futureUnits];
    futureUnits[(this.state.playerIndex + 1) % 2] = opponentsFutureunits;
    this.setState({
      futureUnits: futureUnits,
      bufferOpponentUnits: Array(5).fill(null),
    });
  };

  updateBufferOpponentUnits = (bufferOpponentUnits: Array<IUnit>) => {
    this.setState({
      bufferOpponentUnits: [...bufferOpponentUnits],
    });
  };

  waitingForMoves = (e: Event) => {
    if (!isCustomEvent(e)) throw new Error("not a custom event");
    // e is now narrowed to CustomEvent ...
    this.updateOpponentUnits(e.detail.units);
    this.setWaitingForMoves(true, (this.state.playerIndex + 1) % 2);
  };

  applyBufferedMoves = () => {
    if (this.state.bufferOpponentUnits.filter((unit) => unit !== null).length) {
      dispatchCustomEvent("ready_for_moves", {
        units: this.state.bufferOpponentUnits,
      });
    }
  };

  updateMovesListener = (update: { units: Array<IUnit>; round: number }) => {
    if (this.state.round + 1 > update.round) {
      this.updateOpponentUnits(update.units);
      this.setWaitingForMoves(true, (this.state.playerIndex + 1) % 2);
    } else {
      this.updateBufferOpponentUnits(update.units);
      document.addEventListener("ready_for_moves", this.waitingForMoves);
    }
  };

  circleUnit = (
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
    console.log(`[circleUnit] Player ${playerIndex}, Unit ${unitIndex}: changing to ${unitName}`, unitStats);
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

  circlePlayer = () => {
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

  selectUnits = () => {
    this.setState({
      step: -2,
    });
  };

  setSelectedUnit = (
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
  placeUnit = (unitNumber: number, col: number, row: number) => {
    const { units, placedUnits, nextUnitNumber } = computePlaceUnit({
      units: this.state.units,
      placedUnits: this.state.placedUnits,
      playerIndex: this.state.playerIndex,
      unitNumber,
      col,
      row,
      unitsCount: this.state.unitsCount,
    });

    this.setSelectedUnit(this.state.playerIndex, nextUnitNumber, 0);
    this.setState({ units, placedUnits });
  };

  startGame = async () => {
    const player = this.state.playerIndex;
    this.setSelectedUnit(player, 0, 0);

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

  changeStep = (step: number, direction: -1 | 1) => {
    var nextStep = step;
    if (step < 0) {
      nextStep = step + direction;
    } else {
      const unitLives = this.state.units[this.state.playerIndex].map(u => u?.life ?? 0);
      nextStep = findNextAliveStep(step, direction, unitLives, this.state.unitsCount);
      if (nextStep !== this.state.unitsCount) {
        this.setSelectedUnit(this.state.playerIndex, nextStep, nextStep);
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

  undoMove = () => {
    const result = computeUndoMove({
      futureUnits: this.state.futureUnits,
      futureUnitsHistory: this.state.futureUnitsHistory,
      unitsCount: this.state.unitsCount,
      playerIndex: this.state.playerIndex,
    });

    this.setState({
      futureUnits: result.futureUnits,
      futureUnitsHistory: result.futureUnitsHistory,
      movementPaths: result.movementPaths,
    });
    this.changeStep(this.state.step, -1);
  };

  _updateFlags = (newFlags: Array<IFlag>) => {
    this.setState({
      flags: newFlags,
    });
  };

  // Registers where the user has decided to move its unit
  changePosition = (
    playerNumber: number,
    unitNumber: number,
    x: number,
    y: number,
    path?: Array<{ x: number; y: number }>
  ) => {
    const result = computeChangePosition({
      units: this.state.units,
      futureUnits: this.state.futureUnits,
      futureUnitsHistory: this.state.futureUnitsHistory,
      movementPaths: this.state.movementPaths,
      flags: this.state.flags,
      playerNumber,
      unitNumber,
      x,
      y,
      path,
    });

    this.setState({
      futureUnits: result.futureUnits,
      futureUnitsHistory: result.futureUnitsHistory,
      movementPaths: result.movementPaths,
    });
  };

  _calculateCombatResults = () => {
    console.log(`=== COMBAT CALC END (Player ${this.state.playerIndex}, Round ${this.state.round}) ===`);
    const result = calculateCombatResults({
      units: this.state.units,
      futureUnits: this.state.futureUnits,
      flags: this.state.flags,
      playerIndex: this.state.playerIndex,
      unitsCount: this.state.unitsCount,
      flagStayInPlace: this.state.flagStayInPlace,
    });
    console.log("newFutureUnits (result):", JSON.stringify(result.newFutureUnits));
    return result;
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
    await this._delay(50);

    for (let i = 0; i < queue.length; i++) {
      const animation = queue[i];

      console.log(`Animating unit ${animation.unitIndex} of player ${animation.player} (${i + 1}/${queue.length})`);

      // Pre-move: brief flash of danger zone at origin position
      this._setAnimationSubPhase('pre-move');
      await this._delay(300);

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
      await this._delay(animDuration);

      // Post-move: show danger zone at destination + scan animation
      this._setAnimationSubPhase('scanning');
      await this._delay(1000);

      // Check if any booms should trigger after this animation
      const boomsToTrigger = boomQueue.filter(
        (boom) => boom.afterAnimationIndex === i
      );

      if (boomsToTrigger.length > 0) {
        // Targeting: flash enemy squares in range
        this._setAnimationSubPhase('targeting');
        await this._delay(600);

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
        await this._delay(1600);

        // Raise animation on units at boom locations after embuscade message
        dispatchCustomEvent("embuscade_raise", { locations: boomLocations, units: unitsAtBooms });
        await this._delay(800);

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
        await this._delay(1000);

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

  _animSpeed = 1;

  _toggleAnimSpeed = () => {
    this._animSpeed = this._animSpeed === 1 ? 0.5 : 1;
    document.documentElement.style.setProperty('--anim-speed', String(this._animSpeed));
    this.setState({ animSpeed: this._animSpeed });
  };

  _delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms * this._animSpeed));

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

    console.log(`=== FINALIZING COMBAT (Player ${this.state.playerIndex}, Round ${this.state.round}) ===`);
    console.log("Combat result flags:", JSON.stringify(results.flags));
    console.log("Combat result units hasFlag:", results.newFutureUnits.map((pu: any[], pi: number) =>
      pu.map((u: any, ui: number) => `P${pi}U${ui}: hasFlag=${u?.hasFlag}, life=${u?.life}`)
    ));

    const stateUpdate = buildFinalCombatState(results, {
      unitsCount: this.state.unitsCount,
      playerIndex: this.state.playerIndex,
      round: this.state.round,
    });
    this.setState(stateUpdate);

    this.combatResultsBuffer = null;

    // Reset animation speed
    this._animSpeed = 1;
    document.documentElement.style.setProperty('--anim-speed', '1');
    this.setState({ animSpeed: 1 });

    console.log(`=== COMBAT FINALIZED (Player ${this.state.playerIndex}, Round ${this.state.round + 1}) ===`);
  };

  applyMoves = async () => {
    // first check the results of the fights
    if (this.state.step === this.state.unitsCount) {
      console.log(`=== COMBAT START (Player ${this.state.playerIndex}, Round ${this.state.round}) ===`);

      // Build animation queue
      const animationQueue = buildAnimationQueue({
        units: this.state.units,
        futureUnits: this.state.futureUnits,
        flags: this.state.flags,
        playerIndex: this.state.playerIndex,
        unitsCount: this.state.unitsCount,
      }, {
        movementPaths: this.state.movementPaths,
        terrain: this.state.terrain,
        boardWidth: this.state.boardWidth,
        boardLength: this.state.boardLength,
      });
      const boomQueue = buildBoomQueue(
        {
          units: this.state.units,
          futureUnits: this.state.futureUnits,
          flags: this.state.flags,
          playerIndex: this.state.playerIndex,
          unitsCount: this.state.unitsCount,
        },
        animationQueue
      );

      // [LOCATION D] Log queue sizes (test mode only)
      if (import.meta.env.VITE_TEST_MODE === "true") {
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
            const opponent = ((this.state.playerIndex + 1) % 2) as 0 | 1;
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
        this.setPlayerIndex(options.player);
        this.setIsAdmin(options.admin);

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
      await connectSocketAsync();
      if (socketService.socket) {
        socketService.socket.emit("authenticate", { sessionToken });
      }

      const stateUpdate = buildReconnectionState(data);

      this.setState(
        stateUpdate,
        () => {
          console.log(
            `Reconnected to game at step ${this.state.step}, round ${this.state.round}`
          );
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
    const stateUpdate = buildRestoredState(message, this.state.roomId);
    this.setState(
      stateUpdate,
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

    if (import.meta.env.VITE_TEST_MODE === "true") {
      import("./engine/testApi").then(({ setupTestApi }) => {
        setupTestApi(
          (s: any) => this.setState(s),
          () => this.state,
          () => this._calculateCombatResults(),
        );
      });
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
    if (import.meta.env.VITE_TEST_MODE === "true" && window.location.pathname === "/test") {
      return <TestHarness />;
    }

    if (window.location.pathname === "/map-designer") {
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
                onClick={() => this.applyMoves()}
                style={{ padding: "10px 20px", fontSize: "16px" }}
              >
                ▶ Play Combat
              </button>
            </div>
          )}

          {this.state.step === -5 ? (
            <IntroScreen />
          ) : this.state.step === -3 ? (
            <Settings selectUnits={this.selectUnits} roomId={this.state.roomId} />
          ) : this.state.step === -2 ? (
            <UnitSelection _placeUnits={this._placeUnits} />
          ) : this.state.step === -1 ? (
            <UnitPlacement placedUnits={this.state.placedUnits} />
          ) : (
            <Game
              changeStep={this.changeStep}
              flags={this.state.flags}
              players={this.state.players}
              ready={this.state.ready}
              selectedUnit={this.state.selectedUnit}
              step={this.state.step}
              units={this.state.units}
              unitsCount={this.state.unitsCount}
              round={this.state.round}
              playerNumber={this.state.playerIndex}
            />
          )}
          {this.state.step > -3 && <Chat />}
        </div>
      </GameContext.Provider>
    );
  }
}

export default App;
