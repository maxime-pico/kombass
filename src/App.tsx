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

function preloading(url: string) {
  var img = new Image();
  img.src = url;
}

interface AppProps {}

interface AppState {
  step: number;
  player: 0 | 1;
  players: IPlayers;
  boardWidth: number;
  boardLength: number;
  placementZone: number;
  unitsCount: number;
  units: Array<Array<IUnit>>;
  futureUnits: Array<Array<IUnit>>;
  futureUnitsHistory: Array<Array<Array<IUnit>>>;
  selectedUnit: ISelectedUnit;
  placedUnits: Array<Array<boolean>>;
  flags: Array<IFlag>;
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      step: -5,
      player: 0,
      players: [
        {
          name: "P1",
          color: "blue",
        },
        {
          name: "P2",
          color: "red",
        },
      ],
      boardWidth: 22,
      boardLength: 21,
      placementZone: 5,
      unitsCount: 5,
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
      futureUnits: Array(2).fill(Array(5).fill(null)),
      futureUnitsHistory: [],
      selectedUnit: {
        playerNumber: 0,
        unitNumber: 0,
      },
      placedUnits: Array(2).fill(Array(5).fill(false)),
      flags: [
        {
          x: 0,
          y: 10,
          inZone: true,
        },
        {
          x: 21,
          y: 10,
          inZone: true,
        },
      ],
    };

    this._joinRoom = this._joinRoom.bind(this);
    this._defineSettings = this._defineSettings.bind(this);
    this._setBoardSize = this._setBoardSize.bind(this);
    this._setPlacementZone = this._setPlacementZone.bind(this);
    this._setUnitCount = this._setUnitCount.bind(this);
    this._selectUnits = this._selectUnits.bind(this);
    this._changeStep = this._changeStep.bind(this);
    this._setSelectedUnit = this._setSelectedUnit.bind(this);
    this._placeUnits = this._placeUnits.bind(this);
    this._placeUnit = this._placeUnit.bind(this);
    this._startGame = this._startGame.bind(this);
    this._circleUnit = this._circleUnit.bind(this);
    this._circlePlayer = this._circlePlayer.bind(this);
    this._updateFlags = this._updateFlags.bind(this);
    this._undoMove = this._undoMove.bind(this);
    this._changePosition = this._changePosition.bind(this);
    this._applyMoves = this._applyMoves.bind(this);
  }

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

  _setBoardSize = ({
    length = this.state.boardLength,
    width = this.state.boardWidth,
  }: {
    length: number;
    width: number;
  }) => {
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

  _placeUnit = (
    playerNumber: number,
    unitNumber: number,
    col: number,
    row: number
  ) => {
    let units = this.state.units;
    let currentPlayerUnits = [...units[playerNumber]];
    let currentPlayerUnit = { ...currentPlayerUnits[unitNumber] };
    currentPlayerUnit = { ...currentPlayerUnit, x: col, y: row };
    currentPlayerUnits[unitNumber] = currentPlayerUnit;
    units[playerNumber] = currentPlayerUnits;

    let placedUnits = this.state.placedUnits;
    let currentPlayerPlacedUnits = [...placedUnits[playerNumber]];
    let playerPlacedUnits = currentPlayerPlacedUnits[unitNumber];
    playerPlacedUnits = true;
    currentPlayerPlacedUnits[unitNumber] = playerPlacedUnits;
    placedUnits[playerNumber] = currentPlayerPlacedUnits;

    let nextUnitNumber = (unitNumber + 1) % this.state.unitsCount;
    let nextPlayerNumber =
      playerNumber === 0 && unitNumber === this.state.unitsCount - 1
        ? playerNumber + 1
        : playerNumber;

    this._setSelectedUnit(nextPlayerNumber, nextUnitNumber, 0);

    this.setState({
      units: units,
      placedUnits: placedUnits,
      player: nextPlayerNumber % 2 === 0 ? 0 : 1,
    });

    if (playerNumber === 1 && unitNumber === this.state.unitsCount - 1) {
      this._startGame();
    }
  };

  _startGame = () => {
    this._setSelectedUnit(0, 0, 0);
    this.setState({
      step: 0,
    });
  };

  _changeStep = (step: number, direction: -1 | 1) => {
    var nextStep = (step + direction) % (this.state.unitsCount * 2 + 1);
    let selectedUnit = [];
    if (nextStep !== this.state.unitsCount * 2) {
      if (nextStep < this.state.unitsCount) {
        selectedUnit = [0, nextStep % this.state.unitsCount];
      } else {
        selectedUnit = [1, nextStep % this.state.unitsCount];
      }
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
    this.setState({
      step: nextStep,
    });
    return true;
  };

  _undoMove = () => {
    let futureUnits = [...this.state.futureUnits];
    let futureUnitsHistory = [...this.state.futureUnitsHistory];
    futureUnitsHistory.pop();
    futureUnits = futureUnitsHistory.length
      ? futureUnitsHistory[futureUnitsHistory.length - 1]
      : Array(2).fill(Array(this.state.unitsCount).fill(null));
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

  _changePosition = (
    playerNumber: number,
    unitNumber: number,
    x: number,
    y: number
  ) => {
    //if playerNumber = 0 -> just add to futureUnits and moves
    //if playerNumber = 1 -> check more
    const life = this.state.units[playerNumber][unitNumber].life;
    const strength = this.state.units[playerNumber][unitNumber].strength;
    let currentPlayerUnit = this.state.units[playerNumber][unitNumber];
    let futureUnits = [...this.state.futureUnits];
    let futurePlayerUnits = [...futureUnits[playerNumber]];
    let futurePlayerUnit = futurePlayerUnits[unitNumber];
    let opponentNumber = (playerNumber + 1) % 2;
    let futureOpponentUnits = [...futureUnits[opponentNumber]];
    let embuscade = false;
    let embuscadeBack = false;
    let damageTaken = 0;
    let flags = this.state.flags;

    if (playerNumber === 1) {
      futureOpponentUnits.forEach((opponentUnit, unit_index) => {
        if (this.state.units[opponentNumber][unit_index].life > 0) {
          let inFlagZone = false;
          let a = opponentUnit.x;
          let b = opponentUnit.y;
          let opponentStrength = opponentUnit.strength;
          if (opponentStrength === 1 && strength === 1) {
            embuscade = Math.abs(x - a) ** 2 + Math.abs(y - b) ** 2 <= 2;
            embuscadeBack = Math.abs(x - a) ** 2 + Math.abs(y - b) ** 2 <= 2;
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
              embuscade = Math.abs(x - a) + Math.abs(y - b) <= opponentStrength;
            }
          }
          flags.forEach((flag, flag_index) => {
            inFlagZone =
              inFlagZone ||
              Math.abs(x - flag.x) + Math.abs(y - flag.y) <= 3 ||
              Math.abs(a - flag.x) + Math.abs(b - flag.y) <= 3;
          });
          if (!inFlagZone) {
            if (embuscade) {
              console.log("EMBUSCADE!!");
              damageTaken = damageTaken + opponentStrength;
            }
            if (embuscadeBack) {
              console.log("EMBUSCADE BACK!!");
              let futureOpponentUnit = futureOpponentUnits[unit_index];
              futureOpponentUnit = {
                ...futureOpponentUnit,
                x: a,
                y: b,
                life: opponentUnit.life - strength,
              };
              futureOpponentUnits[unit_index] = futureOpponentUnit;
            }
          }
        }
      });
    }

    futurePlayerUnit = {
      ...currentPlayerUnit,
      x: x,
      y: y,
      life: life - damageTaken,
    };

    if (
      this.state.flags[opponentNumber].x === x &&
      this.state.flags[opponentNumber].y === y &&
      this.state.flags[opponentNumber].inZone &&
      life - damageTaken > 0
    ) {
      futurePlayerUnit = { ...futurePlayerUnit, hasFlag: true };
    }

    let futureUnitsArray = [];
    futurePlayerUnits[unitNumber] = futurePlayerUnit;
    futureUnitsArray[opponentNumber] = futureOpponentUnits;
    futureUnitsArray[playerNumber] = futurePlayerUnits;

    let futureUnitsHistory = [...this.state.futureUnitsHistory];
    futureUnitsHistory.push(futureUnitsArray);

    this.setState({
      futureUnits: futureUnitsArray,
      futureUnitsHistory: futureUnitsHistory,
    });
  };

  _applyMoves = () => {
    if (this.state.step === this.state.unitsCount * 2) {
      let units = [...this.state.units];
      const flags = this.state.flags;

      units.forEach((playerUnits, playerIndex) => {
        playerUnits.forEach((element, index) => {
          let hadFlag = element.hasFlag;
          let flag = flags[(playerIndex + 1) % 2];
          if (hadFlag && this.state.futureUnits[playerIndex][index].life < 1) {
            flag = { ...flags[(playerIndex + 1) % 2], inZone: true };
            flags[(playerIndex + 1) % 2] = flag;
            this._updateFlags(flags);
          }
          element.x =
            element.life > 0
              ? this.state.futureUnits[playerIndex][index].x
              : element.x;
          element.y =
            element.life > 0
              ? this.state.futureUnits[playerIndex][index].y
              : element.y;
          element.life =
            element.life > 0
              ? this.state.futureUnits[playerIndex][index].life
              : element.life;
          element.hasFlag =
            this.state.futureUnits[playerIndex][index] &&
            this.state.futureUnits[playerIndex][index].hasFlag &&
            element.life > 0;
          if (element.hasFlag) {
            flag = { ...flags[(playerIndex + 1) % 2], inZone: false };
            flags[(playerIndex + 1) % 2] = flag;
            this._updateFlags(flags);
          }
        });
      });

      this.setState({
        units: units,
        futureUnits: Array(2).fill(Array(this.state.unitsCount).fill({})),
        futureUnitsHistory: [],
      });
      window.dispatchEvent(new CustomEvent("boom"));
      this._changeStep(this.state.step, 1);
    }
  };

  componentDidMount() {
    UNITS.forEach((unit) => {
      unit.svg.forEach((url) => preloading(url));
    });
    Object.values(SPRITES).forEach((sprite) => {
      sprite.forEach((url) => preloading(url));
    });
  }

  render() {
    return (
      <div className="App">
        {this.state.step === -5 ? (
          <IntroScreen _defineSettings={this._defineSettings} />
        ) : this.state.step === -4 ? (
          <Rooms step={this.state.step} _changeStep={this._changeStep} />
        ) : this.state.step === -3 ? (
          <Settings
            boardLength={this.state.boardLength}
            boardWidth={this.state.boardWidth}
            _setBoardSize={this._setBoardSize}
            placementZone={this.state.placementZone}
            _setPlacementZone={this._setPlacementZone}
            unitsCount={this.state.unitsCount}
            _setUnitCount={this._setUnitCount}
            _selectUnits={this._selectUnits}
          />
        ) : this.state.step === -2 ? (
          <UnitSelection
            _placeUnits={this._placeUnits}
            units={this.state.units}
            _circleUnit={this._circleUnit}
            player={this.state.player}
            _circlePlayer={this._circlePlayer}
          />
        ) : this.state.step === -1 ? (
          <UnitPlacement
            units={this.state.units}
            placedUnits={this.state.placedUnits}
            flags={this.state.flags}
            selectedUnit={this.state.selectedUnit}
            _setSelectedUnit={this._setSelectedUnit}
            player={this.state.player}
            players={this.state.players}
            _placeUnit={this._placeUnit}
            step={this.state.step}
            boardLength={this.state.boardLength}
            boardWidth={this.state.boardWidth}
            placementZone={this.state.placementZone}
            unitsCount={this.state.unitsCount}
            futureUnits={this.state.futureUnits}
            _changeStep={this._changeStep}
            _changePosition={this._changePosition}
          />
        ) : (
          <Game
            boardLength={this.state.boardLength}
            boardWidth={this.state.boardWidth}
            placementZone={this.state.placementZone}
            units={this.state.units}
            step={this.state.step}
            players={this.state.players}
            _changeStep={this._changeStep}
            selectedUnit={this.state.selectedUnit}
            flags={this.state.flags}
            _updateFlags={this._updateFlags}
            _undoMove={this._undoMove}
            futureUnits={this.state.futureUnits}
            _changePosition={this._changePosition}
            _applyMoves={this._applyMoves}
            unitsCount={this.state.unitsCount}
            player={this.state.player}
            placedUnits={this.state.placedUnits}
            _placeUnit={this._placeUnit}
            _setSelectedUnit={this._setSelectedUnit}
          />
        )}
      </div>
    );
  }
}

export default App;
