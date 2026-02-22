import React, { Component } from "react";
import Board from "./Board";
import Panel from "./Panel";
import Modal from "./Modal";
import TeamPanel from "./TeamPanel";
import { IUnit, ISelectedUnit, IPlayers, IFlag } from "../App";
import socketService from "../services/socketService";
import gameService from "../services/gameService";

interface GameProps {
  units: Array<Array<IUnit>>;
  flags: Array<IFlag>;
  unitsCount: number;
  players: IPlayers;
  selectedUnit: ISelectedUnit;
  _changeStep: (step: number, direction: -1 | 1) => void;
  round: number;
  step: number;
  ready: Array<boolean>;
  playerNumber: 0 | 1;
}

interface GameStates {
  gameOver: string;
  shake: boolean;
  abandonConfirm: boolean;
  opponentAbandoned: number | null;
}

class Game extends Component<GameProps, GameStates> {
  constructor(props: GameProps) {
    super(props);
    this.state = {
      gameOver: "",
      shake: false,
      abandonConfirm: false,
      opponentAbandoned: null,
    };
    this._screenShake = this._screenShake.bind(this);
    this._confirmAbandon = this._confirmAbandon.bind(this);
  }

  componentDidMount() {
    if (socketService.socket) {
      gameService.onOpponentAbandoned(socketService.socket, ({ playerNumber }) => {
        this.setState({ opponentAbandoned: playerNumber });
      });
    }
  }

  componentWillUnmount() {
    if (socketService.socket) {
      socketService.socket.off("on_opponent_abandoned");
    }
  }

  _screenShake() {
    this.setState({
      shake: true,
    });
    setTimeout(() => {
      this.setState({ shake: false });
    }, 1000);
  }

  _confirmAbandon = () => {
    if (socketService.socket) {
      gameService.abandonGame(socketService.socket, this.props.playerNumber);
    }
    const match = window.location.pathname.match(/^\/game\/([a-z0-9]+)$/i);
    if (match) {
      localStorage.removeItem(`kombass_session_token_${match[1]}`);
    }
    window.location.assign("/");
  };

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
          unit?.life > 0 ? deadUnits[player_index] : deadUnits[player_index] + 1;
        let flagInZone =
          unit?.hasFlag &&
          unit?.life > 0 &&
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
        if (socketService.socket) {
          gameService.gameWin(socketService.socket, gameOver);
        }
      }, 1000);
    }
  }

  render() {
    if (!this.state.gameOver) {
      this._isGameOver();
    }

    if (
      this.props.selectedUnit.playerNumber !== -1 &&
      this.props.units[this.props.selectedUnit.playerNumber]?.[
        this.props.selectedUnit.unitNumber
      ]?.life < 1
    ) {
      this.props._changeStep(this.props.step, 1);
    }

    return (
      <div className="game-container">
        {this.state.gameOver && (
          <Modal
            title={"Game Over"}
            subtitle={this.state.gameOver}
            content={
              "Don't tell me you think war is cool and you want to play again..."
            }
            action={() => {
              const match = window.location.pathname.match(/^\/game\/([a-z0-9]+)$/i);
              if (match) {
                localStorage.removeItem(`kombass_session_token_${match[1]}`);
              }
              window.location.assign("/");
            }}
          />
        )}
        {!this.props.ready.reduce((a, b) => a && b) && (
          <Modal
            title=""
            subtitle={"Waiting for the other player to start the game"}
            content=""
            action={() => {}}
          />
        )}
        {this.state.opponentAbandoned !== null && (
          <Modal
            title="Victory by Default"
            subtitle={`Congratulations Sun Tzu, P${this.state.opponentAbandoned + 1} abandoned. It's a little boring but will do...`}
            content="The battlefield awaits your next conquest."
            buttonText="Continue World Domination"
            action={() => {
              const match = window.location.pathname.match(/^\/game\/([a-z0-9]+)$/i);
              if (match) localStorage.removeItem(`kombass_session_token_${match[1]}`);
              window.location.assign("/");
            }}
          />
        )}
        {this.state.abandonConfirm && (
          <div className="modal-container">
            <div className="modalComponent">
              <div className="title">Raising the White Flag?</div>
              <div className="subtitle">
                Are you sure you want to abandon? Only cowards do that...
              </div>
              <div className="abandon-confirm-buttons">
                <button className="button active" onClick={this._confirmAbandon}>
                  Abandon
                </button>
                <button
                  className="button"
                  onClick={() => this.setState({ abandonConfirm: false })}
                >
                  Keep Fighting
                </button>
              </div>
            </div>
          </div>
        )}
        <div className={`main${this.state.shake ? " fight" : ""}`}>
          <TeamPanel
            playerIndex={0}
            units={this.props.units[0]}
            selectedUnit={this.props.selectedUnit}
          />
          <Board _screenShake={this._screenShake} placement={false} />
          <TeamPanel
            playerIndex={1}
            units={this.props.units[1]}
            selectedUnit={this.props.selectedUnit}
          />
        </div>
        {!this.state.gameOver && this.state.opponentAbandoned === null && (
          <button
            className="abandon-button"
            onClick={() => this.setState({ abandonConfirm: true })}
          >
            Abandon
          </button>
        )}
        <Panel round={this.props.round} />
      </div>
    );
  }
}

export default Game;
