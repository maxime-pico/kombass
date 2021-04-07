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
      futureUnits: Array(2).fill(Array(5).fill(null)),
      gameOver: false,
      shake: false,
    }

    this._changePosition = this._changePosition.bind(this);
    this._applyMoves = this._applyMoves.bind(this);
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
  
  _changePosition(playerNumber, unitNumber, x, y){
    //if playerNumber = 0 -> just add to futureUnits and moves
    //if playerNumber = 1 -> check more
    const life = this.props.units[playerNumber][unitNumber].life
    const strength = this.props.units[playerNumber][unitNumber].strength
    let currentPlayerUnit = this.props.units[playerNumber][unitNumber]
    let futureUnits = [...this.state.futureUnits]
    let futurePlayerUnits = [...futureUnits[playerNumber]]
    let futurePlayerUnit = futurePlayerUnits[unitNumber]
    let opponentNumber = (playerNumber + 1) % 2
    let futureOpponentUnits = [...futureUnits[opponentNumber]]
    let embuscade = false
    let embuscadeBack = false
    let damageTaken = 0
    let inFlagZone = false
    let flags = this.props.flags

    if (playerNumber === 1){
      futureOpponentUnits.forEach((opponentUnit, unit_index) => {
        if (this.props.units[opponentNumber][unit_index].life > 0){
          let a = opponentUnit.x
          let b = opponentUnit.y
          let opponentStrength = opponentUnit.strength
          embuscade = (Math.abs(x - a) + Math.abs(y - b) <= opponentStrength)
          embuscadeBack = (Math.abs(x - a) + Math.abs(y - b) <= strength)
          flags.forEach((flag, flag_index) => {
            inFlagZone = inFlagZone || (Math.abs(x - flag.x) + Math.abs(y - flag.y) <= 3) || (Math.abs(a - flag.x) + Math.abs(b - flag.y) <= 3)
          })
          if (!inFlagZone){
            if (embuscade){
              console.log('EMBUSCADE!!')
              damageTaken = damageTaken + opponentStrength
            }
            if (embuscadeBack){
              console.log('EMBUSCADE BACK!!')
              let futureOpponentUnit = futureOpponentUnits[unit_index]
              futureOpponentUnit = { ...futureOpponentUnit, x: a, y: b, life: (opponentUnit.life - strength)}
              futureOpponentUnits[unit_index] = futureOpponentUnit
            }
          }
        }
      })
    }

    futurePlayerUnit = { ...currentPlayerUnit, x: x, y: y, life: (life - damageTaken) }

    if (this.props.flags[opponentNumber].x === x && this.props.flags[opponentNumber].y === y && this.props.flags[opponentNumber].inZone && ((life-damageTaken)>0)){
      futurePlayerUnit = {...futurePlayerUnit, hasFlag: true}
    }
    

    let futureUnitsArray = [null, null]
    futurePlayerUnits[unitNumber] = futurePlayerUnit
    futureUnitsArray[opponentNumber] = futureOpponentUnits
    futureUnitsArray[playerNumber] = futurePlayerUnits

    this.setState({
      futureUnits: futureUnitsArray,
    })
  }

  _applyMoves(){
    if (this.props.step === 10){
      let units = [...this.props.units]
      const flags = this.props.flags

      units.forEach((playerUnits, playerIndex) => {
        playerUnits.forEach((element, index) => {
          let hadFlag = element.hasFlag
          let flag = flags[(playerIndex+1)%2]
          if (hadFlag && this.state.futureUnits[playerIndex][index].life < 1) {
            flag = { ...flags[(playerIndex+1)%2], inZone: true }
            flags[(playerIndex+1)%2] = flag
            this.props._updateFlags(flags)
          }
          element.x = element.life > 0 ? this.state.futureUnits[playerIndex][index].x : element.x
          element.y = element.life > 0 ? this.state.futureUnits[playerIndex][index].y : element.y
          element.life = element.life > 0 ? this.state.futureUnits[playerIndex][index].life : element.life
          element.hasFlag = this.state.futureUnits[playerIndex][index] && this.state.futureUnits[playerIndex][index].hasFlag && element.life > 0
          if (element.hasFlag) {
            flag = { ...flags[(playerIndex+1)%2], inZone: false }
            flags[(playerIndex+1)%2] = flag
            this.props._updateFlags(flags)
          }
        });
      })
      
      this.setState({
        units: units,
        futureUnits: Array(2).fill(Array(5).fill({})),
      })
      window.dispatchEvent(new CustomEvent("boom"))
      this.props._changeStep(this.props.step)
    }
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
            futureUnits={this.state.futureUnits}
            step={this.props.step}
            _changeStep={this.props._changeStep}
            _changePosition={this._changePosition}
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
          _applyMoves={this._applyMoves}
          _undoMove={this.props._undoMove}
          _setSelectedUnit={this.props._setSelectedUnit}
        />
      </div>
    );
  }
}

export default Game;
