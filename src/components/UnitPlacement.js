import React, { Component } from 'react'
// import PlacementBoard from './PlacementBoard'
import Board from './Board'
import UnitToPlace from './UnitToPlace'

class UnitPlacement extends Component {
  constructor(props){
    super(props)
    this.state = {
      errors: false,
    }
  }

  render(){
    const units = this.props.units
    const player = this.props.player
    const selectedUnit = this.props.selectedUnit.unitNumber
    return (
      <div className="unitSelection-container">
        <div> Place your units!</div>
        <div className="unitPlacement-container">
          {
            this.props.placedUnits[player].map((placedUnit, unit_index) => {
              return !placedUnit &&
                <UnitToPlace
                  key={unit_index}
                  playerIndex={player}unit={units[player][unit_index]}
                  selected={selectedUnit === unit_index}
                />
            })
          }
        </div>
        <div> <button onClick={() => {this.props._startGame()}} > START</button> </div>
        <Board
          placement={true}
          units={units}
          player={player}
          selectedUnit={this.props.selectedUnit}
          _setSelectedUnit={this.props._setSelectedUnit}
          placedUnits={this.props.placedUnits}
          flags={this.props.flags}
          players={this.props.players}
          _placeUnit={this.props._placeUnit}
          step={this.props.step}
        />
      </div>
    )
  }
}

export default UnitPlacement