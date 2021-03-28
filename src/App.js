// import logo from './logo.svg';
import './App.css';
import React, { Component } from 'react'
import Board from './components/Board'
import InfoBar from './components/InfoBar'
import Panel from './components/Panel'


class App extends Component {
  constructor(props){
    super(props)
    this.state = {
      turn: 0,
      step: 0,
      players:[
        {
          name: 'P1',
          color: 'blue',
        },
        {
          name: 'P2',
          color: 'red',
        },
      ],
      units: [
        [
          {
            strength: 1, speed: 3, x: 2, y: 3, life: 1, hasFlag: false,
          },
          {
            strength: 1, speed: 3, x: 2, y: 7, life: 1, hasFlag: false,
          },
          {
            strength: 1, speed: 3, x: 2, y: 18, life: 1, hasFlag: false,
          },
          {
            strength: 2, speed: 2, x: 2, y: 14, life: 2, hasFlag: false,
          },
          {
            strength: 3, speed: 1, x: 4, y: 10, life: 3, hasFlag: false,
          },
        ],
        [
          {
            strength: 1, speed: 3, x: 23, y: 3, life: 1, hasFlag: false,
          },
          {
            strength: 1, speed: 3, x: 23, y: 7, life: 1, hasFlag: false,
          },
          {
            strength: 1, speed: 3, x: 23, y: 17, life: 1, hasFlag: false,
          },
          {
            strength: 2, speed: 2, x: 23, y: 14, life: 2, hasFlag: false,
          },
          {
            strength: 3, speed: 1, x: 21, y: 10, life: 3, hasFlag: false,
          },
        ]
      ],
      selectedUnit: {
        playerNumber: 0,
        unitNumber: 0,
      },
      futureUnits: Array(2).fill(Array(5).fill(null)),
      movedUnits: Array(2).fill(Array(5).fill(false)),
      flags: [
        {
          x: 0,
          y: 10,
          inZone: true,
        },
        {
          x: 25,
          y: 10,
          inZone: true,
        },
      ]
    }
    this._nextTurn = this._nextTurn.bind(this);
    this._changeStep = this._changeStep.bind(this);
    this._changePosition = this._changePosition.bind(this);
    this._applyMoves = this._applyMoves.bind(this);
    this._setSelectedUnit = this._setSelectedUnit.bind(this);
  }

  _changeStep(step){
    var nextStep = (step + 1) % 11
    if (nextStep !== 10 ){
      if (nextStep < 5 ){
        this._setSelectedUnit(0,(nextStep % 5), nextStep)
      }
      else {
        this._setSelectedUnit(1,(nextStep % 5), nextStep)
      }
    }
    else{
      let selectedUnit = { playerNumber: -1, unitNumber: -1 }
      this.setState({
        selectedUnit: selectedUnit,
      })
    }
    this.setState({
      step: nextStep
    })
  }

  _setSelectedUnit(playerNumber, unitNumber, step){
    this.setState({
      selectedUnit: {
        playerNumber: playerNumber,
        unitNumber: unitNumber,
      }
    })
  }

  _nextTurn(turn){
    this.setState({
      turn: turn + 1,
    })
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
    const life = this.state.units[playerNumber][unitNumber].life
    const strength = this.state.units[playerNumber][unitNumber].strength
    let currentPlayerUnit = this.state.units[playerNumber][unitNumber]
    let futureUnits = [...this.state.futureUnits]
    let futurePlayerUnits = [...futureUnits[playerNumber]]
    let futurePlayerUnit = futurePlayerUnits[unitNumber]
    let opponentNumber = (playerNumber + 1) % 2
    let futureOpponentUnits = [...futureUnits[opponentNumber]]
    let embuscade = false
    let embuscadeBack = false
    let damageTaken = 0
    let inFlagZone = false
    let flags = this.state.flags

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
              futureOpponentUnit = { ...futureOpponentUnit, x: a, y: b, life: (this.state.units[opponentNumber][unit_index].life - strength)}
              futureOpponentUnits[unit_index] = futureOpponentUnit
            }
          }
        }
      })
    }

    futurePlayerUnit = { ...currentPlayerUnit, x: x, y: y, life: (life - damageTaken) }

    if (this.state.flags[opponentNumber].x === x && this.state.flags[opponentNumber].y === y && this.state.flags[opponentNumber].inZone && ((life-damageTaken)>0)){
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
    if (this.state.step === 10){
      let units = [...this.state.units]
      const flags = this.state.flags

      units.forEach((playerUnits, playerIndex) => {
        playerUnits.forEach((element, index) => {
          let hadFlag = element.hasFlag
          let flag = flags[(playerIndex+1)%2]
          if (hadFlag && this.state.futureUnits[playerIndex][index].life < 1) {
            flag = { ...flags[(playerIndex+1)%2], inZone: true }
            flags[(playerIndex+1)%2] = flag
            this.setState({
              flags: flags
            })
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
              this.setState({
                flags: flags
              })
            }
          }
        });
      })
      
      this.setState({
        units: units,
        futureUnits: Array(2).fill(Array(5).fill({})),
        movedUnits: Array(2).fill(Array(5).fill(false)),
      })

      this._changeStep(this.state.step)
    }
  }

  render(){

    if((this.state.selectedUnit.playerNumber !== -1) && this.state.units[this.state.selectedUnit.playerNumber][this.state.selectedUnit.unitNumber].life < 1){
      this._changeStep(this.state.step)
    }

    return (
      <div className="App">
        <header className="infobar">
          <InfoBar players={this.state.players} turn={this.state.turn} step={this.state.step} />
        </header>
        <div className="main">
          <Board
            players={this.state.players}
            units={this.state.units}
            futureUnits={this.state.futureUnits}
            _nextTurn={this._nextTurn}
            turn={this.state.turn}
            step={this.state.step}
            _changeStep={this._changeStep}
            _changePosition={this._changePosition}
            selectedUnit={this.state.selectedUnit}
            _setSelectedUnit={this._setSelectedUnit}
            flags={this.state.flags}
          />
          <Panel
            futureMove={this.futureMove}
            step={this.state.step}
            _changeStep={this._changeStep}
            _applyMoves={this._applyMoves}
          />
        </div>
      </div>
    );
  }
}

export default App;
