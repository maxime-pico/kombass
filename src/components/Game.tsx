// import logo from './logo.svg';
import React, { Component } from "react";
import Board from "./Board";
import Panel from "./Panel";
import GameOver from "./GameOver";
import TeamPanel from "./TeamPanel";
import { IUnit, ISelectedUnit, IPlayers, IFlag } from "../App";

interface GameProps {
  units: Array<Array<IUnit>>;
  flags: Array<IFlag>;
  unitsCount: number;
  players: IPlayers;
  selectedUnit: ISelectedUnit;
  _changeStep: (step: number, direction: -1 | 1) => void;
  boardLength: number;
  boardWidth: number;
  placementZone: number;
  futureUnits: Array<Array<IUnit>>;
  step: number;
  _changePosition: (
    playerNumber: number,
    unitNumber: number,
    x: number,
    y: number
  ) => void;
  _applyMoves: () => void;
  _undoMove: () => void;
  _updateFlags: (newFlags: Array<IFlag>) => void;
  player: 0 | 1;
  placedUnits: Array<Array<boolean>>;
  _placeUnit: (
    playerNumber: number,
    unitNumber: number,
    col: number,
    row: number
  ) => void;
  _setSelectedUnit: (
    playerNumber: number,
    unitNumber: number,
    step: number
  ) => void;
}

interface GameStates {
  gameOver: string;
  shake: boolean;
}

class Game extends Component<GameProps, GameStates> {
  constructor(props: GameProps) {
    super(props);
    this.state = {
      gameOver: "",
      shake: false,
    };
    this._screenShake = this._screenShake.bind(this);
  }

  _screenShake() {
    this.setState({
      shake: true,
    });
    setTimeout(() => {
      this.setState({ shake: false });
    }, 1000);
  }

  _isGameOver() {
    const units = this.props.units;
    const flags = this.props.flags;
    let deadUnits = [0, 0];
    let isFlagInZone = [false, false];
    let gameOver = "";
    let winner = null;
    let loser = null;

    units.forEach((player, player_index) => {
      let ownFlag = flags[player_index];
      units[player_index].forEach((unit, unit_index) => {
        deadUnits[player_index] =
          unit.life > 0 ? deadUnits[player_index] : deadUnits[player_index] + 1;
        let flagInZone =
          unit.hasFlag &&
          unit.life > 0 &&
          Math.abs(unit.x - ownFlag.x) + Math.abs(unit.y - ownFlag.y) <= 3;
        isFlagInZone[player_index] = isFlagInZone[player_index] || flagInZone;
      });
    });

    if (
      isFlagInZone[0] ||
      isFlagInZone[1] ||
      deadUnits[0] > this.props.unitsCount - 1 ||
      deadUnits[1] > this.props.unitsCount - 1
    ) {
      if (isFlagInZone[0] && isFlagInZone[1]) {
        gameOver =
          "Good job fuckers, you both did it at the same time, now what?";
      } else {
        if (isFlagInZone[0] || isFlagInZone[1]) {
          winner = isFlagInZone[0] ? 0 : 1;
          loser = Math.abs(1 - winner);
          gameOver = `${this.props.players[winner].name} won! Suck it ${this.props.players[loser].name}...`;
        }
      }
      if (
        deadUnits[0] > this.props.unitsCount - 1 &&
        deadUnits[1] > this.props.unitsCount - 1
      ) {
        gameOver =
          'Oh wow, you guys anihilated each other! Nice! Who\'s going to "save the world" now???';
      } else {
        if (
          deadUnits[0] > this.props.unitsCount - 1 ||
          deadUnits[1] > this.props.unitsCount - 1
        ) {
          winner = deadUnits[0] ? 1 : 0;
          loser = Math.abs(1 - winner);
          gameOver = `${this.props.players[winner].name} destroyed ${this.props.players[loser].name}!! Time for some "democratic elections"`;
        }
      }
      window.setTimeout(() => {
        this.setState({
          gameOver: gameOver,
        });
      }, 1000);
    }
  }

  render() {
    if (!this.state.gameOver) {
      this._isGameOver();
    }

    if (
      this.props.selectedUnit.playerNumber !== -1 &&
      this.props.units[this.props.selectedUnit.playerNumber][
        this.props.selectedUnit.unitNumber
      ].life < 1
    ) {
      this.props._changeStep(this.props.step, 1);
    }

    return (
      <div className="game-container">
        {this.state.gameOver ? (
          <GameOver gameOver={this.state.gameOver} />
        ) : null}
        <div className={`main${this.state.shake ? " fight" : ""}`}>
          <TeamPanel
            playerIndex={0}
            units={this.props.units[0]}
            selectedUnit={this.props.selectedUnit}
          />
          <Board
            boardLength={this.props.boardLength}
            boardWidth={this.props.boardWidth}
            placementZone={this.props.placementZone}
            players={this.props.players}
            units={this.props.units}
            futureUnits={this.props.futureUnits}
            step={this.props.step}
            _changeStep={this.props._changeStep}
            _changePosition={this.props._changePosition}
            selectedUnit={this.props.selectedUnit}
            flags={this.props.flags}
            _screenShake={this._screenShake}
            unitsCount={this.props.unitsCount}
            player={this.props.player}
            placedUnits={this.props.placedUnits}
            placement={false}
            _placeUnit={this.props._placeUnit}
            _setSelectedUnit={this.props._setSelectedUnit}
          />
          <TeamPanel
            playerIndex={1}
            units={this.props.units[1]}
            selectedUnit={this.props.selectedUnit}
          />
        </div>
        <Panel
          step={this.props.step}
          _applyMoves={this.props._applyMoves}
          _undoMove={this.props._undoMove}
          unitsCount={this.props.unitsCount}
        />
      </div>
    );
  }
}

export default Game;
