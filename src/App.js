// import logo from './logo.svg';
import './App.css';
import React, { Component } from 'react'
// import InfoBar from './components/InfoBar'
import IntroScreen from './components/IntroScreen'
import Game from './components/Game'
import UnitSelection from './components/UnitSelection'
import UnitPlacement from './components/UnitPlacement'
import {UNITS, SPRITES} from './utilities/dict'

function preloading(url){
  var img=new Image();
  img.src=url;
}

class App extends Component {
  constructor(props){
    super(props)
    this.state = {
      step: -3,
      player: 0,
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
            strength: 1, speed: 3, x: 12, y: 6, life: 1, hasFlag: false,
          },
          {
            strength: 1, speed: 3, x: 12, y: 5, life: 1, hasFlag: false,
          },
          {
            strength: 2, speed: 2, x: 4, y: 8, life: 2, hasFlag: false,
          },
          {
            strength: 3, speed: 1, x: 5, y: 11, life: 3, hasFlag: false,
          },
          {
            strength: 3, speed: 1, x: 2, y: 5, life: 3, hasFlag: false,
          },
        ],
        [
          {
            strength: 1, speed: 3, x: 0, y: 3, life: 1, hasFlag: false,
          },
          {
            strength: 1, speed: 3, x: 6, y: 18, life: 1, hasFlag: false,
          },
          {
            strength: 2, speed: 2, x: 21, y: 17, life: 2, hasFlag: false,
          },
          {
            strength: 3, speed: 1, x: 6, y: 5, life: 3, hasFlag: false,
          },
          {
            strength: 3, speed: 1, x: 10, y: 11, life: 3, hasFlag: false,
          },
        ]
      ],
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
      ]
    }

    this._selectUnits = this._selectUnits.bind(this);
    this._changeStep = this._changeStep.bind(this);
    this._setSelectedUnit = this._setSelectedUnit.bind(this);
    this._placeUnits = this._placeUnits.bind(this);
    this._placeUnit = this._placeUnit.bind(this);
    this._startGame = this._startGame.bind(this);
    this._circleUnit = this._circleUnit.bind(this);
    this._updateFlags = this._updateFlags.bind(this);
    this._undoMove = this._undoMove.bind(this);
    this._changePosition = this._changePosition.bind(this);
    this._applyMoves = this._applyMoves.bind(this);
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

  _selectUnits(){
    this.setState({
      step: -2,
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

  _undoMove(){
    let futureUnits = [...this.state.futureUnits]
    let futureUnitsHistory = [...this.state.futureUnitsHistory]
    futureUnitsHistory.pop()
    futureUnits = futureUnitsHistory.length ? futureUnitsHistory[futureUnitsHistory.length-1] : Array(2).fill(Array(5).fill(null))
    this.setState({
      futureUnits: futureUnits,
      futureUnitsHistory: futureUnitsHistory,
    })
    this._changeStep(this.state.step, -1)
  }

  _placeUnits(){
    this.setState({
      step: -1,
    })
  }

  _placeUnit(playerNumber, unitNumber, col, row){
    let units = this.state.units
    let currentPlayerUnits = [...units[playerNumber]]
    let currentPlayerUnit = {...currentPlayerUnits[unitNumber]}
    currentPlayerUnit = {...currentPlayerUnit, x: col, y:row}
    currentPlayerUnits[unitNumber] = currentPlayerUnit
    units[playerNumber] = currentPlayerUnits

    let placedUnits = this.state.placedUnits
    let currentPlayerPlacedUnits = [...placedUnits[playerNumber]]
    let playerPlacedUnits = currentPlayerPlacedUnits[unitNumber]
    playerPlacedUnits = true
    currentPlayerPlacedUnits[unitNumber] = playerPlacedUnits
    placedUnits[playerNumber] = currentPlayerPlacedUnits

    let nextUnitNumber = (unitNumber + 1) % 5
    let nextPlayerNumber = (playerNumber === 0) && (unitNumber === 4) ? playerNumber + 1 : playerNumber

    this._setSelectedUnit(nextPlayerNumber,nextUnitNumber, 0)

    this.setState({
      units: units,
      placedUnits: placedUnits,
      player: nextPlayerNumber,
    })

    if (playerNumber === 1 && unitNumber === 4 ) {
      this._startGame()
    }
  }
  
  _startGame(){
    this._setSelectedUnit(0,0,0)
    this.setState({
      step: 0,
    })
  }

  _changeStep(step, direction = 1){
    var nextStep = (step + direction) % 11
    let selectedUnit = [null,null]
    if (nextStep !== 10 ){
      if (nextStep < 5 ){
        selectedUnit = [0, (nextStep % 5)]
      }
      else {
        selectedUnit = [1, (nextStep % 5)]
      }
      if(this.state.units[selectedUnit[0]][selectedUnit[1]].life > 0){
        this._setSelectedUnit(selectedUnit[0],selectedUnit[1], nextStep)
      }else{
        this._changeStep(nextStep, direction)
        return true
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
    return true
  }

  _updateFlags(newFlags){
    this.setState({
      flags: newFlags,
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
        if (this.state.units[opponentNumber][unit_index].life > 0){
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

    if (this.state.flags[opponentNumber].x === x && this.state.flags[opponentNumber].y === y && this.state.flags[opponentNumber].inZone && ((life-damageTaken)>0)){
      futurePlayerUnit = {...futurePlayerUnit, hasFlag: true}
    }
    

    let futureUnitsArray = [null, null]
    futurePlayerUnits[unitNumber] = futurePlayerUnit
    futureUnitsArray[opponentNumber] = futureOpponentUnits
    futureUnitsArray[playerNumber] = futurePlayerUnits

    let futureUnitsHistory = [...this.state.futureUnitsHistory]
    futureUnitsHistory.push(futureUnitsArray)

    this.setState({
      futureUnits: futureUnitsArray,
      futureUnitsHistory: futureUnitsHistory,
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
            this._updateFlags(flags)
          }
          element.x = element.life > 0 ? this.state.futureUnits[playerIndex][index].x : element.x
          element.y = element.life > 0 ? this.state.futureUnits[playerIndex][index].y : element.y
          element.life = element.life > 0 ? this.state.futureUnits[playerIndex][index].life : element.life
          element.hasFlag = this.state.futureUnits[playerIndex][index] && this.state.futureUnits[playerIndex][index].hasFlag && element.life > 0
          if (element.hasFlag) {
            flag = { ...flags[(playerIndex+1)%2], inZone: false }
            flags[(playerIndex+1)%2] = flag
            this._updateFlags(flags)
          }
        });
      })
      
      this.setState({
        units: units,
        futureUnits: Array(2).fill(Array(5).fill({})),
        futureUnitsHistory: [],
      })
      window.dispatchEvent(new CustomEvent("boom"))
      this._changeStep(this.state.step)
    }
  }

  componentDidMount(){
    UNITS.forEach(unit => {
      unit.svg.forEach(url => preloading(url))
    })
    Object.values(SPRITES).forEach(sprite=>{
      sprite.forEach(url => preloading(url))
    })
  }

  render(){
    console.log(this.state)
    return (
      <div className="App">
        {/*<header className="infobar">
           <InfoBar players={this.state.players} turn={this.state.turn} step={this.state.step} /> 
        </header>*/}
        { this.state.step === -3 ?
          <IntroScreen
            _selectUnits={this._selectUnits}
          /> :
          this.state.step === -2 ?
          <UnitSelection
            step={this.state.step}
            _placeUnits={this._placeUnits}
            units={this.state.units}
            _circleUnit={this._circleUnit}
          /> :
          this.state.step === -1 ?
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
          /> :
          <Game
            units={this.state.units}
            step={this.state.step}
            players={this.state.players}
            _changeStep={this._changeStep}
            selectedUnit={this.state.selectedUnit}
            _setSelectedUnit={this._setSelectedUnit}
            flags={this.state.flags}
            _updateFlags={this._updateFlags}
            _undoMove={this._undoMove}
            futureUnits={this.state.futureUnits}
            _changePosition={this._changePosition}
            _applyMoves={this._applyMoves}
          />
        }
      </div>
    );
  }
}

export default App;
