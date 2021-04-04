import React, { Component } from 'react'
import Unit from './Unit'

class UnitSelector extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render(){
    const unit = this.props.unit
    const playerIndex = this.props.playerIndex
    const unitIndex = this.props.unitIndex
    const currentType = unit.strength -1
    return (
      unit ? (
        <div className="taskForceSelector-unit">
          <div className="triangle up" onClick={() => this.props._circleUnit(playerIndex, unitIndex, currentType,1)}></div>
          <div className="unit-box">
            <Unit unit={unit} playerIndex={playerIndex} displayUnitInfo />
          </div>
          <div className="triangle down" onClick={() => this.props._circleUnit(playerIndex, unitIndex, currentType,-1)}></div>
        </div>
      ):
      null
    )
  }
}

export default UnitSelector