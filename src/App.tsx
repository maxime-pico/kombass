// import logo from './logo.svg';
import "./App.css";
import React, { Component } from "react";
import Settings from "./components/Settings";
import IntroScreen from "./components/IntroScreen";
import Game from "./components/Game";
import UnitSelection from "./components/UnitSelection";
import UnitPlacement from "./components/UnitPlacement";
import Rooms from "./components/Rooms";
import { UNITS, SPRITES } from "./utilities/dict";
import socketService from "./services/socketService";
import GameContext, { dispatchCustomEvent, isCustomEvent } from "./gameContext";
import gameService from "./services/gameService";

export type IPlayer = 0 | 1;
export type IPlayers = Array<{ name: string; color: string }>;
export type IUnit = {
  strength: number;
  speed: number;
  x: number;
  y: number;
  life: number;
  hasFlag: boolean;
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
  _placeUnit: (unitNumber: number, col: number, row: number) => void;
  _setBoardSize: (length: number, width: number) => void;
  _setGameStarted: () => void;
  _setInRoom: () => void;
  _setIsAdmin: (isAdmin: boolean) => void;
  _setIsPlayer: (isPlayer: 0 | 1) => void;
  _setPlacementZone: (zoneSize: number) => void;
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
  selectedUnit: ISelectedUnit;
  step: number;
  units: Array<Array<IUnit>>;
  unitsCount: number;
  waitingForMoves: Array<boolean>;
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
      _placeUnit: this._placeUnit,
      _setBoardSize: this._setBoardSize,
      _setGameStarted: this._setGameStarted,
      _setInRoom: this._setInRoom,
      _setIsAdmin: this._setIsAdmin,
      _setIsPlayer: this._setIsPlayer,
      _setPlacementZone: this._setPlacementZone,
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
      futureUnits: Array(2).fill(Array(5).fill(null)),
      futureUnitsHistory: [],
      gameStarted: false,
      isAdmin: true,
      isInRoom: false,
      isPlayer: 0,
      placedUnits: Array(2).fill(Array(5).fill(false)),
      placementZone: 5,
      player: 0,
      players: [
        { name: "P1", color: "blue" },
        { name: "P2", color: "red" },
      ],
      ready: [false, false],
      round: 0,
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
        })
      ),
      unitsCount: 5,
      waitingForMoves: [false, false],
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
  }

  connectSocket = async () => {
    const socket = await socketService
      .connect("https://kombass-server.herokuapp.com/")
      .catch((e: string) => console.log("Error on connect: ", e));
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
        })
      ),
      futureUnits: Array(2).fill(Array(count).fill(null)),
      placedUnits: Array(2).fill(Array(count).fill(false)),
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
    currentPlayerUnit = {
      ...currentPlayerUnit,
      strength: UNITS[newIndex].strength,
      speed: UNITS[newIndex].speed,
      life: UNITS[newIndex].life,
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
      gameService.setReady(socketService.socket, player, this.state.units);
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
        if (this.state.units[selectedUnit[0]][selectedUnit[1]].life > 0) {
          this._setSelectedUnit(selectedUnit[0], selectedUnit[1], nextStep);
        } else {
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
    const life = this.state.units[playerNumber][unitNumber].life;
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

  _applyMoves = async () => {
    // first check the results of the fights
    if (this.state.step === this.state.unitsCount) {
      let futureUnits = [...this.state.futureUnits];
      let myFutureUnits = [...futureUnits[this.state.isPlayer]];
      let opponentNumber = (this.state.isPlayer + 1) % 2;
      let futureOpponentUnits = [...futureUnits[opponentNumber]];
      let flags = [...this.state.flags];
      myFutureUnits.forEach((myUnit, my_unit_index) => {
        // for each of my units
        let life = myUnit.life;
        let strength = myUnit.strength;
        let embuscade = false;
        let embuscadeBack = false;
        let damageTaken = 0;
        let x = myUnit.x;
        let y = myUnit.y;
        // Go throught the opponent's units and see if there is a potential fight with current moved unit
        futureOpponentUnits.forEach((opponentUnit, unit_index) => {
          // Only consider living units at beginning of turn
          if (this.state.units[opponentNumber][unit_index]?.life > 0) {
            let inFlagZone = false;
            let a = opponentUnit.x;
            let b = opponentUnit.y;
            let opponentStrength = opponentUnit.strength;
            // Handle special case where one or two of the units is a light unit and has different range
            // TODO: There might be a more sexy way to handle that if tree
            if (opponentStrength === 1 && strength === 1) {
              embuscadeBack = Math.abs(x - a) ** 2 + Math.abs(y - b) ** 2 <= 2; // check if we put the opponent's unit in danger
              embuscade = Math.abs(x - a) ** 2 + Math.abs(y - b) ** 2 <= 2; // always make sure of the opposite too
            } else {
              if (strength === 1) {
                embuscadeBack =
                  Math.abs(x - a) ** 2 + Math.abs(y - b) ** 2 <= strength ** 2;
              } else {
                embuscadeBack = Math.abs(x - a) + Math.abs(y - b) <= strength;
              }
              if (opponentStrength === 1) {
                embuscade =
                  Math.abs(x - a) ** 2 + Math.abs(y - b) ** 2 <=
                  opponentStrength ** 2;
              } else {
                embuscade =
                  Math.abs(x - a) + Math.abs(y - b) <= opponentStrength;
              }
            }

            // Now check if any of the units is in a flag zone, as they would then be invincible
            flags.forEach((flag, flag_index) => {
              inFlagZone =
                inFlagZone ||
                Math.abs(x - flag.x) + Math.abs(y - flag.y) <= 3 ||
                Math.abs(a - flag.x) + Math.abs(b - flag.y) <= 3;
            });

            // if that is not the case, then process damages
            if (!inFlagZone) {
              // for the opposing unit
              if (embuscadeBack) {
                console.log("EMBUSCADE BACK!!");
                opponentUnit = {
                  ...opponentUnit,
                  x: a,
                  y: b,
                  life: opponentUnit.life - strength,
                };
                futureOpponentUnits[unit_index] = opponentUnit;
                dispatchCustomEvent("boom", { x: a, y: b });
              }
              // as well as for our own unit
              if (embuscade) {
                console.log("EMBUSCADE!!");
                damageTaken = damageTaken + opponentStrength;
                dispatchCustomEvent("boom", { x: x, y: y });
              }
            }
          } else {
            opponentUnit = { ...this.state.units[opponentNumber][unit_index] };
            futureOpponentUnits[unit_index] = opponentUnit;
          }
        });
        // Build the updated information to send it to the state
        myUnit = {
          ...myUnit,
          life: life - damageTaken,
        };
        myFutureUnits[my_unit_index] = myUnit;
      });

      // make sure no units end up missing
      this.state.units[this.state.isPlayer].forEach((myUnit, myUnit_index) => {
        if (myUnit?.life < 1) myFutureUnits[myUnit_index] = myUnit;
        if (myUnit === null)
          myFutureUnits[myUnit_index] = {
            x: -1,
            y: -1,
            life: -1,
            strength: 0,
            speed: 0,
            hasFlag: false,
          };
      });

      // log new units positions
      let newFutureUnits: Array<Array<IUnit>> = [];
      newFutureUnits[this.state.isPlayer] = myFutureUnits;
      newFutureUnits[opponentNumber] = futureOpponentUnits;

      // check how to update flags as a result
      this.state.units.forEach((playerUnits, playerIndex) => {
        playerUnits.forEach((element, index) => {
          let hadFlag = element.hasFlag;
          let opponentFlag = flags[(playerIndex + 1) % 2];
          if (hadFlag && newFutureUnits[playerIndex][index]?.life < 1) {
            opponentFlag = { ...flags[(playerIndex + 1) % 2], inZone: true };
            flags[(playerIndex + 1) % 2] = opponentFlag;
          } else if (
            !hadFlag &&
            newFutureUnits[playerIndex][index].hasFlag &&
            newFutureUnits[playerIndex][index].life > 0
          ) {
            opponentFlag = { ...flags[(playerIndex + 1) % 2], inZone: false };
            flags[(playerIndex + 1) % 2] = opponentFlag;
          }
        });
      });

      this._updateFlags(flags);

      this.setState({
        units: newFutureUnits,
        futureUnits: Array(2).fill(Array(this.state.unitsCount).fill({})),
        futureUnitsHistory: [],
        waitingForMoves: [false, false],
        round: this.state.round + 1,
      });

      this._changeStep(this.state.step, 1);
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

  componentDidMount() {
    UNITS.forEach((unit) => {
      unit.svg.forEach((url) => preloading(url));
    });
    Object.values(SPRITES).forEach((sprite) => {
      sprite.forEach((url) => preloading(url));
    });
    this.connectSocket();
    this._handlePlayerReady();
  }

  render() {
    return (
      <GameContext.Provider value={this.state}>
        <div className="App">
          {this.state.step === -5 ? (
            <IntroScreen />
          ) : this.state.step === -4 ? (
            <Rooms />
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
            />
          )}
        </div>
      </GameContext.Provider>
    );
  }
}

export default App;
