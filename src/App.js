// import logo from './logo.svg';
import './App.css';
import React, { Component } from 'react'
import InfoBar from './components/InfoBar'
import Game from './components/Game'
import UnitSelection from './components/UnitSelection'
import {UNITS} from './utilities/dict'

class App extends Component {
  constructor(props){
    super(props)
    this.state = {
      turn: 0,
      step: -1,
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
    }

    this._nextTurn = this._nextTurn.bind(this);
    this._changeStep = this._changeStep.bind(this);
    this._setSelectedUnit = this._setSelectedUnit.bind(this);
    this._startGame = this._startGame.bind(this);
    this._circleUnit = this._circleUnit.bind(this);

  }

  _circleUnit(playerIndex, unitIndex, currentType, direction){
    let units = this.state.units
    let currentPlayerUnits = [...units[playerIndex]]
    let currentPlayerUnit = currentPlayerUnits[unitIndex]
    let newIndex = currentType === 0 && direction === -1 ? 2 : (currentType + direction) % 3
    currentPlayerUnit = { ...currentPlayerUnit,
        strength: UNITS[newIndex].strength,
        speed: UNITS[newIndex].speed,
        life: UNITS[newIndex].life,
      }
    currentPlayerUnits[unitIndex] = currentPlayerUnit
    units[playerIndex] = currentPlayerUnits
    this.setState({
      units: units
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

  _startGame(){
    this.setState({
      step: 0,
    })
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

  _nextTurn(turn){
    this.setState({
      turn: turn + 1,
    })
  }

  render(){

    return (
      <div className="App">
        <header className="infobar">
          <InfoBar players={this.state.players} turn={this.state.turn} step={this.state.step} />
        </header>
        { this.state.step === -1 ?
          <UnitSelection
            step={this.state.step}
            _startGame={this._startGame}
            units={this.state.units}
            _circleUnit={this._circleUnit}
          /> :
          <Game
            units={this.state.units}
            turn={this.state.turn}
            step={this.state.step}
            players={this.state.players}
            _changeStep={this._changeStep}
            _nextTurn={this._nextTurn}
            selectedUnit={this.state.selectedUnit}
            _setSelectedUnit={this._setSelectedUnit}
          />
        }
      </div>
    );
  }
}

export default App;
