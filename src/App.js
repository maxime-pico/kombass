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
            strength: 1, speed: 3, x: 21, y: 3, life: 1, hasFlag: false,
          },
          {
            strength: 1, speed: 3, x: 21, y: 6, life: 1, hasFlag: false,
          },
          {
            strength: 1, speed: 3, x: 21, y: 17, life: 1, hasFlag: false,
          },
          {
            strength: 2, speed: 2, x: 21, y: 14, life: 2, hasFlag: false,
          },
          {
            strength: 3, speed: 1, x: 17, y: 10, life: 3, hasFlag: false,
          },
        ]
      ],
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

  _updateFlags(newFlags){
    this.setState({
      flags: newFlags,
    })
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
    return (
      <div className="App">
        <header className="infobar">
          {/* <InfoBar players={this.state.players} turn={this.state.turn} step={this.state.step} /> */}
        </header>
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
          />
        }
      </div>
    );
  }
}

export default App;
