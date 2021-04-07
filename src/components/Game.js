// import logo from './logo.svg';
import React, { Component } from 'react'
import Board from './Board'
import Panel from './Panel'
import GameOver from './GameOver'
import TeamPanel from './TeamPanel'


class Game extends Component {
  constructor(props){
    super(props)
    this.state = {
      gameOver: false,
      shake: false,
    }
    this._screenShake = this._screenShake.bind(this);
  }

  _screenShake(){
    this.setState({
      shake: true
    })
    setTimeout(() => {
      this.setState({shake: false})
    }, 1000);
  }

  _isGameOver(){
    const units = this.props.units
    const flags = this.props.flags
    let deadUnits = [0, 0]
    let isFlagInZone = [false, false]
    let gameOver = false

    units.forEach((player, player_index) => {
      let ownFlag = flags[player_index]
      units[player_index].forEach((unit, unit_index) => {
        deadUnits[player_index] = unit.life > 0 ? deadUnits[player_index] : deadUnits[player_index] + 1
        let flagInZone = unit.hasFlag && unit.life > 0 && ((Math.abs(unit.x - ownFlag.x) + Math.abs(unit.y - ownFlag.y) <= 3))
        isFlagInZone[player_index] =  isFlagInZone[player_index] || flagInZone 
      })
    })

    if(isFlagInZone[0] || isFlagInZone[1] || deadUnits[0] > 4 || deadUnits[1] > 4){
      if(isFlagInZone[0] && isFlagInZone[1]){
        gameOver = 'Good job fuckers, you both did it at the same time, now what?'
      }
      else{
        if(isFlagInZone[0] || isFlagInZone[1]){
          let winner = isFlagInZone[0] ? 0 : 1
          gameOver = `${this.props.players[winner].name} won! Suck it ${this.props.players[winner].name}...`
        }
      }
      if(deadUnits[0] > 4 && deadUnits[1] > 4){
        gameOver = 'Oh wow, you guys anihilated each other! Nice! Who\'s going to "save the world" now???'
      } else{
        if(deadUnits[0] > 4 || deadUnits[1] > 4){
          let winner = deadUnits[0] ? 0 : 1
          gameOver = `${this.props.players[winner].name} destroyed ${this.props.players[winner].name}!! Time for some "democratic elections"`
        }
      }
      window.setTimeout(()=>{this.setState({
        gameOver: gameOver,
      })}, 1000)
    }
  }

  render(){

    if (!this.state.gameOver){
      this._isGameOver()
    }

    if((this.props.selectedUnit.playerNumber !== -1) && this.props.units[this.props.selectedUnit.playerNumber][this.props.selectedUnit.unitNumber].life < 1){
      this.props._changeStep(this.props.step)
    }

    return (
      <div>
        { this.state.gameOver ? <GameOver gameOver={this.state.gameOver} /> : null}
        <div className={`main${this.state.shake ? ' fight' : ''}`}>
          <TeamPanel
            playerIndex={0}
            units={this.props.units[0]}
            selectedUnit={this.props.selectedUnit}
          />
          <Board
            players={this.props.players}
            units={this.props.units}
            futureUnits={this.props.futureUnits}
            step={this.props.step}
            _changeStep={this.props._changeStep}
            _changePosition={this.props._changePosition}
            selectedUnit={this.props.selectedUnit}
            _setSelectedUnit={this.props._setSelectedUnit}
            flags={this.props.flags}
            _screenShake={this._screenShake}
          />
          <TeamPanel
            playerIndex={1}
            units={this.props.units[1]}
            selectedUnit={this.props.selectedUnit}
          />
        </div>
        <Panel
          futureMove={this.futureMove}
          step={this.props.step}
          selectedUnit={this.props.selectedUnit}
          _changeStep={this.props._changeStep}
          _applyMoves={this.props._applyMoves}
          _undoMove={this.props._undoMove}
          _setSelectedUnit={this.props._setSelectedUnit}
        />
      </div>
    );
  }
}

export default Game;
