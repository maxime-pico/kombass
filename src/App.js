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
            strengh: 1, speed: 3, x: 2, y: 3, life: 1, hasFlag: false,
          },
          {
            strengh: 3, speed: 1, x: 2, y: 7, life: 3, hasFlag: false,
          },
          {
            strengh: 3, speed: 1, x: 2, y: 10, life: 3, hasFlag: false,
          },
          {
            strengh: 3, speed: 1, x: 2, y: 14, life: 3, hasFlag: false,
          },
          {
            strengh: 3, speed: 1, x: 2, y: 18, life: 3, hasFlag: false,
          },
        ],
        [
          {
            strengh: 2, speed: 2, x: 29, y: 3, life: 2, hasFlag: false,
          },
          {
            strengh: 2, speed: 2, x: 29, y: 7, life: 2, hasFlag: false,
          },
          {
            strengh: 2, speed: 2, x: 29, y: 11, life: 2, hasFlag: false,
          },
          {
            strengh: 2, speed: 2, x: 29, y: 14, life: 2, hasFlag: false,
          },
          {
            strengh: 2, speed: 2, x: 29, y: 17, life: 2, hasFlag: false,
          },
        ]
      ],
      selectedUnit: {
        playerNumber: 0,
        unitNumber: 0,
      },
      futureMove: Array(21).fill(Array(32).fill(null)),
      futureUnits: Array(2).fill(Array(5).fill({})),
      movedUnits: Array(2).fill(Array(5).fill(false)),
      flags: [
        {
          x: 1,
          y: 10,
        },
        {
          x: 31,
          y: 10,
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
    const nextStep = (step + 1) % 11
    if (nextStep !== 10 ){
      if (nextStep < 5 ){this._setSelectedUnit(0,(nextStep % 5))}
      else {this._setSelectedUnit(1,(nextStep % 5))}
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

  _setSelectedUnit(playerNumber, unitNumber){
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
    const life = this.state.units[playerNumber][unitNumber].life
    let futureUnits = [...this.state.futureUnits]
    let futurePlayerUnits = [...futureUnits[playerNumber]]
    let futurePlayerUnit = futurePlayerUnits[unitNumber]
    let opponentNumber = (playerNumber + 1) % 2
    let futureOpponentUnits = [...futureUnits[opponentNumber]]
    const futureMove = [...this.state.futureMove]


    if(futureMove[y][x]){
      let futureOpponentUnit = [...futureOpponentUnits[futureMove[y][x].unitNumber]]
      if(futureMove[y][x].life < life){
        console.log('case 1')
        futurePlayerUnit = {...futurePlayerUnit, x: x, y: y, life: (life-futureMove[y][x].life)}
        this._movedUnit(playerNumber, unitNumber)
        futureOpponentUnit = {...futureOpponentUnit, x: x, y: y, life: 0}
      } else {
        if(futureMove[y][x].life === life){
          console.log('case 2')
          futurePlayerUnit = {...futurePlayerUnit, x: x, y: y, life: 0}
        } else{
          console.log('case 3')
          futureOpponentUnit = { x: x, y: y, life: (this.state.units[opponentNumber][unitNumber].life - life)}
        }
      }
      futureOpponentUnits[futureMove[y][x].unitNumber] = futureOpponentUnit
    } else {
      console.log('case 0')
      let futureMoveRow = [...futureMove[y]]
      let futureMoveElement = futureMoveRow[x]
      futureMoveElement = {
        playerNumber: playerNumber,
        unitNumber: unitNumber,
        life: life,
      }
      futureMoveRow[x] = futureMoveElement
      futureMove[y] = futureMoveRow

      if (this.state.flags[opponentNumber].x === x && this.state.flags[opponentNumber].y === y){
        futurePlayerUnit = { ...futurePlayerUnit, x: x, y: y, life: life, hasFlag: true }
      }
      else{ 
        futurePlayerUnit = { ...futurePlayerUnit, x: x, y: y, life: life }
      }
      this._movedUnit(playerNumber, unitNumber)
      
    }

    let futureUnitsArray = [null, null]
    futurePlayerUnits[unitNumber] = futurePlayerUnit
    futureUnitsArray[opponentNumber] = futureOpponentUnits
    futureUnitsArray[playerNumber] = futurePlayerUnits

    this.setState({
      futureMove: [...futureMove],
      futureUnits: futureUnitsArray,
    })
  }

  _applyMoves(){
    if (this.state.step === 10){
      let units = [...this.state.units]
      let unitsP1 = [...units[0]]
      let unitsP2 = [...units[1]]
      const flags = this.state.flags

      unitsP1.forEach((element, index) => {
        if (this._hasItMoved(0, index)) {
          element.x = this.state.futureUnits[0][index].x
          element.y = this.state.futureUnits[0][index].y
          element.life = this.state.futureUnits[0][index].life
          element.hasFlag = this.state.futureUnits[0][index].hasFlag
          if (element.hasFlag) {
            let flag = flags[1]
            flag = {x: -1, y: -1}
            flags[1] = flag
            this.setState({
              flags: flags
            })
          }
        }
      });
      
      unitsP2.forEach((element, index) => {
        if (this._hasItMoved(1, index)) {
          element.x = this.state.futureUnits[1][index].x
          element.y = this.state.futureUnits[1][index].y
          element.life = this.state.futureUnits[1][index].life
          element.hasFlag = this.state.futureUnits[1][index].hasFlag
          if (element.hasFlag) {
            let flag = flags[0]
            flag = {x: -1, y: -1}
            flags[0] = flag
            this.setState({
              flags: flags
            })
          }
        }
      });

      units = [unitsP1, unitsP2]
      
      this.setState({
        units: units,
        futureMove: Array(21).fill(Array(32).fill(null)),
        futurePlayers: Array(2).fill(Array(5).fill({})),
        movedUnits: Array(2).fill(Array(5).fill(false)),
      })

      this._changeStep(this.state.step)
    }
  }

  render(){
    console.log(this.state.units)
    return (
      <div className="App">
        <header className="infobar">
          <InfoBar players={this.state.players} turn={this.state.turn} step={this.state.step} />
        </header>
        <div className="main">
          <Board
            players={this.state.players}
            units={this.state.units}
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
