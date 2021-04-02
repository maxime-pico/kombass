// import logo from './logo.svg';
import React, { Component } from 'react'
import Board from './Board'
import Panel from './Panel'


class Game extends Component {
  constructor(props){
    super(props)
    this.state = {
      units: this.props.units,
      futureUnits: Array(2).fill(Array(5).fill(null)),
      movedUnits: Array(2).fill(Array(5).fill(false)),
    }

    this._changePosition = this._changePosition.bind(this);
    this._applyMoves = this._applyMoves.bind(this);
  }

  _hasItMoved(player, unit){
    return this.state.movedUnits[player][unit]
  }

  _movedUnit(player, unit){
    const movedUnits = [...this.state.movedUnits]
    let playerUnits = [...movedUnits[player]]
    playerUnits[unit] = true
    movedUnits[player] = playerUnits
    this.setState({
      movedUnits: movedUnits,
    })
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
        if (opponentUnit.life > 0){
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
              futureOpponentUnit = { ...futureOpponentUnit, x: a, y: b, life: (this.props.units[opponentNumber][unit_index].life - strength)}
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
    
    this._movedUnit(playerNumber, unitNumber)  

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
          if (this._hasItMoved(playerIndex, index)) {
            element.x = this.state.futureUnits[playerIndex][index].x
            element.y = this.state.futureUnits[playerIndex][index].y
            element.life = this.state.futureUnits[playerIndex][index].life
            element.strength = this.state.futureUnits[playerIndex][index].strength
            element.hasFlag = this.state.futureUnits[playerIndex][index].hasFlag && element.life > 0
            if (element.hasFlag) {
              flag = { ...flags[(playerIndex+1)%2], inZone: false }
              flags[(playerIndex+1)%2] = flag
              this.props._updateFlags(flags)
            }
          }
        });
      })
      
      this.setState({
        units: units,
        futureUnits: Array(2).fill(Array(5).fill({})),
        movedUnits: Array(2).fill(Array(5).fill(false)),
      })

      this.props._changeStep(this.props.step)
    }
  }

  render(){

    if((this.props.selectedUnit.playerNumber !== -1) && this.props.units[this.props.selectedUnit.playerNumber][this.props.selectedUnit.unitNumber].life < 1){
      this.props._changeStep(this.props.step)
    }

    return (
      <div className="main">
        <Board
          players={this.props.players}
          units={this.props.units}
          futureUnits={this.state.futureUnits}
          _nextTurn={this.props._nextTurn}
          turn={this.props.turn}
          step={this.props.step}
          _changeStep={this.props._changeStep}
          _changePosition={this._changePosition}
          selectedUnit={this.props.selectedUnit}
          _setSelectedUnit={this.props._setSelectedUnit}
          flags={this.props.flags}
        />
        <Panel
          futureMove={this.futureMove}
          step={this.props.step}
          _changeStep={this.props._changeStep}
          _applyMoves={this._applyMoves}
        />
      </div>
    );
  }
}

export default Game;
